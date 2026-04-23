import ModuleAccessGate from "@/core/auth/ModuleAccessGate";
import UserMasterSetupView from "./UserMasterSetupView";
import { loadUserMasterSetupData } from "../hooks/useUserMasterSetupData.js";

const appIdFromEnv = Number(process.env.USER_MASTER_SETUP_APP_ID);
const APP_ID = Number.isFinite(appIdFromEnv) ? appIdFromEnv : 2;

export const dynamic = "force-dynamic";

export default async function UserMasterSetupPage() {
  try {
    const viewModel = await loadUserMasterSetupData();
    const users = Array.isArray(viewModel?.users) ? viewModel.users : [];
    const totalUsers = Number.isFinite(Number(viewModel?.totalUsers))
      ? Number(viewModel.totalUsers)
      : users.length;

    return (
      <ModuleAccessGate appId={APP_ID}>
        <UserMasterSetupView users={users} totalUsers={totalUsers} />
      </ModuleAccessGate>
    );
  } catch (error) {
    return (
      <ModuleAccessGate appId={APP_ID}>
        <main className="container py-4">
          <div className="notice-banner notice-banner-danger mb-0">
            <strong className="d-block">Failed to load user master setup.</strong>
            <span>{error?.message || "Unknown error"}</span>
          </div>
        </main>
      </ModuleAccessGate>
    );
  }
}
