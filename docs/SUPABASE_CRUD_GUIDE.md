# Supabase CRUD Guide

## Document Purpose
This guide explains how to perform reliable CRUD operations in PSBUniverse Core using Supabase.

It covers:
1. Which Supabase client to use
2. How to write SELECT/INSERT/UPDATE/DELETE operations
3. How to handle errors and edge cases
4. How to stay aligned with core auth and RBAC architecture

## 1) Choose the Correct Supabase Client

PSBUniverse Core uses two Supabase clients.

| Client | File | Use Case |
|---|---|---|
| Browser/client singleton | src/core/supabase/client.js | User session actions, client-safe reads tied to logged-in user |
| Server admin singleton | src/core/supabase/admin.js | Privileged operations (create users, managed inserts across tables) |

Rule:
1. Never expose service role key in browser code.
2. Never use admin client in client components.

## 2) Common Query Pattern

Use a consistent pattern for every operation:
1. Execute query
2. Check error
3. Validate data shape
4. Return predictable result

Example pattern:

```js
const { data, error } = await supabase
  .from("psb_s_user")
  .select("*")
  .eq("auth_user_id", authUserId)
  .maybeSingle();

if (error) {
  throw new Error(error.message);
}

return data ?? null;
```

## 3) SELECT Examples

### 3.1 Resolve business user from auth identity

```js
const { data: dbUser, error } = await supabase
  .from("psb_s_user")
  .select("*")
  .eq("auth_user_id", authUser.id)
  .maybeSingle();

if (error) throw new Error(error.message);
```

Why:
1. auth.users is identity source.
2. psb_s_user is business profile source.

### 3.2 Load active app-role mappings

```js
const { data: roles, error } = await supabase
  .from("psb_m_userapproleaccess")
  .select("*")
  .eq("user_id", dbUser.user_id)
  .eq("is_active", true);

if (error) throw new Error(error.message);
```

Why:
1. Core app access is role-based and app_id-scoped.
2. Only active mappings should authorize access.

### 3.3 Load cards for one application

```js
const { data: cards, error } = await supabase
  .from("psb_s_appcard")
  .select("*")
  .eq("app_id", moduleAppId)
  .eq("is_active", true)
  .order("display_order", { ascending: true });

if (error) throw new Error(error.message);
```

### 3.4 Load card groups for ordering context

```js
const { data: groups, error } = await supabase
  .from("psb_m_appcardgroup")
  .select("*")
  .eq("app_id", moduleAppId)
  .eq("is_active", true)
  .order("display_order", { ascending: true });

if (error) throw new Error(error.message);
```

### 3.5 Load active card-role mappings

```js
const { data: cardRoleAccess, error } = await supabase
  .from("psb_m_appcardroleaccess")
  .select("*")
  .eq("is_active", true);

if (error) throw new Error(error.message);
```

### 3.6 Resolve auth user from cookie token (server route)

Pattern used by `/api/me/bootstrap`:

```js
import { cookies } from "next/headers";
import { getSupabaseAdmin } from "@/core/supabase/admin";

const cookieStore = await cookies();
const accessToken = cookieStore.get("sb-access-token")?.value;

if (!accessToken) {
  return { authUser: null, dbUser: null, roles: [] };
}

const supabaseAdmin = getSupabaseAdmin();
const { data: authData, error } = await supabaseAdmin.auth.getUser(accessToken);

if (error || !authData?.user) {
  return { authUser: null, dbUser: null, roles: [] };
}
```

Why:
1. Server routes must re-resolve identity from cookie token.
2. This enables middleware-safe and refresh-safe auth bootstrap.

## 4) INSERT Examples

### 4.1 Insert business user after auth user creation

Use server admin flow from src/core/auth/createBusinessUser.js.

```js
const { data: dbUser, error } = await supabaseAdmin
  .from("psb_s_user")
  .insert({
    email,
    auth_user_id: authUserId,
    first_name,
    last_name,
  })
  .select("*")
  .single();
```

Why:
1. Keep UUID to INT bridge in psb_s_user.
2. Preserve existing INT foreign key model across business tables.

### 4.2 Insert user role mappings

```js
const rows = selectedRoleRows.map((row) => ({
  user_id: dbUser.user_id,
  role_id: row.role_id,
  app_id: row.app_id,
  is_active: true,
}));

const { data, error } = await supabaseAdmin
  .from("psb_m_userapproleaccess")
  .insert(rows)
  .select("*");

if (error) throw new Error(error.message);
```

## 5) UPDATE Examples

### 5.1 Update user profile fields

```js
const { data, error } = await supabase
  .from("psb_s_user")
  .update({
    first_name: "Sam",
    phone: "09123456789",
    updated_at: new Date().toISOString(),
  })
  .eq("user_id", dbUser.user_id)
  .select("*")
  .single();

if (error) throw new Error(error.message);
```

### 5.2 Soft-disable app access mapping

```js
const { error } = await supabaseAdmin
  .from("psb_m_userapproleaccess")
  .update({
    is_active: false,
    updated_at: new Date().toISOString(),
  })
  .eq("user_id", userId)
  .eq("role_id", roleId)
  .eq("app_id", appId);

if (error) throw new Error(error.message);
```

## 6) DELETE Examples

Use hard delete carefully. Prefer soft disable where governance history matters.

### 6.1 Delete one card-role mapping

```js
const { error } = await supabaseAdmin
  .from("psb_m_appcardroleaccess")
  .delete()
  .eq("card_id", cardId)
  .eq("role_id", roleId);

if (error) throw new Error(error.message);
```

### 6.2 Delete business user in rollback path

```js
const { error } = await supabaseAdmin
  .from("psb_s_user")
  .delete()
  .eq("user_id", dbUser.user_id);

if (error) throw new Error(error.message);
```

## 7) Error Handling Best Practices

1. Always check error explicitly.
2. Throw or return structured error messages.
3. Validate data shape (array, maybeSingle, single) before use.
4. Add rollback when operation spans multiple tables.
5. Never silently swallow Supabase errors.

Robust multi-step example:

```js
try {
  const auth = await createAuthUser();
  const dbUser = await insertBusinessUser(auth.id);
  const roles = await insertRoleMappings(dbUser.user_id);
  return { auth, dbUser, roles };
} catch (err) {
  await rollbackIfNeeded();
  throw err;
}
```

## 8) Query Safety and Performance Rules

1. Always filter by keys (user_id, app_id, role_id, card_id) where applicable.
2. Always include is_active when access logic depends on active status.
3. Use maybeSingle only when zero or one row is expected.
4. Use single only when exactly one row is required.
5. Keep SELECT columns focused in high-traffic paths.
6. Do not run duplicate auth/role queries in many components; use central context.
7. For server bootstrap endpoints, send no-store cache headers for session-coupled payloads.

## 9) Anti-Patterns to Avoid

1. Using auth_user_id for all business joins.
2. Hardcoding role names in UI checks.
3. Loading roles repeatedly in each page/component.
4. Writing custom password handling in psb_s_user.
5. Running privileged write logic from browser code.

## 10) Practical CRUD Checklist

Before merging any CRUD feature:

1. Correct client selected (browser vs admin).
2. Query uses correct table keys and active filters.
3. Error paths are handled explicitly.
4. Multi-step write operations include rollback strategy.
5. Access-sensitive queries align with core RBAC model.

This keeps data operations safe, auditable, and aligned with PSBUniverse Core architecture.