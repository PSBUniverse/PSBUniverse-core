# How to Create a New Module (Junior Dev Guide)

## What Is a Module?

A module is your own mini-app that lives inside the main project. Think of it
like a folder that the system automatically finds and turns into a working page
on the website. You **never** need to edit files outside your module folder.

---

## Where Does Your Code Go?

Everything you write goes inside **one folder**:

```
src/modules/Metal-Buildings/
```

That's it. You don't touch anything outside this folder.

---

## Your Folder Structure

Every module has the same basic shape:

```
src/modules/Metal-Buildings/
  index.js              ← The ID card for your module
  pages/
    DashboardPage.js    ← The page the user sees (server-side)
  components/
    HelloWorld.js       ← The interactive UI pieces (client-side)
```

Let's walk through each file.

---

## File 1: `index.js` — Your Module's ID Card

This tells the system "Hey, I exist, here's my name, and here's my URL."

```javascript
const metalBuildingsModule = {
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
  ],
};

export default metalBuildingsModule;
```

**What each field means:**

| Field          | What It Does                                                    |
| -------------- | --------------------------------------------------------------- |
| `key`          | A unique ID for your module (lowercase, dashes, no spaces)      |
| `app_id`       | Which application this belongs to (ask your senior for the ID)  |
| `name`         | The display name users see on the dashboard                     |
| `description`  | A short sentence shown under the module card                    |
| `icon`         | A Bootstrap icon class (e.g. `bi-building`, `bi-gear`)          |
| `group_name`   | Which group this card sits under on the dashboard               |
| `group_desc`   | Description for the group                                       |
| `order`        | Controls the sort order (lower number = appears first)          |
| `routes`       | A list of URLs and which page file to load for each one         |

The `routes` array is the most important part. Each entry says:
- `path` — the URL the user visits (e.g. `/metal-buildings`)
- `page` — the **filename** inside your `pages/` folder (without `.js`)

---

## File 2: `pages/DashboardPage.js` — The Page (Server Component)

This is the entry point for your page. It runs on the **server**.

```javascript
import HelloWorld from "../components/HelloWorld";

export default function DashboardPage() {
  return <HelloWorld />;
}
```

**Rules for page files:**

1. **DO NOT** put `"use client"` at the top. Pages must be server components.
2. Keep this file simple — just import and render your components.
3. The filename must match the `page` value in your route (e.g. `"DashboardPage"` → `DashboardPage.js`).

---

## File 3: `components/HelloWorld.js` — The UI (Client Component)

This is where your actual visible UI code goes. It runs in the **browser**.

```javascript
"use client";

export default function HelloWorld() {
  return (
    <div className="container mt-4">
      <h1>Hello World!</h1>
    </div>
  );
}
```

**Rules for component files:**

1. **DO** put `"use client"` at the very top. This is required for anything interactive (buttons, forms, state, etc.).
2. Put all your UI, hooks (`useState`, `useEffect`), and event handlers here.

---

## Why Two Files? (Server vs Client)

You might wonder: why not just put everything in one file?

**Short answer:** Next.js needs to know what runs on the server vs the browser.

- **Server components** (pages) — can talk to the database, load data, do secure stuff.
  They run once on the server and send HTML to the browser.
- **Client components** — can handle clicks, forms, animations, and anything interactive.
  They run in the user's browser.

The pattern is always:

```
Page (server) → imports → Component (client)
```

This is not something we invented — it's how Next.js works.

---

## How the System Finds Your Module (You Don't Need to Do Anything)

When the app starts, it scans every folder inside `src/modules/`. If it finds
an `index.js`, it reads your module definition and registers your routes
automatically.

When a user visits `/metal-buildings`, the system:

1. Looks through all discovered modules
2. Finds your module because its route matches `/metal-buildings`
3. Loads `pages/DashboardPage.js` from your folder
4. Renders it on screen

**You do not need to edit any file outside your module folder.** No registration
step, no config file, nothing.

---

## Adding More Pages

Want a second page at `/metal-buildings/settings`? Two steps:

### Step 1: Add the route to `index.js`

```javascript
routes: [
  { path: "/metal-buildings", page: "DashboardPage" },
  { path: "/metal-buildings/settings", page: "SettingsPage" },  // ← new
],
```

### Step 2: Create the page file

Create `pages/SettingsPage.js`:

```javascript
import SettingsForm from "../components/SettingsForm";

export default function SettingsPage() {
  return <SettingsForm />;
}
```

And `components/SettingsForm.js`:

```javascript
"use client";

export default function SettingsForm() {
  return <h1>Settings go here</h1>;
}
```

That's it. No other files to touch.

---

## Quick Checklist

- [ ] Created `src/modules/Metal-Buildings/index.js` with module definition
- [ ] Created `pages/DashboardPage.js` — **no** `"use client"`
- [ ] Created `components/HelloWorld.js` — **has** `"use client"`
- [ ] Page filename matches the `page` value in `routes`
- [ ] Did **not** edit any file outside `src/modules/Metal-Buildings/`

---

## Common Mistakes

| Mistake                                        | What Happens                              |
| ---------------------------------------------- | ----------------------------------------- |
| Adding `"use client"` to a page file           | Page won't load (server import fails)     |
| Forgetting `"use client"` on a component       | React hooks and event handlers won't work |
| Filename doesn't match the route `page` value  | 404 — page not found                      |
| Editing files outside your module folder       | You'll get a code review rejection        |
