# Add Hanko SSO Authentication

## Summary

Integrates Hanko SSO authentication as an alternative to legacy OSM OAuth, enabling single sign-on across the HOT ecosystem via login.hotosm.org.

**Key changes:**
- New `AUTH_PROVIDER` setting to switch between `legacy` (current) and `hanko` modes
- Hanko auth uses JWT cookies instead of access-token headers
- User onboarding flow to link existing accounts or create new ones
- Shared auth-libs web component for login UI

**This PR is functionality only.** Deploy configuration (Dockerfiles, workflows, nginx) comes in a separate PR.

## For Deployment: Required Secrets & Variables

### Backend Environment Variables

When deploying with `AUTH_PROVIDER=hanko`:

| Variable | Required | Example | Description |
|----------|----------|---------|-------------|
| `AUTH_PROVIDER` | Yes | `hanko` | Set to `hanko` to enable SSO |
| `HANKO_API_URL` | Yes | `https://login.hotosm.org` | Hanko service URL |
| `COOKIE_SECRET` | Yes | `<shared-secret>` | **Must match login service** - for cookie encryption |
| `COOKIE_DOMAIN` | Yes | `.hotosm.org` | Domain for auth cookies |
| `LOGIN_URL` | No | `https://login.hotosm.org` | Login service URL for redirects |
| `FRONTEND_URL` | Yes | `https://fair.hotosm.org` | Frontend URL for redirects |

### Frontend Environment Variables

| Variable | Required | Example | Description |
|----------|----------|---------|-------------|
| `VITE_AUTH_PROVIDER` | Yes | `hanko` | Must match backend |
| `VITE_HANKO_URL` | Yes | `https://login.hotosm.org` | Hanko service URL |

### Important Notes

1. **`COOKIE_SECRET` must be shared** with the login service (login.hotosm.org) - coordinate with login team
2. **`COOKIE_DOMAIN`** should be `.hotosm.org` for production so cookies work across subdomains
3. **Default is `legacy` mode** - existing deployments continue working without changes

## New Dependencies

| Package | Location | Notes |
|---------|----------|-------|
| `hotosm-auth[django]==0.2.10` | Backend (PyPI) | Hanko auth middleware & helpers |
| `@hotosm/hanko-auth` | Frontend (npm) | Login web component |

## New API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/auth/onboarding/` | GET | Callback from login service after onboarding |
| `/api/v1/auth/status/` | GET | Check authentication status |

## How it Works

### Legacy Mode (default)
```
AUTH_PROVIDER=legacy
```
No changes - continues using OSM OAuth with access-token header.

### Hanko Mode
```
AUTH_PROVIDER=hanko
```
1. User clicks login → redirected to login.hotosm.org
2. Hanko sets JWT cookie after authentication
3. Backend middleware validates JWT cookie
4. If user mapping exists → authenticated
5. If no mapping → user goes through onboarding

### Onboarding Flow
New Hanko users choose:
- **"I had an account"** → Connect OSM to recover existing fAIr data
- **"I'm new"** → Create fresh account with synthetic ID

## Test Plan

- [ ] Legacy auth continues working (`AUTH_PROVIDER=legacy`)
- [ ] Hanko login/logout flow works
- [ ] New user onboarding creates account
- [ ] Existing user onboarding recovers data
- [ ] Navbar shows correct user state
- [ ] Protected routes redirect to login correctly
- [ ] `?mine=true` filter works for both auth types

## Backward Compatibility

- **Default is `legacy`** - no action needed for existing deployments
- Existing users continue working with OSM OAuth
- Can switch to `hanko` when ready by setting environment variables
