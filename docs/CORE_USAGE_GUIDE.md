# Core Usage Guide

## Document Purpose
This guide explains how to use PSBUniverse Core in real development scenarios.

It covers:
1. Runtime auth behavior
2. Role loading and enforcement
3. Route and dashboard access behavior
4. How modules should interact with core services

## 1) Core Runtime Responsibilities

Core is responsible for:
1. Resolving authenticated identity
2. Resolving business user profile
3. Resolving active role mappings
4. Enforcing app entry permissions
5. Hosting dynamic modules

Modules should not duplicate these responsibilities.

## 2) Key Core Components

| Component | File | Purpose |
|---|---|---|
| Auth provider | src/core/auth/AuthProvider.js | Global source of authUser, dbUser, roles, loading |
| Auth hook | src/core/auth/useAuth.js | Access context safely from UI components |
| Access helpers | src/core/auth/access.js | hasAppAccess and hasCardAccess checks |
| Dashboard RBAC filter | src/core/auth/DashboardModules.js | Shows only allowed modules |
| Route RBAC gate | src/core/auth/ModuleAccessGate.js | Blocks unauthorized module pages |
| Module loader | src/modules/loadModules.js | Dynamic module discovery |
| Middleware | src/middleware.js | Redirects unauthenticated users to /login |

## 3) Auth Runtime Flow in Core

1. User logs in from src/app/login/page.js.
2. Session token cookie is set.
3. Login waits briefly for /api/me/bootstrap to confirm server session visibility.
4. Login performs full navigation to /dashboard.
5. AuthProvider runs and calls supabase.auth.getUser().
6. If getUser is stale or fails, AuthProvider attempts bootstrap fallback.
7. Core maps auth user to psb_s_user by auth_user_id.
8. Core loads active rows from psb_m_userapproleaccess by dbUser.user_id.
9. Core exposes all values via useAuth.

### Session cookie contract
1. Cookie name: sb-access-token
2. Writer locations:
  1. src/app/login/page.js (post sign-in)
  2. src/core/auth/AuthProvider.js (session and auth state events)
3. Clear location:
  1. src/core/auth/AuthProvider.js on signed out

## 4) Using useAuth Correctly

Basic usage:

```js
import { useAuth } from "@/core/auth/useAuth";

export default function ProfileBadge() {
  const { authUser, dbUser, roles, loading } = useAuth();

  if (loading) return <p>Loading...</p>;
  if (!authUser || !dbUser) return <p>No active session.</p>;

  return (
    <div>
      <p>Email: {dbUser.email}</p>
      <p>Business User ID: {dbUser.user_id}</p>
      <p>Role Rows: {roles.length}</p>
    </div>
  );
}
```

Rules:
1. Always handle loading state.
2. Always handle null authUser/dbUser.
3. Never call useAuth outside AuthProvider.

## 5) App Access Enforcement Flow

Core checks app access in two places:
1. Dashboard module visibility
2. Dynamic module route rendering

Logic source:
1. hasAppAccess(userRoles, appId)

Effect:
1. User cannot open module if no active mapping for app_id.
2. Even direct URL access is denied by route gate.

## 6) Module Integration with Core

When building module features:
1. Read auth and roles through useAuth.
2. Use app_id in module export so core can enforce access.
3. Use hasCardAccess for feature card filtering.

Do not:
1. Build a separate module auth provider.
2. Re-fetch auth user in every page.
3. Hardcode app-level permission logic.

## 7) Real Usage Scenario: Add New Protected Module

### Step A: Data setup
1. Add app row in psb_s_application.
2. Add roles in psb_s_role.
3. Add user-role-app mappings in psb_m_userapproleaccess.

### Step B: Module setup
1. Create modules/my-module/src/index.js.
2. Export key, app_id, name, routes.

### Step C: Validation
1. Login as user with mapping -> module appears and opens.
2. Login as user without mapping -> module hidden and route blocked.

## 8) Real Usage Scenario: Provision User in Core

Use createBusinessUser helper for governed flow.

What it does:
1. Creates auth user in Supabase auth.
2. Inserts business user row in psb_s_user.
3. Inserts role rows in psb_m_userapproleaccess.
4. Performs rollback on downstream failure.

This flow is implemented in src/core/auth/createBusinessUser.js.

## 9) Troubleshooting Guide

### Issue: User logs in but sees no modules
Check:
1. Is dbUser resolved from auth_user_id?
2. Are role rows active in psb_m_userapproleaccess?
3. Does module export valid app_id?

### Issue: User gets redirected back to /login after sign in
Check:
1. Does /api/me/bootstrap return authUser.id after login?
2. Is sb-access-token present in browser cookies?
3. Is middleware checking token value (not only cookie object)?
4. Are you testing against the active server port and not a stale process?

### Issue: Route opens but should be blocked
Check:
1. ModuleAccessGate receives appId.
2. hasAppAccess compares role.app_id correctly.
3. Role row has is_active = true unexpectedly.

### Issue: Module cards show incorrectly
Check:
1. Card query scoped by app_id and is_active.
2. Card-role mappings loaded with is_active = true.
3. hasCardAccess used before rendering card actions.

## 10) Core Usage Rules

Always:
1. Use core auth context as the only user-state source.
2. Use DB-driven app and card access checks.
3. Keep app access enforcement in core.

Never:
1. Reimplement app-level access in modules.
2. Hardcode role names or app access lists.
3. Mix auth UUID logic directly into business table joins.

## 11) Operational Checklist

Before deploying changes that touch auth/RBAC:

1. Build passes.
2. Login flow verified.
3. Unauthorized route access verified blocked.
4. Dashboard visibility verified for multiple users.
5. Module cards verified against role mappings.

## 12) Dashboard Resolution Order

Dashboard module rendering now follows this order:
1. Setup-source-of-truth cards from:
  1. psb_m_userapproleaccess
  2. psb_m_appcardgroup
  3. psb_s_appcard
  4. psb_m_appcardroleaccess
2. Dynamic module card fallback from src/modules/loadModules.js.
3. Assigned application tile fallback from psb_s_application.

This prevents hardcoded module cards from overriding active setup mappings.

This guide should be used as the default reference when implementing or reviewing any core-layer behavior.