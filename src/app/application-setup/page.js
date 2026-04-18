import ModuleAccessGate from "@/core/auth/ModuleAccessGate";
import ApplicationSetupClient from "./ApplicationSetupClient";
import { loadApplicationSetupData } from "../../../modules/application-setup/src/hooks/applicationSetupData.js";

function parseAppId(value) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const asNumber = Number(value);

  if (Number.isFinite(asNumber)) {
    return asNumber;
  }

  return String(value);
}

export default async function ApplicationSetupPage({ searchParams }) {
  const resolvedSearchParams = await searchParams;

  try {
    const viewModel = await loadApplicationSetupData();
    const applications = Array.isArray(viewModel?.applications) ? viewModel.applications : [];
    const roles = Array.isArray(viewModel?.roles) ? viewModel.roles : [];

    const initialSelectedAppId =
      parseAppId(resolvedSearchParams?.app)
      ?? applications[0]?.app_id
      ?? null;

    return (
      <ModuleAccessGate appId={1}>
        <ApplicationSetupClient
          applications={applications}
          roles={roles}
          initialSelectedAppId={initialSelectedAppId}
        />
      </ModuleAccessGate>
    );
  } catch (error) {
    return (
      <ModuleAccessGate appId={1}>
        <main className="container py-4">
          <div className="notice-banner notice-banner-danger mb-0">
            <strong className="d-block">Failed to load application setup.</strong>
            <span>{error?.message || "Unknown error"}</span>
          </div>
        </main>
      </ModuleAccessGate>
    );
  }
}
