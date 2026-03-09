# PR Draft: Deploy & Infrastructure

**Branch:** `login_hanko` → `develop`
**Type:** Infrastructure / DevOps
**Depends on:** PR de Funcionalidad (debe mergearse primero)

---

## Summary

This PR adds deployment infrastructure for the Hanko SSO integration, including a test environment workflow and improvements to docker compose files.

---

## New Files

### GitHub Workflow
```
.github/workflows/deploy-login-hanko.yml
```
- Builds and pushes images to GHCR
- Deploys to testlogin.fair.hotosm.org via SSH
- Uses Traefik for routing
- Environment: `testlogin`

### Test Environment
```
compose.test.yaml
nginx.conf
```
- Simplified setup for testing Hanko auth
- Uses external Traefik network (`hotosm-test`)
- Services: frontend, backend, db, redis, nginx, migrations

### ZenML Integration
```
infra/zenml/
├── compose.yml
├── Dockerfile.postgres
├── patch_zenml.py
├── README.md
└── verify_postgres_setup.py
```
- Patch to use PostgreSQL instead of MySQL
- MLOps infrastructure for model training

### Systemd Services (Updated)
```
infra/systemd/
├── fAIr-app.service    # NEW - unified app service
├── django-q.service    # DELETED
├── django.service      # DELETED
├── workers.service     # DELETED
└── Readme.md
```

### Scripts
```
manage.sh       # Updated with new commands
setup.sh        # NEW - initial setup script
Makefile        # Build helpers
```

---

## Docker Compose Changes

### `docker-compose.prod.yml`

| Change | Reason |
|--------|--------|
| `/opt/fair-app` → `/opt/fAIr-app` | Consistent naming |
| Bind mounts → Named volumes | Better portability |
| Redis healthcheck fix | Remove unnecessary `-a` flag |
| Healthcheck formatting | YAML best practices |

### `docker-compose.dev.yml`

- Development environment updates
- Auth-libs volume mounts
- Environment variable updates

---

## Required Secrets (GitHub Environment: `testlogin`)

| Secret | Description |
|--------|-------------|
| `EC2_SSH_KEY` | SSH private key for deployment |
| `EC2_HOST` | Server hostname |
| `EC2_USER` | SSH username |
| `COOKIE_SECRET` | Shared cookie encryption secret |

| Variable | Default |
|----------|---------|
| `AUTH_PROVIDER` | `hanko` |

---

## Test Environment Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    testlogin.fair.hotosm.org                │
├─────────────────────────────────────────────────────────────┤
│  Traefik (external, /opt/traefik)                          │
│    ├─ /* → nginx:80 (frontend)                             │
│    └─ /api/* → backend:8000                                │
├─────────────────────────────────────────────────────────────┤
│  compose.test.yaml                                          │
│    ├─ frontend    → syncs HTML to shared volume            │
│    ├─ nginx       → serves static files                    │
│    ├─ backend     → Django API (gunicorn)                  │
│    ├─ db          → PostgreSQL 16 + PostGIS                │
│    ├─ redis       → Session/cache store                    │
│    └─ migrations  → One-shot migration job                 │
└─────────────────────────────────────────────────────────────┘
```

**Note:** Test environment does NOT include:
- Workers (training, predictions)
- Django-Q (background tasks)
- Celery beat

This is intentional for auth testing. Production will need these services.

---

## Production Considerations

### Current State
- Production deploy is **NOT in k8s** (Helm chart commented out in k8s-infra)
- Only STAC API (`stac.ai.hotosm.org`) is deployed via k8s
- Main app likely uses `docker_publish_image.yml` workflow

### Options for Production
1. **Update existing workflow** - Modify `docker_publish_image.yml` to include Hanko config
2. **Create k8s Helm chart** - Full k8s deployment (more work)
3. **Copy testlogin pattern** - SSH-based deploy like testlogin

### Recommendation
Start with Option 1 (update existing workflow) as it's least disruptive.

---

## Migration Path

1. **Merge Functionality PR first** - Ensures code is ready
2. **Test in testlogin.fair.hotosm.org** - Verify auth flow works
3. **Plan production deploy** - Decide on approach (see above)
4. **Create staging environment** - Optional but recommended
5. **Production rollout** - With rollback plan

---

## Test Plan

- [ ] Verify testlogin deploy workflow runs successfully
- [ ] Check Traefik routes correctly
- [ ] Test migrations run on fresh DB
- [ ] Verify frontend serves correctly via nginx
- [ ] Test backend health endpoint
- [ ] Confirm ZenML can connect (if applicable)

---

## Files in this PR

```
.github/workflows/deploy-login-hanko.yml
compose.test.yaml
docker-compose.dev.yml
docker-compose.prod.yml
infra/systemd/django-q.service (DELETED)
infra/systemd/django.service (DELETED)
infra/systemd/fAIr-app.service
infra/systemd/Readme.md
infra/systemd/workers.service (DELETED)
infra/zenml/compose.yml
infra/zenml/Dockerfile.postgres
infra/zenml/patch_zenml.py
infra/zenml/README.md
infra/zenml/verify_postgres_setup.py
Makefile
manage-dev.sh (DELETED or merged)
manage.sh
nginx.conf
setup.sh
```

---

Generated with Claude Code
