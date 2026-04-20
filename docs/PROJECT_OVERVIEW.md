# Project Overview

## Document Purpose
This document provides a complete technical overview of PSBUniverse Core.

Use this as the primary onboarding reference for:
1. New developers
2. Architects
3. Reviewers of auth, RBAC, and module integration changes

## 1) System Summary

PSBUniverse Core is a modular SaaS host application.

It is built to separate:
1. Platform concerns (core)
2. Domain concerns (modules)

Core responsibilities:
1. Authentication and identity mapping
2. Business user and role context
3. Application entry RBAC
4. Dynamic module discovery and route resolution

Module responsibilities:
1. Domain features and workflows
2. Card-level feature filtering
3. Module-specific UI behavior

## 2) Architectural Model

### Core layer
Contains reusable platform services that every module depends on.

Main platform capabilities:
1. Auth context lifecycle
2. User-role mapping
3. Access helpers
4. Route gating
5. Shared shell layout

### Module layer
Contains isolated feature domains loaded by core.

Each module provides:
1. Metadata (key, app_id, name)
2. Routes list
3. React components for feature pages

### Why this split matters
1. Consistent security behavior
2. Faster feature delivery by module teams
3. Lower long-term maintenance cost

## 3) Authentication System

### Identity source
Supabase Auth provides auth user identity (UUID).

### Business user source
psb_s_user provides business profile and domain relationships (INT user_id).

### Runtime mapping
1. authUser.id is resolved from Supabase session.
2. dbUser is resolved from psb_s_user by auth_user_id.
3. dbUser.user_id is used for role and business joins.

This separation keeps auth and domain layers clean.

## 4) RBAC System

RBAC uses a two-layer model.

### Layer A: App access (core)
Data source:
1. psb_m_userapproleaccess

Check:
1. hasAppAccess(userRoles, app_id)

Effect:
1. Dashboard hides unauthorized modules.
2. Direct route access is blocked for unauthorized users.

### Layer B: Card access (module)
Data sources:
1. psb_s_appcard
2. psb_m_appcardgroup
3. psb_m_appcardroleaccess

Check:
1. hasCardAccess(card_id, userRoles, cardRoleAccess)

Effect:
1. Module features can be shown/hidden per role mapping.

## 5) End-to-End Data Flow

```text
Login request
  -> Supabase auth session
  -> authUser.id
  -> query psb_s_user by auth_user_id
  -> dbUser.user_id
  -> query active role mappings in psb_m_userapproleaccess
  -> roles in auth context
  -> core app access checks by app_id
  -> module route render if authorized
  -> module card filtering by card-role mapping
```

## 6) Layer Responsibilities

| Layer | Owns | Must Not Own |
|---|---|---|
| Core | Auth, user mapping, app-level RBAC, route entry guard | Domain feature behavior |
| Module | Domain UI, card-level filtering, feature interactions | Global auth identity and app-level authorization policy |

## 7) Key Runtime Files

| File | Purpose |
|---|---|
| src/app/login/page.js | Supabase login UI and session handoff to dashboard |
| src/app/api/me/bootstrap/route.js | Server-resolved auth + business user + role payload |
| src/app/dashboard/page.js | Setup-driven dashboard card resolver with fallback strategies |
| src/app/profile/page.js | Profile UI backed by core auth context |
| src/core/auth/AuthProvider.js | Loads and stores authUser, dbUser, roles, loading |
| src/core/auth/useAuth.js | Accesses auth context safely |
| src/core/auth/access.js | hasAppAccess and hasCardAccess helpers |
| src/core/auth/DashboardModules.js | Filters module list by app access |
| src/core/auth/ModuleAccessGate.js | Blocks unauthorized module routes |
| src/modules/loadModules.js | Discovers module definitions from src/modules module index files |
| src/app/[...modulePath]/page.js | Dynamic route resolution + core access gate |
| src/middleware.js | Redirects unauthenticated requests to /login |

## 8) Why This Architecture Was Chosen

1. Prevent duplicated auth and RBAC logic
2. Keep security enforcement centralized
3. Enable modular feature delivery at scale
4. Preserve existing business table model with INT foreign keys

## 9) What Is Working Today

1. Global auth context is active.
2. Login/logout and session guard are active.
3. App-level RBAC is enforced in dashboard and route entry.
4. Module loading and route resolution are dynamic.
5. Card-level helper exists for modules.

## 10) Current Constraints

1. src/modules is now the canonical module location.
2. Card-level filtering behavior is available in core helper but depends on module implementation.
3. supabase/migrations folder exists but currently has no SQL files.

## 11) Development Principles

1. Keep platform enforcement in core.
2. Keep business feature logic in modules.
3. Use DB-driven access logic only.
4. Avoid hardcoded permission logic.

## 12) Recent Platform Changes (April 2026)

This release introduced a full core-first auth and dashboard stabilization pass.

Major outcomes:
1. Login/session handoff now waits for server bootstrap visibility before dashboard navigation.
2. Auth initialization now supports bootstrap fallback when client session state is stale.
3. Dashboard now resolves visible cards from setup source-of-truth tables before module fallback.
4. Catch-all module route is updated for Next.js 16 params handling (`await params`).
5. Legacy `user-master` module/session runtime stack is removed from active flow.

Full details are tracked in `docs/CHANGELOG.md`.

This document should be the first read before modifying authentication, RBAC, module registration, or route behavior.