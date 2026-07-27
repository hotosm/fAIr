# fAIr Helm Chart

Deploys the fAIr backend API and Django-Q async worker, and (optionally) the
frontend SPA.

PostgreSQL is expected to be provided externally (e.g.
[CloudNativePG](https://cloudnative-pg.io/) or a managed database service), with
a bundled single-pod Postgres available for staging / PR-preview / local dev.

## Quick start

```bash
helm install fair oci://ghcr.io/hotosm/charts/fair
```

## Example values

```yaml
externalDatabase:
  host: my-pg-cluster-rw.db.svc
  database: ai
  username: fair
  existingSecret: fair-db-credentials
  existingSecretKey: password

ingress:
  enabled: true
  className: nginx
  hosts:
    - host: fair.example.com
      paths:
        - path: /
          pathType: Prefix

backend:
  envFrom:
    - secretRef:
        name: fair-backend-secrets
```

## Key values

| Parameter | Description | Default |
|---|---|---|
| `externalDatabase.host` | PostgreSQL host | `""` |
| `externalDatabase.existingSecret` | Secret containing DB password | `""` |
| `backend.djangoQ.enabled` | Run Django-Q sidecar for async tasks | `true` |
| `backend.migrate.enabled` | Run migrations on install/upgrade | `true` |
| `ingress.enabled` | Create Ingress resource | `false` |
| `frontend.mode` | `"bundleWithBackend"` or `"cloudfront"` | `"bundleWithBackend"` |

## Frontend

The SPA is delivered by the `fair/frontend` image (`frontend/Dockerfile.prod`),
which is an init container that copies the built assets into a shared volume and
exits - not a running web server. `frontend.mode` picks how they're served:

- **`bundleWithBackend`** (default) - the backend pod serves the SPA at `/` via
  Django + WhiteNoise (`SERVE_FRONTEND=true`, set by the chart); API stays on
  `/api`. One pod, one Service, one ingress path - good for staging, PR-preview
  and simple self-hosted deploys with no AWS.
- **`cloudfront`** - a post-install/upgrade Job syncs the SPA to S3 and
  creates/updates a CloudFront distribution, authenticating via IRSA
  (`frontend.cloudfront.roleArn`). Frontend and API live on separate domains
  (e.g. `fair.example.com` and `api.fair.example.com`). See `values.yaml` for the
  full `frontend.cloudfront.*` options.

Runtime config is injected at container start (written to `config.js`), so the
same image runs in any environment without a rebuild. This follows the same setup
as [hotosm/drone-tm](https://github.com/hotosm/drone-tm). For CloudFront
deployments, set `frontend.runtimeEnv.VITE_BASE_API_URL` to the absolute backend
API URL. The default build-time value remains `/api/v1/` for same-origin
deployments.
