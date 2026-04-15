# Changelog

## 2026-04-16 Core Refactor And Stability Update

This release consolidates authentication, routing, dashboard access resolution, and profile rendering into a core-first architecture.

### 1) Core Auth And Session

Added:
1. `src/core/auth/AuthProvider.js`
2. `src/core/auth/useAuth.js`
3. `src/core/auth/access.js`

Behavior changes:
1. Auth context now resolves `authUser`, `dbUser`, and active `roles` from one place.
2. `sb-access-token` cookie is synchronized from Supabase session events.
3. Auth hydration supports background refresh for `TOKEN_REFRESHED` and `USER_UPDATED`.
4. Initialization includes bootstrap fallback when `supabase.auth.getUser()` is stale or unavailable.

### 2) Bootstrap Endpoint For Server-Resolved Identity

Added:
1. `src/app/api/me/bootstrap/route.js`

Behavior:
1. Reads `sb-access-token` from request cookies.
2. Resolves Supabase auth user from access token.
3. Resolves business user from `psb_s_user` using `auth_user_id` with email fallback.
4. Auto-syncs `auth_user_id` when missing/mismatched.
5. Loads active role mappings from `psb_m_userapproleaccess` and enriches role/app display names.
6. Enriches company, department, and status labels for profile/dashboard.
7. Returns no-store payload: `{ authUser, dbUser, roles }`.

### 3) Login Flow Stabilization

Updated:
1. `src/app/login/page.js`

Behavior changes:
1. Login uses `supabase.auth.signInWithPassword`.
2. Access token cookie is set client-side after successful sign-in.
3. Login waits briefly for `/api/me/bootstrap` to confirm server session visibility.
4. Redirect now uses `window.location.assign("/dashboard")` for full navigation handoff.

### 4) Route Guard And Shell Behavior

Updated:
1. `src/middleware.js`
2. `src/shared/components/layout/AppLayout.js`

Behavior changes:
1. Middleware now validates the trimmed cookie value (not just cookie object presence).
2. API routes remain excluded from middleware matcher.
3. App shell auth logic now depends on `useAuth()`.
4. Login page bypass rendering is explicit.
5. Logout uses `supabase.auth.signOut()` and clears `sb-access-token`.

### 5) Dashboard Data Resolution

Added/Updated:
1. `src/app/dashboard/page.js`
2. `src/core/auth/DashboardModules.js`

Behavior changes:
1. Dashboard attempts setup-driven cards first:
   - `psb_m_userapproleaccess`
   - `psb_m_appcardgroup`
   - `psb_s_appcard`
   - `psb_m_appcardroleaccess`
2. Cards are filtered by active app-role scope and card-role mappings.
3. Ordering is deterministic across app/group/card order values.
4. Fallback order when setup cards are unavailable:
   - dynamic module cards from `loadModules()`
   - assigned app tiles from `psb_s_application`
5. Banner organization block is currently fixed/static in `DashboardModules` and not DB-driven.

### 6) Module Routing And Access Gate

Added/Updated:
1. `src/app/[...modulePath]/page.js`
2. `src/core/auth/ModuleAccessGate.js`
3. `src/modules/loadModules.js`

Behavior changes:
1. Catch-all route now awaits `params` for Next.js 16 compatibility.
2. Route matching still uses longest-path-first sort by module route path length.
3. Matched module routes are wrapped by `ModuleAccessGate` for app-level RBAC.
4. Unknown routes return `notFound()`.

### 7) Profile Page Migration

Updated:
1. `src/app/profile/page.js`

Behavior changes:
1. Profile uses `useAuth()` state instead of legacy module session hooks.
2. Role display is grouped by application from resolved role mappings.
3. Password update uses `supabase.auth.updateUser({ password })`.
4. Request-update mailto uses resolved company admin email when available.

### 8) Supabase Client Consolidation

Added:
1. `src/core/supabase/client.js`
2. `src/core/supabase/admin.js`

Behavior:
1. Browser singleton client for user-session operations.
2. Server-only admin singleton for privileged API operations.

### 9) Shared UI Wrappers Added

Added:
1. `src/shared/components/ui/Button.js`
2. `src/shared/components/ui/Card.js`
3. `src/shared/components/ui/Input.js`
4. `src/shared/components/ui/Modal.js`
5. `src/shared/components/ui/Table.js`
6. `src/shared/components/ui/Badge.js`
7. `src/shared/components/ui/index.js`
8. `src/shared/components/layout/PageContainer.js`

Purpose:
1. Provide consistent wrapper components over React-Bootstrap primitives.
2. Centralize reusable styling hooks and class contracts.

### 10) Legacy User-Master Stack Removal

Removed:
1. Legacy module-layer login/session/admin service stack under `src/modules/user-master/**`.
2. Query providers and user-master realtime bridge previously tied to old session model.

Result:
1. Core auth context is now the single runtime source for identity and access.

### 11) Known Non-Blocking Warnings

Current build/runtime warnings still present:
1. Next middleware convention deprecation warning (`middleware` to `proxy`).
2. Dynamic import expression warning in `src/modules/loadModules.js` import trace.

These warnings do not block build output in the current state.
