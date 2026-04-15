# Module Routing Guide

## Document Purpose
This guide explains exactly how routing works for modules in PSBUniverse Core.

It covers:
1. Dynamic route architecture
2. Module route registration contract
3. Route resolution algorithm
4. Access enforcement behavior
5. Navigation recommendations

## 1) Routing Architecture

PSBUniverse Core uses a dynamic catch-all route in the app layer:

1. src/app/[...modulePath]/page.js

This route receives URL path segments and resolves them against module definitions loaded at runtime.

## 2) Module Route Registration Contract

Each module must export a route manifest from:

1. modules/<module-name>/src/index.js

Expected shape:

```js
import DashboardPage from "./pages/DashboardPage";
import SettingsPage from "./pages/SettingsPage";

export default {
  key: "gutter",
  app_id: 1001,
  name: "Gutter",
  routes: [
    { path: "/gutter", component: DashboardPage },
    { path: "/gutter/settings", component: SettingsPage },
  ],
};
```

Mandatory fields:
1. key
2. app_id
3. routes with path and component

## 3) How Core Loads Route Definitions

Implemented in src/modules/loadModules.js:
1. Read root modules directory.
2. For each folder, look for src/index.js.
3. Import default export as module definition.
4. Return array of modules.

If folder or index.js is missing, module is skipped.

## 4) Route Resolution Algorithm

Implemented in src/app/[...modulePath]/page.js.

Important runtime detail:
1. In Next.js 16, `params` is async and must be awaited before reading `modulePath`.

### Steps

1. Await `params` and build current URL path from `modulePath` segments.
2. Load module definitions.
3. Sort each module route list by path length descending.
4. Iterate module list.
5. Skip invalid modules (missing key or app_id).
6. Find first route where currentPath startsWith(route.path).
7. Wrap component render in ModuleAccessGate (app-level RBAC).
8. If no route matches, return notFound().

### Why sort by path length

Without sorting, a base route like /gutter can capture /gutter/settings before specific route checks.

Sorting longest-first ensures specific routes win.

## 5) URL to Component Flow

```text
User opens /gutter/settings
  -> catch-all route receives ["gutter", "settings"]
  -> currentPath becomes /gutter/settings
  -> core loads module manifests
  -> route matcher finds module route with matching prefix
  -> ModuleAccessGate checks app_id authorization
  -> component renders if authorized
```

## 6) Access Enforcement in Routing

Route rendering is guarded by app-level access check.

Guard path:
1. ModuleAccessGate receives appId from module definition.
2. ModuleAccessGate calls hasAppAccess(roles, appId).
3. If unauthorized, render No Access UI.

This prevents direct URL bypass even when a user manually enters a module URL.

## 7) Navigation Guidelines

### Dashboard navigation
Use links to route paths that come from filtered module metadata.

### In-module navigation
Prefer Next.js Link for internal transitions:

```js
import Link from "next/link";

<Link href="/gutter/settings">Settings</Link>
```

### Do not
1. Hardcode unauthorized routes into static nav trees.
2. Assume dashboard filtering alone is enough.
3. Bypass core route guard logic.

## 8) Common Routing Mistakes

1. Missing app_id in module manifest.
   - Effect: module is ignored by core route resolver.

2. Duplicate route paths across modules.
   - Effect: first matched route may be unpredictable.

3. Non-absolute route paths.
   - Effect: matching inconsistencies and broken links.

4. Relying on module-only checks for app entry.
   - Effect: weak route protection model.

## 9) Validation Checklist

Before releasing a module route change:

1. Manifest includes key and app_id.
2. Every route path starts with slash.
3. Specific routes are covered and do not conflict with generic paths.
4. Route is reachable only for users with app access mapping.
5. Unauthorized direct URL access shows No Access UI.

## 10) Practical Example: Adding a New Route

1. Add component file in module pages folder.
2. Add route entry in module src/index.js.
3. Confirm module app_id is valid and mapped in access tables.
4. Test:
   1. Authorized user can open route.
   2. Unauthorized user sees No Access.
   3. Unknown path returns notFound.

This keeps module routing dynamic, safe, and consistent with core governance.