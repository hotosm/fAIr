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
| `serviceAccount.knativeRbac` | Role/RoleBinding to manage Knative Services in the release namespace | `true` |
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

### CloudFront mode

The post-install/upgrade Job:

1. Syncs the frontend to a versioned S3 path.
2. Finds or creates the CloudFront distribution and Origin Access Control.
3. Updates the distribution to the new version and invalidates its cache.

`403`/`404` return `/index.html` with a `200`, so client-side routes work.

#### Configuration

| Parameter | Description | Default |
|---|---|---|
| `frontend.cloudfront.roleArn` | IAM role ARN for IRSA (**required**) | `""` |
| `frontend.cloudfront.s3Bucket` | S3 bucket name (**required**) | `""` |
| `frontend.cloudfront.region` | AWS region | `"us-east-1"` |
| `frontend.cloudfront.version` | S3 path prefix; defaults to `appVersion` | `""` |
| `frontend.cloudfront.aliases` | Custom domain aliases | `[]` |
| `frontend.cloudfront.acmCertificateArn` | ACM certificate ARN (required with `aliases`) | `""` |
| `frontend.cloudfront.priceClass` | CloudFront price class | `"PriceClass_All"` |

Each release remains in S3. To roll back, set `frontend.cloudfront.version` to a
previous app version and re-sync.

#### Setup

Before the first deployment:

1. Create an S3 bucket.
2. For a custom domain, create and validate an ACM certificate in `us-east-1`.
3. Create an IRSA role trusted by the chart's service account, with permission
   to manage the bucket, distribution, Origin Access Control, and invalidations.
4. Set the CloudFront values and deploy. The Job creates the distribution.
5. Point the frontend domain to the distribution with a Route53 alias.

The Job uses IRSA and does not accept static AWS keys. If
`serviceAccount.create` is `false`, annotate the existing service account with
the role ARN yourself.

#### HOT deployment

We set up the S3 bucket and AWS stuff using the k8s-infra
repo, via OpenTofu in production.
