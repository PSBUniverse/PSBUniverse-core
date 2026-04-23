const appIdFromEnv = Number(process.env.STATUS_SETUP_APP_ID);
const appId = Number.isFinite(appIdFromEnv) ? appIdFromEnv : 1;

const statusSetupModule = {
  key: "status-setup",
  app_id: appId,
  name: "Status Setup",
  description: "Configure system statuses.",
  icon: "bi-tags",
  group_name: "Administration",
  group_desc: "Tools for organization setup and management.",
  order: 140,
  routes: [
    { path: "/status-setup", page: "DashboardPage" },
  ],
};

export default statusSetupModule;
