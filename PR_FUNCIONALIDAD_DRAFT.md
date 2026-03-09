# PR: Hanko SSO Authentication

**Branch:** `login_hanko` → `develop`

## Summary

Integrates Hanko SSO authentication as an alternative to legacy OSM OAuth, enabling single sign-on across the HOT ecosystem via login.hotosm.org.

### Changes

1. **Hanko SSO Authentication** - New `AUTH_PROVIDER=hanko` mode with JWT cookie-based auth
2. **Auth-libs Integration** - Shared web component and Python library
3. **User Onboarding Flow** - Links existing fAIr accounts or creates new ones for Hanko users
4. **User Filtering Mixin** - `HankoUserFilterMixin` for filtering datasets/models by authenticated user
5. **Navbar Updates** - Integration of hanko-auth web component

## New Environment Variables

### Backend (when `AUTH_PROVIDER=hanko`)

| Variable | Required | Description |
|----------|----------|-------------|
| `AUTH_PROVIDER` | Yes | `hanko` or `legacy` (default: `legacy`) |
| `HANKO_API_URL` | Yes | e.g., `https://login.hotosm.org` |
| `COOKIE_SECRET` | Yes | Shared secret for cookie encryption |
| `COOKIE_DOMAIN` | No | e.g., `.hotosm.org` |
| `LOGIN_URL` | No | Login service URL for redirects |
| `FRONTEND_URL` | No | Frontend URL for redirects after onboarding |

### Frontend

| Variable | Description |
|----------|-------------|
| `VITE_AUTH_PROVIDER` | `hanko` or `legacy` |
| `VITE_HANKO_URL` | Hanko API URL (e.g., `https://login.hotosm.org`) |

## New Dependencies

**Backend:** `hotosm-auth[django]==0.2.10`

**Frontend:** `@hotosm/hanko-auth`

## Files Changed

### Backend
- `backend/login/authentication.py`
- `backend/login/hanko_helpers.py` (new)
- `backend/login/urls.py`
- `backend/login/views.py`
- `backend/fairproject/settings.py`
- `backend/fairproject/urls.py`
- `backend/core/views.py`
- `backend/pyproject.toml`

### Frontend
- `frontend/src/app/providers/auth-provider.tsx`
- `frontend/src/config/env.ts`
- `frontend/src/config/index.ts`
- `frontend/src/types/hanko.d.ts` (new)
- `frontend/src/vite-env.d.ts`
- `frontend/src/main.tsx`
- `frontend/src/components/layouts/navbar/navbar.tsx`
- `frontend/src/components/layouts/navbar/navbar.module.css`
- `frontend/src/components/layouts/navbar/user-profile.tsx`
- `frontend/src/components/ui/drawer/drawer.tsx`
- `frontend/package.json`

## New API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/auth/onboarding/` | GET | Onboarding callback from login service |
| `/api/v1/auth/status/` | GET | Check auth status for Hanko users |

## How it Works

### Legacy Mode (`AUTH_PROVIDER=legacy`)
No changes - OSM OAuth via `access-token` header.

### Hanko Mode (`AUTH_PROVIDER=hanko`)
1. User authenticates via login.hotosm.org
2. JWT cookie set by Hanko
3. `HankoAuthMiddleware` validates JWT
4. `HankoAuthentication` checks user mapping
5. If mapping exists → authenticated
6. If no mapping → redirect to onboarding

### Onboarding
New Hanko users choose:
- **"Yes, I had an account"** → Connect OSM to recover existing fAIr account
- **"No, I'm new"** → Create account with synthetic osm_id

## Test Plan

- [ ] Legacy auth still works (`AUTH_PROVIDER=legacy`)
- [ ] Hanko login flow works
- [ ] Onboarding for new users
- [ ] Onboarding for legacy users (OSM connect)
- [ ] `/api/v1/auth/status/` returns correct state
- [ ] Navbar shows user profile correctly
- [ ] `?mine=true` filter works

## Excluded (Deploy PR)

```
.github/workflows/deploy-login-hanko.yml
compose.test.yaml
nginx.conf
frontend/Dockerfile.*
frontend/*entrypoint.sh
backend/Dockerfile.API
```

## Backward Compatibility

- `AUTH_PROVIDER=legacy` (default): No changes
- Existing users continue working with legacy auth
