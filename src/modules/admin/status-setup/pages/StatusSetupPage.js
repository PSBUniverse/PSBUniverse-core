import ModuleAccessGate from "@/core/auth/ModuleAccessGate";
import StatusSetupView from "../view/StatusSetupView";
import { loadStatusSetupData } from "../hooks/statusSetupData.js";

const appIdFromEnv = Number(process.env.STATUS_SETUP_APP_ID);
const APP_ID = Number.isFinite(appIdFromEnv) ? appIdFromEnv : 1;

export default async function StatusSetupPage() {
  try {
    const viewModel = await loadStatusSetupData();
    const statuses = Array.isArray(viewModel?.statuses) ? viewModel.statuses : [];

    return (
      <ModuleAccessGate appId={APP_ID}>
        <StatusSetupView statuses={statuses} />
      </ModuleAccessGate>
    );
  } catch (error) {
    return (
      <ModuleAccessGate appId={APP_ID}>
        <main className="container py-4">
          <div className="notice-banner notice-banner-danger mb-0">
            <strong className="d-block">Failed to load status setup.</strong>
            <span>{error?.message || "Unknown error"}</span>
          </div>
        </main>
      </ModuleAccessGate>
    );
  }
}
