import ModuleAccessGate from "@/core/auth/ModuleAccessGate";
import { UserMasterSetupPanel } from "@/modules/user-master-setup/components/UserMasterSetupPanel.js";
import { loadUserMasterSetupData } from "@/modules/user-master-setup/hooks/useUserMasterSetupData.js";

export const dynamic = "force-dynamic";

const appIdFromEnv = Number(process.env.USER_MASTER_SETUP_APP_ID);
const userMasterSetupAppId = Number.isFinite(appIdFromEnv) ? appIdFromEnv : 2;

export default async function UserMasterSetupPage() {
  try {
    const viewModel = await loadUserMasterSetupData();
    const users = Array.isArray(viewModel?.users) ? viewModel.users : [];
    const totalUsers = Number.isFinite(Number(viewModel?.totalUsers))
      ? Number(viewModel.totalUsers)
      : users.length;

    return (
      <ModuleAccessGate appId={userMasterSetupAppId}>
        <UserMasterSetupPanel users={users} totalUsers={totalUsers} />
      </ModuleAccessGate>
    );
  } catch (error) {
    return (
      <ModuleAccessGate appId={userMasterSetupAppId}>
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
