# fAIr Helm Chart

Deploys the fAIr backend API and Django-Q async worker.

The frontend is deployed separately (S3 + CloudFront via GitHub Actions).
PostgreSQL is expected to be provided externally (e.g.
[CloudNativePG](https://cloudnative-pg.io/) or a managed database service).

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
        - path: /api
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
