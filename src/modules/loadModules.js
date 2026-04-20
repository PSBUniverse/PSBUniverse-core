import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

async function readModuleEntries(modulesDir) {
  try {
    return await fs.readdir(modulesDir, { withFileTypes: true });
  } catch {
    return [];
  }
}

async function resolveModulePath(modulesDir, moduleName) {
  const modulePath = path.join(modulesDir, moduleName, "index.js");

  try {
    await fs.access(modulePath);
    return modulePath;
  } catch {
    return null;
  }
}

function createModuleUrl(modulePath) {
  const moduleUrl = pathToFileURL(modulePath);

  // Raw file URL imports are cached by Node. Bust cache in dev so module edits appear immediately.
  if (process.env.NODE_ENV !== "production") {
    moduleUrl.searchParams.set("t", String(Date.now()));
  }

  return moduleUrl;
}

export async function loadModules() {
  const modules = [];
  const seenModuleKeys = new Set();
  const modulesDir = path.join(process.cwd(), "src", "modules");
  const entries = await readModuleEntries(modulesDir);

  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue;
    }

    const modulePath = await resolveModulePath(modulesDir, entry.name);

    if (!modulePath) {
      continue;
    }

    const moduleUrl = createModuleUrl(modulePath);
    const importedModule = await import(/* webpackIgnore: true */ moduleUrl.href);
    const moduleDefinition = importedModule.default ?? importedModule;
    const moduleKey = String(moduleDefinition?.key || entry.name);

    if (seenModuleKeys.has(moduleKey)) {
      continue;
    }

    seenModuleKeys.add(moduleKey);
    modules.push(moduleDefinition);
  }

  return modules;
}
