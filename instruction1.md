> Your backend layers (repo/service/model) are clean.
> Your frontend page layer is **bloated and violating your own architecture**.

The biggest offender is:

>

That file alone breaks your entire modular design.

---

# 🧠 Now — here’s your **UNIVERSAL STEP-BY-STEP REFACTOR GUIDE**

This is what you give to:

* your AI coder
* your jr devs
* your future self

This works for **ALL modules**, not just status-setup.

---

# 🔥 STEP 0 — Identify the “Monster File”

Find this pattern:

* `*Client.js`
* 500+ lines
* contains:

  * `useState`
  * `useEffect`
  * API calls
  * JSX
  * handlers
  * dialogs

👉 Example:

>

---

## 🚫 RULE

> This file MUST be split. No exceptions.

---

# 🧱 STEP 1 — Create the Correct Structure

For EVERY module:

```plaintext
modules/<module>/
  pages/
    <Module>Page.jsx
    <Module>View.jsx

  hooks/
    use<Module>.js

  components/
    <Module>Header.jsx
    <Module>Table.jsx
    <Module>Dialog.jsx
```

---

# 🧱 STEP 2 — Fix the Page (SERVER ONLY)

Current:

>

### ✅ Refactor to:

```jsx
import ModuleAccessGate from "@/core/auth/ModuleAccessGate";
import StatusSetupView from "./StatusSetupView";
import { loadStatusSetupData } from "../hooks/statusSetupData";

export default async function StatusSetupPage() {
  const data = await loadStatusSetupData();

  return (
    <ModuleAccessGate appId={APP_ID}>
      <StatusSetupView {...data} />
    </ModuleAccessGate>
  );
}
```

---

## 🚫 RULE

Page must NOT:

* use state
* render tables
* contain logic

---

# 🧱 STEP 3 — Create View (UI Layout ONLY)

```jsx
"use client";

import { useStatusSetup } from "../hooks/useStatusSetup";
import { StatusHeader } from "../components/StatusHeader";
import { StatusTable } from "../components/StatusTable";
import { StatusDialog } from "../components/StatusDialog";

export default function StatusSetupView(props) {
  const vm = useStatusSetup(props);

  return (
    <main className="container py-4">
      <StatusHeader {...vm} />
      <StatusTable {...vm} />
      <StatusDialog {...vm} />
    </main>
  );
}
```

---

## 🚫 RULE

View must NOT:

* contain business logic
* call APIs
* manage complex state

---

# 🧠 STEP 4 — Move ALL Logic → Hook

Create:

```plaintext
hooks/useStatusSetup.js
```

Then move EVERYTHING from:

>

Into the hook:

---

### Move:

* all `useState`
* all `useMemo`
* all `useCallback`
* batch logic
* `requestJson`
* dialog logic
* mutations

---

### Example:

```js
export function useStatusSetup({ statuses }) {
  const [orderedStatuses, setOrderedStatuses] = useState(statuses);
  const [statusChanges, setStatusChanges] = useState({});

  const handleSaveBatch = async () => {
    // MOVE ALL API LOGIC HERE
  };

  return {
    orderedStatuses,
    statusChanges,
    handleSaveBatch,
  };
}
```

---

## 🚫 RULE

Hook = ONLY place allowed to:

* think
* mutate
* orchestrate

---

# 🧩 STEP 5 — Extract Components

From:

>

Split into:

---

## 1. Header

```plaintext
components/StatusHeader.jsx
```

Contains:

* Save Batch
* Cancel
* Add Status
* Pending indicator

---

## 2. Table

```plaintext
components/StatusTable.jsx
```

Contains:

* TableZ config
* columns
* actions

---

## 3. Dialog

```plaintext
components/StatusDialog.jsx
```

Contains:

* Modal
* form inputs
* confirm dialogs

---

## 🚫 RULE

Components must:

* use JSX
* use shared components (`TableZ`, `Button`, etc.)
* be dumb (no logic)

---

# 🚫 STEP 6 — DELETE BAD PATTERNS

## ❌ DELETE:

* `StatusSetupClient.js` (as a concept)

Rename + split it instead.

---

## ❌ NEVER ALLOW AGAIN:

* 800+ line files
* API calls in UI files
* mixed logic + UI

---

# 🔥 STEP 7 — Enforce Shared Components

Everything must use:

```plaintext
src/shared/components
```

### Already good in your case:

>

Uses:

* TableZ ✅
* Button ✅
* Modal ✅

👉 KEEP THIS. Just move it to components.

---

# 🧠 SIMPLE RULES FOR JR DEVS

Give them ONLY this:

---

## 🧱 WHERE DO I PUT CODE?

| If you are doing… | Put it here |
| ----------------- | ----------- |
| showing UI        | components  |
| arranging layout  | view        |
| writing logic     | hook        |
| loading data      | page        |

---

## 🔥 3 HARD RULES

1. If you use `useState` → **hook**
2. If you write JSX → **component**
3. If file > 200 lines → **split it**

---

# 💣 WHAT’S WRONG WITH YOUR CURRENT MODULE

## Good:

* repo layer ✅
* service layer ✅
* model ✅
* loader ✅

## Bad:

* page layer ❌ (too heavy)
* client file ❌ (god component)

---

# 🎯 FINAL ARCHITECTURE (AFTER FIX)

```plaintext
status-setup/
  pages/
    StatusSetupPage.jsx
    StatusSetupView.jsx

  hooks/
    useStatusSetup.js

  components/
    StatusHeader.jsx
    StatusTable.jsx
    StatusDialog.jsx

  repo/
  services/
  model/
  utils/
```

---

# 💡 FINAL TRUTH

You didn’t overengineer.

You:

> built a good backend architecture
> but collapsed everything in the UI layer

---

# 🔥 Bottom line

> Your system is 80% correct
> This refactor fixes the last 20% that actually matters
