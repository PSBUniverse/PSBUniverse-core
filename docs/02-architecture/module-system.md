# Module System

This guide covers everything about building modules: the required contract, folder structure, routing, auth integration, and the step-by-step build process.

---

## What Is a Module?

A module is a self-contained feature that plugs into PSBUniverse Core. Each module lives in its own folder under `src/modules/` and is automatically discovered by the platform at runtime.

**Core** handles authentication, RBAC, and routing.
**Your module** handles domain features, pages, and workflows.

---

## Folder Structure

```
src/modules/<module-name>/
  index.js              ← Module definition (required)
  pages/
    DashboardPage.js    ← Route-level screens (server components)
  components/
    MyWidget.js         ← Interactive UI pieces (client components)
  services/             ← Optional: business logic layer
  repo/                 ← Optional: Supabase query layer
  model/                ← Optional: DB-to-UI field mapping
  hooks/                ← Optional: React hooks for state management
  utils/                ← Optional: helpers
```

The only **required** file is `index.js`. Everything else is added as your module grows.

---

## Module Definition Contract

Every module must export a default object from `index.js`:

```js
const myModule = {
  key: "metal-buildings",
  app_id: 1,
  name: "Metal Buildings",
  description: "Metal Buildings application.",
  icon: "bi-building",
  group_name: "Applications",
  group_desc: "Business applications.",
  order: 200,
  routes: [
    { path: "/metal-buildings", page: "DashboardPage" },
    { path: "/metal-buildings/settings", page: "SettingsPage" },
  ],
};

export default myModule;
```

### Field Reference

| Field | Required | Purpose |
|-------|----------|---------|
| `key` | Yes | Unique module ID (lowercase, dashes, no spaces) |
| `app_id` | Yes | Application ID from `psb_s_application`. Used by core for RBAC checks. |
| `name` | Yes | Display name shown on the dashboard |
| `description` | No | Short text shown under the module card |
| `icon` | No | Bootstrap icon class (e.g. `bi-building`) |
| `group_name` | No | Dashboard group this card belongs to |
| `group_desc` | No | Description for the group |
| `order` | No | Sort order (lower = appears first) |
| `routes` | Yes | Array of route definitions (see below) |

### Route Definition

Each route maps a URL to a page file:

```js
{ path: "/metal-buildings/settings", page: "SettingsPage" }
```

- `path` — The URL the user visits. **Must** start with `/`.
- `page` — The filename inside your `pages/` folder, **without** the `.js` extension.

The system resolves `SettingsPage` to `src/modules/metal-buildings/pages/SettingsPage.js`.

**You do not import the component** — core auto-discovers it at runtime.

---

## Server Components vs Client Components

Because pages are loaded via Node.js runtime import (not webpack), there's one important rule:

> **Page files in `pages/` must be server components.**
> Do NOT put `"use client"` at the top of a page file.

For interactive UI, import client components from the page:

```js
// pages/DashboardPage.js — server component (no directive)
import MyWidget from "../components/MyWidget";

export default function DashboardPage() {
  return <MyWidget />;
}
```

```js
// components/MyWidget.js — client component
"use client";

export default function MyWidget() {
  return <h1>Hello World!</h1>;
}
```

This is the standard Next.js App Router pattern.

---

## How Auto-Discovery Works

When the app starts, core scans every folder inside `src/modules/`. If it finds an `index.js`, it reads the module definition and registers the routes automatically.

When a user visits `/metal-buildings`:

1. The catch-all route (`src/app/[...modulePath]/page.js`) receives the URL segments.
   - **Important:** In Next.js 16, `params` is async and must be `await`ed before reading `modulePath`.
2. `loadModules()` loads all module definitions.
3. Routes are sorted by path length (longest first, so `/metal-buildings/settings` matches before `/metal-buildings`).
4. The first matching route is found.
5. `ModuleAccessGate` checks if the user has access to this module's `app_id`.
6. If authorized, the page component renders. If not, a "No Access" screen appears.
7. If no route matches at all, a 404 page is returned.

**You never need to edit any file outside your module folder.**

---

## Using Auth in Your Module

Use the `useAuth()` hook from core to access the current user's identity and roles:

```js
import { useAuth } from "@/core/auth/useAuth";

function MyFeature() {
  const { authUser, dbUser, roles, loading } = useAuth();

  if (loading) return <p>Loading...</p>;
  if (!dbUser) return <p>No business user found.</p>;

  return <div>User ID: {dbUser.user_id}</div>;
}
```

**Rules:**
1. Call `useAuth()` once and pass state down to child components.
2. Do **not** call `supabase.auth.getUser()` directly in module components.
3. Do **not** build a separate auth provider inside your module.

---

## Card Access Filtering

Core provides `hasCardAccess()` for filtering which features a user can see within your module:

```js
import { hasCardAccess } from "@/core/auth/access";
import { useAuth } from "@/core/auth/useAuth";

function CardsView({ cards, cardRoleAccess }) {
  const { roles } = useAuth();

  const visibleCards = cards.filter((card) =>
    hasCardAccess(card.card_id, roles, cardRoleAccess)
  );

  return visibleCards.map((card) => (
    <div key={card.card_id}>{card.card_name}</div>
  ));
}
```

### SQL Pattern for Loading Cards

```sql
SELECT c.*, g.*
FROM psb_s_appcard c
JOIN psb_m_appcardgroup g ON g.group_id = c.group_id
WHERE c.app_id = :module_app_id
  AND c.is_active = true
ORDER BY g.display_order, c.display_order;
```

Card-role mappings:

```sql
SELECT * FROM psb_m_appcardroleaccess WHERE is_active = true;
```

---

## Step-by-Step: Building a New Module

### 1. Register the App in the Database

If your app doesn't already exist in `psb_s_application`, add a row there first. This gives you an `app_id`.

### 2. Define Roles

Roles are governed centrally. If the needed roles don't exist yet, add them in `psb_s_role`. This is typically done by a senior dev or tech lead.

### 3. Add User-App-Role Mappings

Add rows in `psb_m_userapproleaccess` to link users → roles → your app. This is what gives users access to your module.

### 4. Set Up Cards and Groups

- Create groups in `psb_m_appcardgroup` (defines grouping and display order).
- Create cards in `psb_s_appcard` (defines feature cards and their route paths).
- Create card-role mappings in `psb_m_appcardroleaccess` (links cards to roles).

### 5. Create the Module Folder

```
src/modules/my-module/
  index.js
  pages/
    DashboardPage.js
  components/
    MyWidget.js
```

### 6. Write `index.js`

```js
export default {
  key: "my-module",
  app_id: YOUR_APP_ID,
  name: "My Module",
  routes: [
    { path: "/my-module", page: "DashboardPage" },
  ],
};
```

### 7. Write Pages and Components

See the Server/Client component rules above.

### 8. Apply Card Access Checks

Use `hasCardAccess()` to hide/disable features the user shouldn't see.

### 9. Test

1. Login as a user **with** the role mapping → module appears, page loads.
2. Login as a user **without** the mapping → module is hidden, direct URL shows "No Access".

---

## What Modules Must Not Do

1. Modify core files.
2. Implement their own auth system.
3. Create roles or assign user-role mappings.
4. Hardcode permission labels (e.g. `if (roleName === "Admin")`).
5. Store separate auth state in a module-local provider.
6. Define route handlers that bypass core routing.

---

## Adding More Pages

Add a route to `index.js` and create the corresponding page file:

```js
// index.js
routes: [
  { path: "/my-module", page: "DashboardPage" },
  { path: "/my-module/settings", page: "SettingsPage" },  // new
],
```

```js
// pages/SettingsPage.js
import SettingsForm from "../components/SettingsForm";

export default function SettingsPage() {
  return <SettingsForm />;
}
```

No other files need to change.

---

## URL to Component Flow

```
User opens /metal-buildings/settings
  → catch-all route receives ["metal-buildings", "settings"]
  → currentPath = /metal-buildings/settings
  → core loads all module definitions
  → route matcher finds module route with matching prefix
  → ModuleAccessGate checks app_id authorization
  → component renders if authorized
  → "No Access" screen if unauthorized
```

---

## Navigation Within a Module

### Dashboard Navigation

Dashboard links come from filtered module metadata — only authorized modules appear as tiles.

### In-Module Navigation

Use Next.js `Link` for in-module transitions:

```js
import Link from "next/link";

<Link href="/my-module/settings">Settings</Link>
```

### Navigation Do Nots

1. Do **not** hardcode unauthorized routes into static navigation trees.
2. Do **not** assume dashboard filtering alone is enough — core also has a route gate.
3. Do **not** bypass the core route guard logic with custom route handling.

---

## Common Mistakes

| Mistake | Why It's a Problem |
|---------|--------------------|
| Missing `app_id` in module manifest | Module is ignored by core — route won't resolve |
| Duplicate route paths across modules | First matched route is unpredictable |
| Route paths that don't start with `/` | Matching breaks, links are wrong |
| Relying on module-only checks for app entry | Weak route protection model — must use core gate |
| Putting `"use client"` on page files | Breaks webpack client boundary detection |
| Wrong `page` filename in routes | Core can't find the file — page won't load |

---

## Checklist Before PR

- [ ] `index.js` exports `key`, `app_id`, `name`, `routes`
- [ ] `app_id` exists in `psb_s_application`
- [ ] All route paths start with `/` and are unique
- [ ] Route `page` values match actual filenames in `pages/`
- [ ] Page files are server components (no `"use client"`)
- [ ] Module uses `useAuth()` from core
- [ ] Card visibility uses `hasCardAccess()`
- [ ] No hardcoded role names or permissions
- [ ] Authorized users can access the module
- [ ] Unauthorized users see "No Access"

---

## Why Modular Sub-Apps Exist (Architecture Philosophy)

PSBUniverse is a **modular SaaS platform**, not a monolithic app. Think of it like an operating system:

- **Core** = the operating system (auth, RBAC, routing, navigation)
- **Modules** = installed applications (Gutter Calculator, OHD Calculator, etc.)

Windows doesn't break when you update Chrome. That's the level of isolation we aim for.

### Key Principles

1. **Independent versioning** — each module can be updated without touching core or breaking other modules.
2. **Isolation of responsibility** — each module owns its own logic, UI, and workflows. Core does not contain module business logic.
3. **Roles are scoped per application** — a user can be Admin in one app and have no access in another. This is why applications and roles are linked.
4. **Plug-and-play** — new modules are registerable via Application Setup and appear automatically. Adding a new app does not require changing core code.
5. **Team scalability** — different teams work on different modules and deploy independently without stepping on each other.
6. **Locked core** — once core is stable, it rarely changes. Modules evolve around it. If core keeps changing for module needs, the architecture is wrong.

### What Not To Do

- Hardcode module logic inside core.
- Share UI components without proper abstraction.
- Create cross-module dependencies (one module reading another module's data).
- Treat roles as global instead of per-application.

### Success Criteria

You understand this system correctly if:

1. You can add a new module **without touching core**.
2. You can update a module **without affecting others**.
3. You can assign roles **per application**.
4. Core remains stable across changes.
