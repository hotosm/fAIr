# Names and URLs follow k8s-infra/apps/staging/fair. Needs kubectl on the cluster context.
# Run the API end-to-end test against staging (set FAIR_TOKEN to skip the prompt)
e2e *args:
    #!/usr/bin/env bash
    set -euo pipefail
    ns=fair-staging
    api="${FAIR_API:-https://stage.ai.hotosm.org}"
    # The base model test.py registers, as a Knative service name.
    ksvc=sklearn-rgb-segmentation

    echo "== cluster checks"
    kubectl -n argocd get applications --no-headers -o custom-columns=APP:.metadata.name,HEALTH:.status.health.status \
        | grep -E '^fair-staging-pr-[0-9]+ +Healthy$' \
        || { echo "no Healthy fair-staging-pr-* app. Open a stage -> main PR and wait for it to deploy."; exit 1; }
    kubectl -n "$ns" wait --for=condition=Available deployment --all --timeout=10m
    kubectl -n "$ns" get deployment fair-backend -o jsonpath='backend image: {.spec.template.spec.containers[0].image}{"\n"}'
    kubectl -n "$ns" get cronjob fair-backend-knative-reconcile -o name
    kubectl get namespace zenml-pipelines-stage fair-knative -o name

    if [ -z "${FAIR_TOKEN:-}" ]; then
        read -rsp "Paste the hanko cookie from https://stage.ai.hotosm.org: " FAIR_TOKEN; echo
    fi
    # Keep only the JWT, in case the paste carried extra cookie text.
    [[ "$FAIR_TOKEN" =~ eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+ ]] || { echo "no JWT in the token"; exit 1; }
    FAIR_TOKEN="${BASH_REMATCH[0]}"

    # The staging DB is fresh per PR, and registering a base model needs an admin.
    osm_id=$(curl -fsS -H "Authorization: Bearer $FAIR_TOKEN" "$api/api/v1/auth/me/" \
        | python3 -c 'import json, sys; print(json.load(sys.stdin)["osm_id"])')
    kubectl -n "$ns" exec deployment/fair-backend -c api -- python manage.py shell -c "
    from accounts.models import OsmUser
    OsmUser.objects.filter(osm_id=$osm_id).update(is_staff=True, is_superuser=True)
    print('admin:', OsmUser.objects.get(osm_id=$osm_id).username)"

    mlflow_secret() {
        kubectl -n "$ns" get secret mlflow-admin-password -o jsonpath="{.data.$1}" | base64 -d
    }

    echo "== API test"
    # Run in the backend pod, which has httpx and reaches the ingress-less MLflow directly.
    kubectl -n "$ns" exec -i deployment/fair-backend -c api -- env \
        FAIR_TOKEN="$FAIR_TOKEN" \
        FAIR_API="$api" \
        FAIR_STAC="${FAIR_STAC:-https://stac.stage.ai.hotosm.org/stac}" \
        FAIR_MINIO="" \
        FAIR_MLFLOW="http://mlflow:5000" \
        FAIR_MLFLOW_USER="$(mlflow_secret adminUsername)" \
        FAIR_MLFLOW_PASSWORD="$(mlflow_secret adminPassword)" \
        FAIR_KNATIVE_TAG=staging \
        python - {{ args }} < "{{ justfile_directory() }}/test.py"

    echo "== Knative checks"
    # Staging shares fair-knative with production and serves only under the `staging` tag.
    kubectl -n fair-knative wait --for=condition=Ready "ksvc/$ksvc" --timeout=2m
    kubectl -n fair-knative get ksvc "$ksvc" -o jsonpath='{range .status.traffic[*]}{.tag}{" "}{.url}{"\n"}{end}' \
        | grep -E "^staging https?://staging-$ksvc\.predict\.ai\.hotosm\.org$"
    curl -fsS "https://staging-$ksvc.predict.ai.hotosm.org/health"; echo
