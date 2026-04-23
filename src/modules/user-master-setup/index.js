const appIdFromEnv = Number(process.env.USER_MASTER_SETUP_APP_ID);
const appId = Number.isFinite(appIdFromEnv) ? appIdFromEnv : 2;

const userMasterSetupModule = {
  key: "user-master-setup",
  app_id: appId,
  name: "User Master Setup",
  description: "Manage user master records and activation status.",
  icon: "bi-people",
  group_name: "Administration",
  group_desc: "Internal setup tools for user administration.",
  order: 110,
  routes: [
    { path: "/user-master-setup", page: "DashboardPage" },
  ],
};

export default userMasterSetupModule;
