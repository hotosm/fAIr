# fAIr Helm Chart

Deploys the fAIr backend API, its django_tasks worker and, optionally, the frontend SPA:

```bash
helm install fair oci://ghcr.io/hotosm/charts/fair
```

Values, frontend modes and CloudFront setup are on [Infrastructure](https://hotosm.github.io/fAIr/architecture/infrastructure/#helm-chart). `values.yaml` lists every value.
