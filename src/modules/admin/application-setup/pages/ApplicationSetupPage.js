import ModuleAccessGate from "@/core/auth/ModuleAccessGate";
import ApplicationSetupView from "../view/ApplicationSetupView";
import { loadApplicationSetupData } from "../hooks/applicationSetupData.js";

function parseAppId(value) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const asNumber = Number(value);
  return Number.isFinite(asNumber) ? asNumber : String(value);
}

const APP_ID = 1;

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
      <ModuleAccessGate appId={APP_ID}>
        <ApplicationSetupView
          applications={applications}
          roles={roles}
          initialSelectedAppId={initialSelectedAppId}
        />
      </ModuleAccessGate>
    );
  } catch (error) {
    return (
      <ModuleAccessGate appId={APP_ID}>
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
