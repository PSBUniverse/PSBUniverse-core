# 🔥 MODULE GENERATOR TEMPLATE (FINAL)

This is what you give your AI coder **every time you create a module**.

No deviation. No creativity.

---

# 🧠 **TASK: Generate Module Using Standard Architecture**

## **Module Name:** `<module-name>`

Example: `status-setup`, `application-setup`

---

# 🧱 **1. REQUIRED FOLDER STRUCTURE**

```plaintext
src/modules/<module-name>/
  pages/
    <ModuleName>Page.jsx
    <ModuleName>View.jsx

  hooks/
    use<ModuleName>.js

  components/
    <ModuleName>Header.jsx
    <ModuleName>Table.jsx
    <ModuleName>Dialog.jsx

  services/
    <moduleName>.service.js

  repo/
    <entity>.repo.js

  model/
    <entity>.model.js

  utils/ (optional)
```

---

# ⚠️ **2. HARD RULES (AUTO-REJECT IF VIOLATED)**

## ❌ DO NOT:

* Use `React.createElement`
* Put logic inside components
* Put API calls inside components or view
* Create files > 300 lines
* Combine UI + logic in one file
* Skip hook layer

---

## ✅ MUST:

* Use JSX
* Use shared components from:

  ```plaintext
  src/shared/components/ui
  ```
* Use `TableZ` for all tables
* Use `Modal`, `Button`, `Input` from shared

---

# 🧱 **3. FILE RESPONSIBILITIES**

---

## ✅ `pages/<ModuleName>Page.jsx`

```jsx
import ModuleAccessGate from "@/core/auth/ModuleAccessGate";
import <ModuleName>View from "./<ModuleName>View";
import { load<ModuleName>Data } from "../hooks/<moduleName>Data";

export default async function <ModuleName>Page() {
  const data = await load<ModuleName>Data();

  return (
    <ModuleAccessGate appId={APP_ID}>
      <<ModuleName>View {...data} />
    </ModuleAccessGate>
  );
}
```

---

## ✅ `pages/<ModuleName>View.jsx`

```jsx
"use client";

import { use<ModuleName> } from "../hooks/use<ModuleName>";
import { <ModuleName>Header } from "../components/<ModuleName>Header";
import { <ModuleName>Table } from "../components/<ModuleName>Table";
import { <ModuleName>Dialog } from "../components/<ModuleName>Dialog";

export default function <ModuleName>View(props) {
  const vm = use<ModuleName>(props);

  return (
    <main className="container py-4">
      <<ModuleName>Header {...vm} />
      <<ModuleName>Table {...vm} />
      <<ModuleName>Dialog {...vm} />
    </main>
  );
}
```

---

## 🧠 `hooks/use<ModuleName>.js`

```js
"use client";

import { useState, useMemo, useCallback } from "react";

export function use<ModuleName>(initialData) {
  const [data, setData] = useState(initialData);

  const handleSave = async () => {
    // API logic here (via service)
  };

  return {
    data,
    handleSave,
  };
}
```

👉 ALL logic goes here:

* state
* handlers
* batching
* mutations

---

## 🧩 `components/<ModuleName>Table.jsx`

```jsx
import { TableZ } from "@/shared/components/ui";

export function <ModuleName>Table({ data }) {
  return (
    <TableZ
      data={data}
      rowIdKey="id"
      columns={[
        { key: "name", label: "Name" },
      ]}
    />
  );
}
```

---

## 🧩 `components/<ModuleName>Header.jsx`

```jsx
import { Button } from "@/shared/components/ui";

export function <ModuleName>Header({ handleSave }) {
  return (
    <div className="d-flex justify-content-between mb-3">
      <h4>Module</h4>
      <Button onClick={handleSave}>Save</Button>
    </div>
  );
}
```

---

## 🧩 `components/<ModuleName>Dialog.jsx`

```jsx
import { Modal } from "@/shared/components/ui";

export function <ModuleName>Dialog({ dialog, setDialog }) {
  if (!dialog) return null;

  return (
    <Modal show onHide={() => setDialog(null)} title="Dialog">
      {/* content */}
    </Modal>
  );
}
```

---

# 🔄 **4. DATA FLOW (MANDATORY)**

```plaintext
Page → View → Hook → Service → Repo
```

If AI skips a layer → WRONG.

---

# 🧠 **5. SIMPLE RULES (FOR JR DEVS)**

Tell them ONLY this:

---

## 📌 Where do I put code?

| If you are…      | Put it in |
| ---------------- | --------- |
| writing logic    | hook      |
| showing UI       | component |
| arranging layout | view      |
| loading data     | page      |

---

## 📌 3 rules

1. If you use `useState` → hook
2. If you write JSX → component
3. If file is big → split

---

# 💣 **6. AUTO-FAIL CONDITIONS**

Reject output if:

* contains `React.createElement`
* has 500+ line file
* mixes UI + logic
* does not use `TableZ`
* does not use shared components

---

# 🔒 **7. ENFORCEMENT STRATEGY (IMPORTANT)**

When prompting AI coder, ALWAYS prepend:

```plaintext
Follow module architecture strictly. 
If any rule is violated, regenerate the entire module.
```

---

# 💡 Final Reality

Right now your system was:

> Good structure, weak enforcement

After this:

> Strong structure + enforced generation = scalable system

