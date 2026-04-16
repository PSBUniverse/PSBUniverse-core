# PSBUniverse Development Rules (Final)

This document defines the non-negotiable rules for building modules inside PSBUniverse.

Shared UI enforcement:
- For strict shared component and behavior lock rules, also follow [Shared UI System Lockdown](./SHARED_UI_SYSTEM_LOCKDOWN.md).

Goal:
- consistency across all modules
- zero UI and UX drift
- predictable development
- scalable system

---

## System Overview

- Core = system (auth, RBAC, layout, routing)
- Modules = features (pages, logic)
- Shared UI = design system (components)

---

## 1) Core Principles

1. Modules do not define systems.
2. Modules only build features.
3. Shared components are the single source of truth.
4. Logic is controlled at module level, not inside shared UI components.

---

## 2) UI Rules

### Do

- Use shared UI components only.

```js
import { Button, Table, Modal } from "@/shared/components/ui";
```

- Follow consistent spacing, layout, and styling.
- Use existing shared components for all UI.

### Do Not

- Do not create `Button`, `Modal`, or `Table` inside modules.
- Do not use random inline styles.
- Do not redesign shared layout patterns.
- Do not override shared components in modules.

Hard rule:
- All UI must come from `shared/components/ui`.

---

## 3) Module Rules

### Structure

```text
src/modules/<module-name>/
  pages/
  components/
  index.js
```

### Module Responsibility

- define pages
- manage state
- fetch data
- define filters
- configure table

### Module Must Not

- modify core
- implement auth
- implement RBAC logic
- create system-level components

---

## 4) RBAC Rules

### RBAC Controls

- access to modules
- access to actions
- whether columns exist
- whether table is visible

### RBAC Must Not

- exist inside UI components
- exist inside Table logic

Correct usage:

```js
if (!canViewTable) return null;
```

---

## 5) Table Rules (Critical)

### Table Role

- Table = UI renderer only
- Module = logic controller
- Table is not a data manager

### Standard Table Features

- sorting
- global search
- pagination
- filters (hardcoded or databound)
- column resize
- column visibility
- row actions
- export (csv or excel)
- loading and empty states

### Data Table Component Contract

```js
<Table
  columns={columns}
  data={data}
  loading={loading}
  total={total}
  page={page}
  pageSize={pageSize}
  filters={filtersConfig}
  appliedFilters={appliedFilters}
  sort={sort}
  onFilterChange={handleFilterChange}
  onSortChange={handleSortChange}
  onPageChange={handlePageChange}
  onSearchChange={handleSearch}
  onColumnVisibilityChange={handleColumnVisibilityChange}
  onColumnResizeChange={handleColumnResizeChange}
  actions={actions}
  onExport={handleExport}
/>
```

Companion implementation (copy-ready):
- Page route: `/examples/data-table`
- Page file: `src/app/examples/data-table/page.js`
- Data API: `GET /api/examples/data-table`
- Filter options API: `GET /api/examples/data-table/options`
- Export API: `GET /api/examples/data-table/export`

---

## 5.1) Table Control Mode

### Required

- Table is controlled by parent.
- All data is passed via props.
- All events are handled by parent.
- Source of truth for sort, pagination, filters, and columns lives in module.

### Not Allowed

- Table fetches data.
- Table manages business logic.
- Table stores the source of truth.
- Passing manual children rows.

---

## 5.2) Filter Rules

### Allowed

- hardcoded filters
- databound filters (API-driven)

Hard rule:
- Filters must be defined in module.
- Table must not define filters internally.
- Table must only render filter controls and emit changes.

Example:

```js
const filtersConfig = [
  {
    key: "status",
    type: "select",
    options: [...],
  },
  {
    key: "role_id",
    label: "Role",
    type: "select",
    dataSource: fetchRoles,
    options: roleOptions,
  },
];
```

Databound behavior:
- `dataSource` can exist as filter metadata.
- Module resolves API options and passes `options` into filters.
- Table does not execute API calls.

---

## 5.3) Column Visibility

Purpose:
- user can show or hide columns

Hard rule:
- UI controls visibility.
- RBAC controls existence.

Example:

```js
{
  key: "email",
  visible: true,
}
```

Not allowed:
- RBAC checks inside Table visibility logic
- hardcoded column hiding inside Table
- mutating shared Table component per module

---

## 5.4) Column Resize

Required:
- drag to resize column width
- enforce minimum width

Do not:
- overengineer resizing
- break layout

Resize ownership:
- Table emits resize changes.
- Module persists width state and re-passes `columns`.

---

## 5.5) Row Actions

Allowed:
- edit
- delete
- view
- custom actions

Hard rule:
- actions are passed via config, not hardcoded

Example:

```js
const actions = [
  { label: "Edit", onClick: handleEdit },
  { label: "Delete", onClick: handleDelete, variant: "danger" },
];
```

---

## 5.6) Table Customization

Allowed:
- action columns
- checkbox selection
- row click (open panel)
- master-detail view

Not allowed:
- rewriting Table per module
- duplicating features

---

## 5.7) Export Rules

Required:
- export csv or excel
- export current filtered data context

Not required yet:
- PDF export

---

## 6) Hard Rules (Non-Negotiable)

Do not:
1. Do not install table libraries inside modules.
2. Do not build custom table per page.
3. Do not fetch data inside Table.
4. Do not mix RBAC with UI logic.
5. Do not duplicate UI components.

Must:
1. Use shared Table component.
2. Pass all data via props.
3. Keep logic in module.
4. Keep UI in shared components.

---

## 7) Development Flow

JR Developer:
1. Clone repo.
2. Create module.
3. Define filters and columns.
4. Use shared UI and shared Table.
5. Test locally.
6. Push code.

SR Developer:
1. Define system rules.
2. Review code.
3. Enforce standards.
4. Manage RBAC and DB.
5. Deploy via Vercel.

---

## Final Mental Model

- Core = brain
- Modules = features
- Table = renderer

---

## Final Truth

If you follow this:
- system stays consistent
- developers move faster
- bugs are predictable

If you break this:
- UI drifts
- logic duplicates
- system becomes unmaintainable

---

## Done Criteria

The system is correct when:

A developer can build a module without asking questions and without breaking consistency.
