# Shared UI System

This document defines every shared UI component, its behavior contract, and the design tokens that govern the visual system. All modules must use these components — no custom implementations allowed.

---

## Approved Shared Components

| Component | Purpose |
|-----------|---------|
| Table | Full data-table: controlled state, filters, sorting, pagination, column resize/visibility, context menu, side panel, export |
| SetupTable | Lightweight setup grid: simple rows/columns, optional row click, drag reorder, batch row styling |
| ActionColumn | Row action buttons: inline (1 action) or dropdown (2+ actions) |
| FilterSchema | Developer-defined filter configuration |
| SearchBar | Debounced global search input |
| TableContextMenu | Right-click menu for column visibility, export, clear sorting |
| TableSidePanel | Slide-out panel for row details |
| Dropdown | Select/menu component |
| Button | Standard action button |
| Input | Form text input |
| Modal | Dialog overlay |
| Card | Content container |
| Badge | Inline status label |
| Toast | Auto-dismiss notification |
| GlobalToastHost | Single app-level toast container |

**Hard rule:** Anything outside this list is rejected unless the shared UI system is explicitly extended first.

---

## Table System

### Behavior

- Display only — emits events, never fetches data.
- Fully controlled by the parent module.

### What the Module Controls

- Data array
- Filters configuration and state
- Sorting state
- Pagination state
- Column visibility array

### Data Flow

```
User interacts with Table
  → Table emits event (onSortChange, onFilterChange, etc.)
  → Module updates its state
  → Module fetches data from API
  → Module passes updated data back to Table
```

### SetupTable vs Table

| Feature | SetupTable | Table |
|---------|-----------|-------|
| Purpose | Simple setup grids | Full data tables |
| State management | None — renders what you pass | Controlled state + onChange |
| Filters/search/sort | None | Full support |
| Column resize/visibility | None | Full support |
| Context menu + side panel | None | Full support |
| Export | None | Full support |
| Drag reorder | Supported | Not built-in |
| Batch row styling | Via `__batchClassName` | Via `__batchState` |

---

## Action Column

### Rendering Rules

- **1 action:** Renders as an inline button.
- **2+ actions:** Renders as a dropdown menu.

### Config-Driven

- Fully config-driven: the module passes an `actions` array, ActionColumn renders it.
- Per-row visibility: actions can have a `visible(row)` function.
- Disabled state: actions can have a `disabled(row)` function.
- Confirmation modals: actions with `type: "danger"` or `confirm: true` show a modal before executing.

### Action Ordering

1. Primary
2. Secondary
3. Danger

### Row Action Type Contract

The only supported `type` values for row actions are:

| Type | Use For |
|------|---------|
| `primary` | Default/main actions |
| `secondary` | Less prominent actions |
| `danger` | Destructive actions (delete, deactivate) |

**Do not** pass `success` or `warning` to row actions. If your business meaning is success/warning, map it to a supported type before passing actions.

### Layout Rules

- No wrapping.
- No multiple inline buttons for multi-action rows.

---

## Filter System

- Developer-defined only — no user-created filters.
- Supports static options or API-resolved options.
- Module resolves API options and passes them as `options`; the table does not execute API calls.
- Filter changes update module state and trigger a data reload.

---

## Search Bar

- Must be debounced.
- Updates the module's filter/query state.
- Triggers data reload through the module's normal flow.

---

## Right-Click Context Menu

The table context menu is the **single access point** for:

- Column visibility toggles
- Export (CSV, Excel)
- Clear sorting

Do not duplicate these controls in a separate toolbar.

---

## Export

- Server-side only.
- Uses the current table state/context (filters, sort).
- CSV and Excel only.

---

## Design Tokens

All shared components follow these locked design tokens:

### Spacing

```
4px, 8px, 12px, 16px, 24px
```

### Border Radius

```
6px, 8px, 12px
```

### Font Sizes

```
12px, 14px, 16px
```

### Transitions

```
0.15s, 0.2s
```

---

## Component Specs

### Button

| Property | Spec |
|----------|------|
| Variants | Primary, Secondary, Danger, Ghost |
| States | Default, Hover, Active, Disabled, Loading |
| Layout | Fixed height, no wrapping, consistent padding |

### Input

| Property | Spec |
|----------|------|
| States | Default, Focus, Error, Disabled |
| Layout | Same height as Button, clean consistent padding |

### Modal

| Property | Spec |
|----------|------|
| Behavior | Centered, dim background, scroll inside |
| Layout | Fixed max width, footer right-aligned |

### Card

| Property | Spec |
|----------|------|
| Layout | Consistent padding, optional hover lift |

### Badge

| Property | Spec |
|----------|------|
| Layout | Small, rounded, inline |

---

## Toast

| Property | Spec |
|----------|------|
| Auto-dismiss | Always |
| Position | Top-right, stack downward, newest on top |
| Hover behavior | Pause timer, expand spacing |
| States | Enter → Visible → Exit |
| Host | Single `GlobalToastHost` instance per app |

---

## Global Rules

### Disabled State

- Lower opacity.
- No interaction (no pointer events).

### Icons

- 16px or 20px.
- Center aligned.
- Use icons to reinforce meaning, not replace labels.
- Keep icon usage consistent for recurring actions across modules.

### Accessibility

- Preserve contrast ratios for text and interactive elements.
- Ensure focus visibility on all interactive components (buttons, inputs, links).
- Use labels on form inputs — do not rely on placeholder text alone.

### Z-Index Layering (Low → High)

1. Dropdown
2. Modal
3. Toast
4. Overlay

### Animation

- No arbitrary timings.
- Use standard transitions (0.15s, 0.2s).

---

## Workflow Toolbar Actions

These are **toolbar-level** actions, not row actions. They follow different rules.

| Action | Semantic Type | UI Variant |
|--------|--------------|------------|
| Approve | Success | Primary |
| Confirm | Primary | Primary |
| Reject | Danger | Danger |
| Void | Danger | Danger |
| Return | Warning | Secondary |
| Recall | Secondary | Secondary |

**Rules:**
- Critical actions must require confirmation.
- Actions must show loading while executing.
- Toolbar actions may use semantic labels like success/warning (unlike row actions which are limited to primary/secondary/danger).
- All actions must be state-driven. Disable actions when not allowed.
- After action: show toast feedback and log for audit.

---

## Visual Styling Rules

### Layout

- All pages render inside the core shell (`AppLayout`). Do not create competing shells.
- Keep module pages focused on domain content.
- Do not reset root body/html styles from module pages.

### Typography

- One consistent body font across the platform.
- Clear heading levels: `h1` for page title, `h2` for section title.

### Spacing

- Use consistent vertical rhythm (8px base).
- Keep container padding and card spacing predictable.

### Color

- Semantic meanings must stay stable: success = completion, warning = caution, danger = destructive.
- Do not use color alone to communicate state.

### State UI

Every module page must handle:
1. Loading state
2. Empty state
3. Error state
4. No-access state

---

## Performance Rules

- Debounce search inputs.
- Use server-side pagination.
- Maximum 500 rows per page.
- Do not load full datasets into table flows.

---

## Extensibility Rules

- Add features via config only — do not fork or duplicate shared components.
- Follow existing patterns.
- If you need a new shared component, propose it and get approval before building it.

---

## Ownership Summary

| Area | Owner |
|------|-------|
| Data | Module |
| Filters | Module |
| Actions | Module |
| UI Rendering | Shared Components |
| UI Rules | Shared Components |

---

## Testing Rules

When testing a module's table integration:

1. Filters must match API behavior — selecting a filter should produce the same results as the API query.
2. Sorting must match backend behavior — the table's sort state should produce the same order as the API.
3. Actions must respect permission and state constraints — disabled/hidden actions should stay that way.

---

## UX Rules

1. No layout shifting — components should not jump around when data loads or state changes.
2. No inconsistent action behavior — the same action type should behave the same way across all modules.
3. No random module-specific interaction patterns — follow the shared patterns documented here.

---

## Do Not

1. Add new UI patterns ad hoc — propose and get approval first.
2. Override shared styles from module code.
3. Create duplicate components that already exist in the shared library.
4. Add inline business logic inside shared UI components.
5. Break action rules (row action types, toolbar semantic mappings).

---

## Component Structure Standards

Every feature page should follow this recommended structure:

```
FeaturePage
  ├── Header block          (page title, breadcrumb)
  ├── Filter/search block   (if needed)
  ├── Content block         (grid, list, or table)
  ├── Action block          (toolbar actions, batch save)
  └── Empty/error block     (shown when data is missing or load fails)
```

Use small composable components rather than one large page component.

---

## Example: Card Grid Pattern

A simple, reusable card grid pattern for modules:

```jsx
function CardGrid({ items }) {
  if (!items.length) {
    return <p>No records found.</p>;
  }

  return (
    <div style={{ display: "grid", gap: 12 }}>
      {items.map((item) => (
        <div key={item.id} style={{ border: "1px solid #ddd", borderRadius: 8, padding: 16 }}>
          <h3 style={{ marginTop: 0 }}>{item.title}</h3>
          <p>{item.description}</p>
        </div>
      ))}
    </div>
  );
}
```

---

## Long-Term Styling Governance

As module count grows:

1. Keep a shared token strategy for spacing, color, and typography.
2. Review module UI against this guide during code review.
3. Prefer incremental consistency improvements over large visual rewrites.

The goal is not visual rigidity — it's predictable quality and maintainable UX across all modules.

---

## Shared UI Wrapper Components

Core includes wrapper components under `src/shared/components/ui`:

1. Button
2. Card
3. Input
4. Modal
5. Table

**Usage goals:**
- Keep Bootstrap styling consistent across modules by using these wrappers.
- Centralize `psb-ui-*` contracts so changes propagate everywhere.
- Reduce visual divergence between modules.

**Migration note:** Legacy direct React-Bootstrap usage can remain during incremental migration. New code should use the shared wrappers.
