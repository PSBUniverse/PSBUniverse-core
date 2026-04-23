import { notFound } from "next/navigation";
import { loadModules } from "@/modules/loadModules";
import ModuleAccessGate from "@/core/auth/ModuleAccessGate";

const pageImporters = {
  "application-setup": (page) => import(`@/modules/application-setup/pages/${page}`),
  "card-module-setup": (page) => import(`@/modules/card-module-setup/pages/${page}`),
  "company-department-setup": (page) => import(`@/modules/company-department-setup/pages/${page}`),
  "status-setup": (page) => import(`@/modules/status-setup/pages/${page}`),
  "user-master-setup": (page) => import(`@/modules/user-master-setup/pages/${page}`),
};

function buildPath(segments) {
  return `/${segments.join("/")}`;
}

export default async function ModuleRoutePage({ params, searchParams }) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const currentPath = buildPath(resolvedParams?.modulePath || []);
  const modules = await loadModules();

  if (!Array.isArray(modules)) {
    notFound();
  }

  modules.forEach((mod) => {
    mod.routes?.sort((a, b) => b.path.length - a.path.length);
  });

  for (const moduleDefinition of modules) {
    if (!moduleDefinition?.key || !moduleDefinition?.app_id) {
      continue;
    }

    if (!moduleDefinition?.routes) {
      continue;
    }

    for (const route of moduleDefinition.routes) {
      if (!currentPath.startsWith(route.path)) {
        continue;
      }

      const importer = pageImporters[moduleDefinition.key];

      if (!importer || !route.page) {
        continue;
      }

      const pageModule = await importer(route.page);
      const Component = pageModule.default;

      return (
        <ModuleAccessGate appId={moduleDefinition.app_id}>
          <Component searchParams={resolvedSearchParams} />
        </ModuleAccessGate>
      );
    }
  }

  notFound();
}
