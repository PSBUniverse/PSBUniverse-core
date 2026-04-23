### INSTRUCTIONS 1

## **Task: Update Batch Edit Mode Based on Blueprint**

### **Objective**

Refactor and update the existing **Batch Edit Mode behavior** using the specifications defined in:

```plaintext
BatchEditBlueprint.md
```

---

## **Instructions**

### **1. Read First (Mandatory)**

* Thoroughly read and understand **BatchEditBlueprint.md**
* Do NOT start coding until the behavior is clearly understood

---

### **2. Scope Limitation (STRICT)**

* ONLY modify code related to **Batch Edit Mode**
* Do NOT touch:

  * layout
  * unrelated components
  * services/repo (unless explicitly required by batch logic)
  * other features

👉 If a change is outside batch edit → **DO NOT MODIFY**

---

### **3. Apply Blueprint Behavior**

Update the current implementation to match the blueprint exactly:

* Change tracking (creates / updates / deletes)
* Inline editing behavior
* Action button behavior
* Batch state handling
* UI indicators (labels, colors, statuses)
* Save / Cancel batch logic
* Temporary ID handling (if defined)

---

### **4. Preserve Architecture**

Follow existing structure:

```plaintext
Page → View → Hook → Components
```

* Logic → must be in **hook**
* UI → must be in **components**
* Composition → must be in **view**

---

### **5. UI Requirements**

* Use shared components from:

  ```plaintext
  src/shared/components/ui
  ```
* Use `TableZ` for table behavior
* Do NOT introduce custom UI patterns outside the system

---

### **6. Code Quality Rules**

* No `React.createElement`
* No large mixed-responsibility files
* No duplicated logic
* Keep changes minimal but correct

---

### **7. Validation Pass (Required)**

After implementation:

* Verify behavior matches blueprint:

  * batch tracking works correctly
  * UI reflects correct states
  * save/cancel behaves correctly
* Ensure no regression outside batch edit

---

## **Output**

* Provide only the updated code sections/files
* Clearly indicate what was changed
* Do NOT rewrite unrelated code

---

## **Important**

If unsure about any behavior:

* Refer back to **BatchEditBlueprint.md**
* Do NOT guess or invent logic

---








### INSTRUCTIONS 2

# 🔥 **AI CODER PROMPT — SAFE BATCH EDIT REFACTOR (STRICT MODE)**

## **Task: Refactor Existing Batch Edit Mode Using Blueprint (Non-Breaking Update)**

---

## **Reference (MANDATORY)**

You MUST strictly follow:

>

Do NOT simplify, reinterpret, or partially implement it.

---

# 🎯 **Objective**

Update the **existing batch edit mode behavior** to match the blueprint while:

* ✅ Keeping current feature structure intact
* ✅ Maintaining compatibility with `TableZ`
* ❌ NOT breaking unrelated features
* ❌ NOT rewriting the entire module

---

# ⚠️ **CRITICAL RULE — DO NOT BREAK EXISTING SYSTEM**

You are NOT building from scratch.

You are:

> **Replacing ONLY the batch edit engine inside the existing implementation**

---

# 🧠 **1. Preserve These (NON-NEGOTIABLE)**

DO NOT MODIFY:

* Table layout (`TableZ`)
* Existing UI structure
* Routing / pages
* Non-batch-related logic
* Component hierarchy

👉 If it is not batch-related → DO NOT TOUCH

---

# 🧱 **2. Replace ONLY These Parts**

You MUST refactor:

### ✅ A. State Management → Convert to:

```js
draft
baseline
diff (computed)
busy
```

---

### ✅ B. Change Tracking

Replace current logic with:

* `__pendingRemove`
* temp IDs (`tmp-*`)
* diff system (`isNew`, `isChanged`, `changedColumns`)

---

### ✅ C. Action Behavior

Refactor ALL actions to:

| Action | New Behavior              |
| ------ | ------------------------- |
| Add    | adds to `draft` (temp ID) |
| Edit   | updates `draft` only      |
| Toggle | updates `draft`           |
| Delete | toggles `__pendingRemove` |
| Save   | executes batch            |
| Cancel | resets to `baseline`      |

👉 NO API calls before Save Batch

---

### ✅ D. Diff Computation

Use:

```js
useMemo(() => buildBatchDiff(...))
```

Must track:

* newRows
* modifiedRows
* removedRows
* hasPendingChanges

---

### ✅ E. UI Feedback (MUST MATCH BLUEPRINT)

Integrate with existing `TableZ`:

* row classes:

  * new
  * modified
  * pending remove
* cell highlighting
* change summary display

👉 DO NOT replace TableZ — extend it

---

### ✅ F. Save Logic

Follow EXACT:

```plaintext
DELETE → CREATE → UPDATE
```

* Use existing services
* Do NOT change API structure unless required

---

### ✅ G. Cancel Logic

```js
setDraft(clone(baseline));
```

---

# 🔌 **3. TableZ Compatibility (CRITICAL)**

You MUST:

* Keep TableZ intact
* Inject batch behavior via:

  * rowClass
  * cell render overrides
  * action handlers

👉 DO NOT rewrite TableZ
👉 DO NOT replace TableZ

---

# 🚫 **4. HARD FAIL CONDITIONS**

Immediately reject your implementation if:

* TableZ is modified structurally
* layout is changed
* unrelated features are touched
* API calls happen outside Save Batch
* no baseline/draft separation
* no diff system exists

---

# 🔍 **5. Validation Pass (MANDATORY)**

After implementation, verify:

* Editing updates ONLY draft
* UI reflects changes instantly
* Save Batch executes all changes
* Cancel restores original state
* No regression in existing features
* TableZ still works as before

---

# 🧠 **6. Implementation Strategy (FOLLOW THIS ORDER)**

1. Introduce `baseline` + `draft`
2. Replace change tracking logic
3. Implement diff system
4. Wire UI indicators into TableZ
5. Refactor action handlers
6. Refactor save logic
7. Add cancel/reset logic
8. Validate entire flow

---

# 📦 **7. Output Requirements**

* Show ONLY modified sections/files
* Highlight:

  * state changes
  * diff logic
  * action handler updates
* Do NOT rewrite full files unless necessary

---

# 🔥 FINAL ENFORCEMENT LINE

```plaintext
You are modifying an existing system. Do not break structure, do not rewrite UI, do not replace TableZ. Only replace the batch edit engine using BatchEditBlueprint.md. If any rule is violated, regenerate.
```

---

# 💣 Why this prompt works

Without this:

* AI will rewrite everything ❌
* break TableZ ❌
* mix logic again ❌

With this:

* controlled refactor ✅
* blueprint-compliant behavior ✅
* zero regression risk ✅

---

If you want next level control, I can:

* map **your current batch code → exact lines to replace**
* or build a **drop-in `useBatchEditEngine` hook** so you never rewrite this again.
