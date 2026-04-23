# Batch Edit Mode — Implementation Blueprint

> Reference document for replicating batch edit mode across modules.
> Source: `user-master` module components.

---

## Table of Contents

1. [Core Architecture](#1-core-architecture)
2. [Edit Method A — Modal / Drawer](#2-edit-method-a--modal--drawer)
3. [Edit Method B — Inline Cell Editing](#3-edit-method-b--inline-cell-editing)
4. [Edit Method C — Modal Only (Hierarchical)](#4-edit-method-c--modal-only-hierarchical)
5. [Shared Systems](#5-shared-systems)
6. [Action Buttons Reference](#6-action-buttons-reference)
7. [Save Models](#7-save-models)
8. [Edge Cases](#8-edge-cases)
9. [File Reference](#9-file-reference)

---

## 1. Core Architecture

Every batch edit implementation follows the same **Draft + Baseline + Diff** pattern.

### Data Flow

```
Load from API/Cache
    ↓
Store as BASELINE (frozen snapshot) + DRAFT (working copy)
    ↓
User edits DRAFT (Add / Edit / Delete / Toggle / Reorder)
    ↓
DIFF computed reactively (useMemo compares DRAFT vs BASELINE)
    ↓
UI reflects diff (row classes, cell highlights, change summary, button states)
    ↓
User clicks "Save Batch"
    ↓
validateDraftBeforeSave() — abort if invalid
    ↓
API calls execute (order depends on save model)
    ↓
Cache invalidated → Fresh data loaded from server
    ↓
New BASELINE set ← server data; DRAFT = clone of new BASELINE
    ↓
Diff resets to empty — hasPendingChanges = false
```

### State Variables (Template)

```javascript
const [draft, setDraft] = useState([]);         // Working copy — user edits this
const [baseline, setBaseline] = useState([]);    // Frozen snapshot at load time
const [busy, setBusy] = useState(false);         // Locks UI during save
```

On data load:
```javascript
const freshData = await fetchFromApi();
setDraft(cloneRows(freshData));
setBaseline(cloneRows(freshData));
```

### Clone Helper

```javascript
function cloneBatchRows(rows) {
  return (Array.isArray(rows) ? rows : []).map((row) => ({
    ...(row || {}),
    __pendingRemove: false,   // Always reset on clone
  }));
}
```

---

## 2. Edit Method A — Modal / Drawer

**Source:** `admin-setup.page.js`
**Used for:** Complex entities (Users, Companies, Statuses, Applications)

### How It Works

1. User clicks **Edit** (pencil icon) on a table row.
2. A **Modal** or **Offcanvas Drawer** opens with form fields pre-filled from the draft row.
3. User edits fields inside the modal/drawer.
4. On **Submit**, the modal stages changes back to the parent draft array — no API call.
5. The modal closes. The diff recalculates. The row shows as modified.

### Modal State Structure

```javascript
const [userModal, setUserModal] = useState({
  show: false,              // Modal visibility
  mode: "create",           // "create" | "edit"
  draft: emptyUserDraft(),  // Form fields
  isPasswordVisible: false, // UI toggle
});
```

### Opening for Create

```javascript
function openCreateUserModal() {
  setUserModal({
    show: true,
    mode: "create",
    draft: {
      ...emptyUserDraft(),
      status_id: activeStatusId || "",
    },
    isPasswordVisible: false,
  });
}
```

### Opening for Edit

```javascript
function openEditUserModal(user) {
  setUserModal({
    show: false,    // Modal hidden — drawer opens instead
    mode: "edit",
    draft: {
      user_id: user.user_id,
      username: user.username || "",
      email: user.email || "",
      // ... map all fields from row to draft
    },
    isPasswordVisible: false,
  });

  setUserDrawer({ show: true, activeTab: "profile", /* ... */ });
}
```

### Staging Changes (Submit Handler)

On create — insert with temp ID:
```javascript
if (mode === "create") {
  const tempUserId = createTempId("user");
  setUsers((previous) => [
    { user_id: tempUserId, ...stagedPayload, __pendingRemove: false },
    ...(previous || []),
  ]);
  toast("User creation staged. Save Batch to apply.");
}
```

On edit — merge into existing row:
```javascript
if (mode === "edit") {
  setUsers((previous) =>
    previous.map((item) =>
      String(item.user_id) === String(draft.user_id)
        ? { ...item, ...stagedPayload }
        : item
    )
  );
  toast("User update staged. Save Batch to apply.");
}
```

### Quick Actions (No Modal)

Activate/Deactivate toggle status directly on the draft:
```javascript
function deactivateUser(userId) {
  setUsers((previous) =>
    previous.map((item) =>
      String(item.user_id) === String(userId)
        ? { ...item, status_id: toNullableNumber(inactiveStatusId) }
        : item
    )
  );
  toast("User status staged as inactive. Save Batch to apply.");
}
```

Delete toggles `__pendingRemove`:
```javascript
function removeUser(userId) {
  setUsers((previous) =>
    previous.map((item) =>
      String(item.user_id) === String(userId)
        ? { ...item, __pendingRemove: !item.__pendingRemove }
        : item
    )
  );
}
```

### Per-Section Independence

Admin setup has **independent batch state per section** (users, companies, statuses, applications). Each section has its own:
- Draft array
- Baseline snapshot
- Diff object (`usersDiff`, `companiesDiff`, etc.)
- Save/Cancel functions (`saveUsersBatch`, `cancelUsersBatch`, etc.)

Combined dirty check:
```javascript
const hasAnyPendingBatchChanges =
  usersDiff.hasPendingChanges ||
  companiesDiff.hasPendingChanges ||
  statusesDiff.hasPendingChanges ||
  applicationsDiff.hasPendingChanges;
```

---

## 3. Edit Method B — Inline Cell Editing

**Source:** `core-setup.page.js` → `SetupTable` component
**Used for:** Simple reference tables (Statuses, Colors, Manufacturers, Leaf Guards, Discounts, Trip Rates)

### How It Works

1. Table renders all draft rows. Non-editing rows show `<span>` text (clickable).
2. User clicks a cell → that row enters **edit mode** (`editing` Set tracks row indices).
3. Cells become `<Form.Control>` inputs. User types directly.
4. Each keystroke updates the draft array immediately via `updateDraft(i, col, value)`.
5. The diff recalculates on every change. Cell-level highlighting shows which fields changed.

### Edit State

```javascript
const [editing, setEditing] = useState(new Set());  // Set of row indices in edit mode
```

### Entering Edit Mode

```javascript
const startEdit = (i) => {
  setEditing((prev) => new Set(prev).add(i));
};
```

### Updating a Cell

```javascript
const updateDraft = (i, col, value) => {
  setDraft((prev) => {
    const next = [...prev];
    next[i] = { ...next[i], [col]: value };
    return next;
  });
};
```

### Adding a Row

```javascript
const addRow = () => {
  const newRow = {};
  columns.forEach((c) => { newRow[c.key] = ""; });
  newRow.__pendingRemove = false;

  setDraft((prev) => [...prev, newRow]);
  setEditing((prev) => new Set(prev).add(draft.length));  // Auto-enter edit mode
};
```

### Cancelling a Single Row Edit

```javascript
const cancelEditRow = (i) => {
  const row = draft[i];
  const baselineRow = /* find by PK in baselineRows */;

  if (baselineRow) {
    // Revert to baseline
    setDraft((prev) => { const next = [...prev]; next[i] = { ...baselineRow }; return next; });
    setEditing((prev) => { const next = new Set(prev); next.delete(i); return next; });
  } else {
    // New row — remove entirely
    setDraft((prev) => prev.filter((_, idx) => idx !== i));
    // Shift editing indices down
  }
};
```

### Diff: Row-Index Based

Unlike modal edit which uses `byId`, inline edit tracks diff by **row index** since new rows have no PK:

```javascript
const diff = useMemo(() => {
  const byRowIndex = new Map();
  // ... compare each draft[i] vs baseline by PK lookup
  return { byRowIndex, newRows, modifiedRows, removedRows, hasPendingChanges };
}, [baselineRows, columns, draft, pkColumn]);
```

### Cell Rendering Pattern

```jsx
<td className={isCellChanged ? "setup-cell-changed" : ""}>
  {editing.has(i) ? (
    <Form.Control
      size="sm"
      type={c.type === "number" ? "number" : "text"}
      value={row[c.key] ?? ""}
      className={isCellChanged ? "setup-input-changed" : ""}
      onChange={(e) => updateDraft(i, c.key, e.target.value)}
    />
  ) : (
    <span className="small" style={{ cursor: "pointer" }} onClick={() => startEdit(i)}>
      {row[c.key] ?? ""}
    </span>
  )}
</td>
```

### Action Buttons (Per Row)

When **in edit mode**:
- Cancel row edit (X icon) — reverts single row
- Delete/Undo (trash/counterclockwise icon) — toggles `__pendingRemove`

When **not in edit mode**:
- Edit (pencil icon) — enters inline edit for that row
- Delete/Undo (trash/counterclockwise icon) — toggles `__pendingRemove`

### Batch Actions (Footer Bar)

```jsx
<div className="d-flex gap-2 align-items-center setup-batch-actions">
  <span className={`small me-auto setup-change-summary ${diff.hasPendingChanges ? "is-dirty" : ""}`}>
    {changeSummary}
  </span>
  <Button variant="outline-success" size="sm" onClick={save} disabled={!diff.hasPendingChanges}>
    Save Batch
  </Button>
  <Button variant="outline-secondary" size="sm" onClick={cancel} disabled={!diff.hasPendingChanges}>
    Cancel Batch
  </Button>
  <Button variant="outline-primary" size="sm" onClick={addRow}>
    Add Row
  </Button>
</div>
```

### SetupTable Props (Reusable Component)

```javascript
SetupTable({
  sectionId,       // Unique key for this table
  title,           // Display title
  description,     // Subtitle text
  tableName,       // DB table name
  pkColumn,        // Primary key column name (e.g. "status_id")
  columns,         // Array of { key, label, type: "text"|"number" }
  data,            // Source data from parent (triggers baseline reset)
  onSave,          // Callback after successful save
  onStateChange,   // Reports { isDirty, rowCount } to parent
  cacheNamespace,  // Cache namespace for invalidation
  cacheKey,        // Cache key to invalidate
  invalidateKeys,  // Additional cache keys to invalidate
})
```

---

## 4. Edit Method C — Modal Only (Hierarchical)

**Source:** `setup-cards-tab.js`
**Used for:** Nested structures (Groups → Cards) with drag-to-reorder

### How It Works

1. Groups render as collapsible `Card` components. Cards render as table rows within groups.
2. User clicks **Edit** → Group/Card modal opens with pre-filled fields.
3. On confirm, changes are staged back to the `groups` draft array (nested structure).
4. Drag handles allow reordering groups and cards within groups.
5. `display_order` is automatically resequenced on drop.

### State Structure

```javascript
const [groups, setGroups] = useState([]);             // Draft — nested: group → cards[]
const [baselineGroups, setBaselineGroups] = useState([]); // Frozen snapshot
const tempIdRef = useRef(0);                          // Counter for temp IDs

const [groupModal, setGroupModal] = useState({
  show: false, mode: "create", draft: emptyGroupDraft(),
});
const [cardModal, setCardModal] = useState({
  show: false, mode: "create", draft: emptyCardDraft(),
});
```

### Temp ID Generation (Counter-Based)

```javascript
const TEMP_GROUP_ID_PREFIX = "tmp-group-";
const TEMP_CARD_ID_PREFIX = "tmp-card-";

const buildTempGroupId = useCallback(() => {
  tempIdRef.current += 1;
  return `${TEMP_GROUP_ID_PREFIX}${Date.now()}-${tempIdRef.current}`;
}, []);

const buildTempCardId = useCallback(() => {
  tempIdRef.current += 1;
  return `${TEMP_CARD_ID_PREFIX}${Date.now()}-${tempIdRef.current}`;
}, []);
```

### Staging a New Group

```javascript
if (mode === "create") {
  const nextGroupId = buildTempGroupId();
  setGroups((previous) =>
    sortByDisplayOrder([
      ...previous,
      {
        group_id: nextGroupId,
        app_id: selectedAppId,
        group_name: asText(draft.group_name),
        // ... other fields
        cards: [],
        __pendingRemove: false,
      },
    ], "group_id")
  );
  toast("Group staged. Save Batch to apply.");
}
```

### Staging a New Card (Nested Under Group)

```javascript
if (mode === "create") {
  const nextCardId = buildTempCardId();
  setGroups((previous) =>
    previous.map((group) => {
      if (String(group.group_id) !== targetGroupId) return group;
      return {
        ...group,
        cards: sortByDisplayOrder([
          ...group.cards,
          { card_id: nextCardId, group_id: targetGroupId, ...cardPayload },
        ], "card_id"),
      };
    })
  );
}
```

### Hierarchical Diff

Two maps instead of one:
```javascript
const diff = useMemo(() => {
  const groupDiffById = new Map();   // group_id → DiffEntry
  const cardDiffByKey = new Map();   // "groupId:cardId" → DiffEntry

  // Compare each group and its nested cards against baseline
  // ...

  return {
    groupDiffById,
    cardDiffByKey,
    hasPendingChanges: /* deep JSON comparison of snapshots */,
    summary: "X new groups, X modified, X removed; X new cards, X modified, X removed",
  };
}, [baselineGroups, groups]);
```

### Deep Clone Helper

```javascript
function cloneGroupRecord(group = {}) {
  return {
    group_id: group?.group_id ?? null,
    group_name: asText(group?.group_name),
    // ... all group fields
    cards: Array.isArray(group?.cards) ? group.cards.map(cloneCardRecord) : [],
    __pendingRemove: Boolean(group?.__pendingRemove),
  };
}

function cloneGroupRecords(groups = []) {
  return Array.isArray(groups) ? groups.map(cloneGroupRecord) : [];
}
```

### Drag & Drop Reordering

Groups:
```javascript
onDragStart → setDragContext({ kind: "group", sourceGroupId })
onDragOver  → update targetGroupId
onDrop      → moveArrayItem(groups, sourceIndex, targetIndex)
           → resequenceDisplayOrder(reorderedGroups)
           → setGroups(reordered)
           → toast("Group reorder staged. Save Batch to apply.")
```

Cards (within same group only):
```javascript
onDragStart → setDragContext({ kind: "card", sourceGroupId, sourceCardId })
onDragOver  → update targetGroupId + targetCardId
onDrop      → moveArrayItem(group.cards, sourceIndex, targetIndex)
           → resequenceDisplayOrder(reorderedCards)
           → setGroups(updated)
           → toast("Card reorder staged. Save Batch to apply.")
```

### Cascade: Deactivating a Group Deactivates All Its Cards

```javascript
const toggleGroupActive = (group, nextValue) => {
  setGroups((previous) =>
    previous.map((current) => {
      if (String(current.group_id) !== groupId) return current;
      return {
        ...current,
        is_active: Boolean(nextValue),
        cards: !nextValue
          ? current.cards.map((card) => ({ ...card, is_active: false }))
          : current.cards,
      };
    })
  );
};
```

### Deleting a Temp Item = Immediate Removal

```javascript
if (isTempGroupId(groupId)) {
  setGroups((prev) => prev.filter((g) => String(g.group_id) !== groupId));
  toast("Staged group removed.");
  return;
}
// Otherwise: toggle __pendingRemove
```

---

## 5. Shared Systems

### 5.1 Temp ID System

```javascript
const TEMP_ID_PREFIX = "tmp-";

function isTempId(value) {
  return String(value || "").startsWith(TEMP_ID_PREFIX);
}

// Random-based (admin-setup)
function createTempId(entityKey) {
  return `${TEMP_ID_PREFIX}${String(entityKey || "row")}-${Date.now()}-${Math.random()
    .toString(36).slice(2, 8)}`;
}

// Counter-based (setup-cards)
const tempIdRef = useRef(0);
function buildTempId(prefix) {
  tempIdRef.current += 1;
  return `${prefix}${Date.now()}-${tempIdRef.current}`;
}
```

### 5.2 buildBatchDiff (Flat Tables)

```javascript
function buildBatchDiff(draftRows, baselineRows, idKey, fields) {
  const baselineMap = new Map(
    baselineRows.filter((row) => hasValue(row?.[idKey]))
      .map((row) => [String(row[idKey]), row])
  );

  const byId = new Map();
  let newRows = 0, modifiedRows = 0, removedRows = 0;

  draftRows.forEach((row) => {
    const rowId = String(row?.[idKey] ?? "");
    const baselineRow = baselineMap.get(rowId);
    const isNew = isTempId(rowId) || !baselineRow;
    const isPendingRemove = Boolean(row?.__pendingRemove);
    const changedColumns = new Set();

    if (!isNew && baselineRow) {
      fields.forEach((field) => {
        const key = typeof field === "string" ? field : field.key;
        const type = typeof field === "string" ? "text" : field.type || "text";
        if (normalizeBatchValue(row?.[key], type) !== normalizeBatchValue(baselineRow?.[key], type)) {
          changedColumns.add(key);
        }
      });
    }

    const isChanged = isNew || changedColumns.size > 0;

    if (isPendingRemove && !isNew) removedRows++;
    else if (isNew && !isPendingRemove) newRows++;
    else if (changedColumns.size > 0 && !isPendingRemove) modifiedRows++;

    byId.set(rowId, { isNew, isChanged, isPendingRemove, changedColumns });
  });

  return { byId, newRows, modifiedRows, removedRows, hasPendingChanges: newRows > 0 || modifiedRows > 0 || removedRows > 0 };
}
```

Fields can be strings or objects with type:
```javascript
buildBatchDiff(draft, baseline, "user_id", [
  "username",
  "email",
  "first_name",
  { key: "comp_id", type: "number" },
  { key: "status_id", type: "number" },
  { key: "is_active", type: "boolean" },
]);
```

### 5.3 Diff Entry Shape

```javascript
{
  isNew: boolean,                // Temp ID or not in baseline
  isChanged: boolean,            // Any field differs from baseline
  isPendingRemove: boolean,      // Marked for deletion (__pendingRemove)
  changedColumns: Set<string>,   // Which specific fields changed
}
```

### 5.4 Value Normalization

```javascript
function normalizeBatchValue(value, type = "text") {
  if (type === "number") {
    if (!hasValue(value)) return "";
    const parsed = Number(value);
    return Number.isFinite(parsed) ? String(parsed) : "";
  }
  if (type === "boolean") {
    return value === false || value === 0 || value === "0" ? "0" : "1";
  }
  return String(value ?? "").trim();
}
```

### 5.5 UI CSS Classes

| Class | Meaning | Applied When |
|-------|---------|-------------|
| `.setup-row-new` / `.admin-row-new` / `.is-new` | New unsaved record | `isNew && !isPendingRemove` |
| `.setup-row-modified` / `.admin-row-modified` / `.is-modified` | Changed existing record | `!isNew && isChanged && !isPendingRemove` |
| `.setup-row-pending-remove` / `.admin-row-pending-remove` / `.is-pending-remove` | Marked for deletion | `isPendingRemove` |
| `.setup-cell-changed` / `.admin-cell-changed` | Modified cell | `changedColumns.has(columnKey)` |
| `.is-drop-target` / `.setup-cards-card-drop-target` | Drag hover target | During drag-over |
| `.setup-change-summary.is-dirty` | Summary text with changes | `hasPendingChanges` |

### 5.6 Change Summary Display

```jsx
<span className={`small setup-change-summary ${diff.hasPendingChanges ? "is-dirty" : ""}`}>
  {diff.hasPendingChanges
    ? `${diff.newRows} new, ${diff.modifiedRows} modified, ${diff.removedRows} removed`
    : "No changes"}
</span>
```

### 5.7 Cancel Batch

```javascript
const cancelBatch = () => {
  if (!diff.hasPendingChanges) return;
  setDraft(cloneBatchRows(baseline));    // Revert to snapshot
  closeAllModals();
  toast("Staged changes discarded.");
};
```

### 5.8 Pre-Save Validation

```javascript
const validateDraftBeforeSave = () => {
  // Check required fields
  // Check unique constraints (duplicate display_order values)
  // Check referential integrity (active cards in inactive groups)
  // Return null if valid, or error message string
};
```

### 5.9 Post-Save Recovery

```javascript
// Always performed after save (success or failure):
invalidateCache(relevantKeys);
await loadData({ forceFresh: true });
// This resets both draft and baseline to server state.
```

---

## 6. Action Buttons Reference

| Button | UI | Batch State | API? |
|--------|-----|------------|------|
| **Add** | Appends row (temp ID); enters edit mode or opens modal | `diff.newRows++` | Deferred |
| **Edit** | Opens modal/drawer or enables inline input | `diff.modifiedRows++` if baseline row | Deferred |
| **Activate** | Badge → "Active" (bg="success") | Sets `is_active: true` or `status_id: activeStatusId` | Deferred |
| **Deactivate** | Badge → "Inactive" (bg="secondary") | Sets `is_active: false` or `status_id: inactiveStatusId` | Deferred |
| **Delete** | Row grayed out, button becomes "Undo Delete" | Sets `__pendingRemove: true`; `diff.removedRows++` | Deferred |
| **Undo Delete** | Row returns to normal | Sets `__pendingRemove: false` | Deferred |
| **Save Batch** | Shows "Saving...", disables all buttons | Executes all changes via API, then reloads | **Yes** |
| **Cancel Batch** | Resets all rows to baseline | `setDraft(clone(baseline))` | No |
| **Refresh** | Confirms if dirty, then reloads | Fresh fetch replaces both draft and baseline | **Yes** (GET) |

Button disabled states:
```jsx
<Button disabled={busy || !diff.hasPendingChanges || loading || saving}>
  {saving ? "Saving..." : "Save Batch"}
</Button>
```

---

## 7. Save Models

### 7.1 Sequential CRUD (admin-setup: Users, Companies, Statuses)

**Order: DELETE → CREATE → UPDATE**

```javascript
async function saveBatch() {
  setBusy(true);

  const baselineById = new Map(baseline.map((r) => [String(r[idKey]), r]));

  // PHASE 1: DELETE — only rows with __pendingRemove that exist in baseline
  for (const row of draft) {
    if (!row.__pendingRemove || !baselineById.has(String(row[idKey]))) continue;
    await callApi(`/api/.../entity?id=${row[idKey]}`, "DELETE");
  }

  // PHASE 2: CREATE — rows with temp IDs or not in baseline
  // PHASE 3: UPDATE — existing rows with isChanged (PATCH only changed fields)
  for (const row of draft) {
    if (row.__pendingRemove) continue;

    const isNew = isTempId(row[idKey]) || !baselineById.has(String(row[idKey]));
    const rowDiff = diff.byId.get(String(row[idKey]));

    if (isNew) {
      await callApi(`/api/.../entity`, "POST", normalizedPayload);
    } else if (rowDiff?.isChanged) {
      await callApi(`/api/.../entity`, "PATCH", { id: row[idKey], ...normalizedPayload });
    }
    // else: skip unchanged rows
  }

  invalidateCache();
  await loadData({ forceFresh: true });
}
```

### 7.2 5-Phase Sequential CRUD (setup-cards: Hierarchical)

```
Phase 1: Reorder existing groups → PATCH with temp high display_order values
Phase 2: Create new groups → POST → store tempGroupIdMap (temp → real ID)
Phase 3: Update existing groups → PATCH only changed fields + final display_order
Phase 4: Per group:
  4a: Delete cards with __pendingRemove → DELETE
  4b: Reorder existing cards → PATCH with temp high display_order
  4c: Create new cards → POST (using resolved group ID from tempGroupIdMap)
  4d: Update existing cards → PATCH only changed fields + final display_order
Phase 5: Delete groups with __pendingRemove → DELETE (after deleting their cards)
```

**Order-shifting strategy:**
```javascript
// Prevents duplicate order violations during reorder:
const tempBaseOrder = currentMaxOrder + 1000;
for (const [index, group] of changedOrderGroups.entries()) {
  await callApi(PATCH, { group_id, display_order: tempBaseOrder + index });
}
// Then set final display_order values in the update phase.
```

**Temp ID resolution:**
```javascript
const tempGroupIdMap = new Map();

// During create phase:
const result = await callApi(POST, { entity: "group", ... });
tempGroupIdMap.set(tempGroupId, result.data.group.group_id);

// During card create phase:
const resolvedGroupId = tempGroupIdMap.get(draftGroupId) || draftGroupId;
await callApi(POST, { entity: "card", group_id: resolvedGroupId, ... });
```

### 7.3 RPC Batch (admin-setup: Applications)

Single atomic API call:
```javascript
await callApi(`/api/.../applications`, "POST", {
  mode: "batch",
  order_field: "display_order",
  applications: draftApplications.map((app) => ({
    app_id: isTempId(app.app_id) ? null : app.app_id,  // null = create
    app_name, app_desc, is_active, display_order,
    is_pending_remove: Boolean(app.__pendingRemove),     // true = delete
  })),
});
// DB-side RPC handles create/update/delete atomically.
// Returns: { inserted_count, updated_count, deleted_count }
```

### 7.4 Delete-Then-Insert (core-setup: Global Setup Tables)

Simplest model — wipe and re-insert:
```javascript
const rows = draft
  .filter((r) => !r.__pendingRemove)
  .filter((r) => columns.some((c) => String(r[c.key] || "").trim() !== ""))
  .map((r) => {
    const cleaned = {};
    columns.forEach((c) => {
      cleaned[c.key] = c.type === "number" ? parseFloat(r[c.key]) || 0 : r[c.key];
    });
    return cleaned;
  });

await fetch("/api/setup/global", {
  method: "POST",
  body: JSON.stringify({ sectionId, rows }),
});
```

---

## 8. Edge Cases

| Scenario | Behavior |
|----------|----------|
| **Edit a newly created item** | Works naturally — temp ID row updated in draft; diff still shows `isNew: true` |
| **Delete a newly created item** | Temp ID items are filtered out entirely (no DELETE API call, since they never existed in DB). In setup-cards, temp items are removed from the draft array immediately |
| **Edit then deactivate same item** | Both changes tracked in `changedColumns` Set. Single PATCH sent with all changes |
| **Duplicate edits to same row** | Last edit wins — draft holds only latest values. Diff compares latest draft vs original baseline |
| **Invalid input on save** | `validateDraftBeforeSave()` catches required fields, duplicate orders, FK violations. Toast shown, save aborted |
| **Reorder + other edits** | Order-shifting strategy prevents unique constraint violations during save. Temp high values set first, then final values |
| **Delete group with cards** | All child cards deleted first, then the group |
| **Deactivate group** | All cards within group auto-deactivated via cascade |
| **Active card in inactive group** | Validation rejects: "Active cards are not allowed under an inactive group" |
| **Refresh with pending changes** | `window.confirm("Discard staged changes and refresh from server?")` — user must confirm |
| **Error during save** | Batch stops at the failed call (no auto-rollback). Cache invalidated + fresh reload to get actual DB state |

---

## 9. File Reference

| File | Role | Size |
|------|------|------|
| `src/modules/user-master/components/admin-setup.page.js` | Modal/Drawer edit, multi-section batch, `buildBatchDiff()` | ~5200 lines |
| `src/modules/user-master/components/core-setup.page.js` | Inline cell edit, reusable `SetupTable` component | ~800 lines |
| `src/modules/user-master/components/setup-cards-tab.js` | Modal edit, hierarchical groups+cards, drag-reorder | ~2000 lines |
| `src/modules/user-master/services/user-master-admin-applications.service.js` | RPC batch save (`psb_save_applications_batch`) | |
| `src/modules/user-master/services/user-master-setup-cards.service.js` | Setup cards CRUD service | |
| `src/app/api/setup/global/route.js` | Global setup delete-then-insert API | |
