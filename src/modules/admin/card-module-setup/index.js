const appIdFromEnv = Number(process.env.CARD_MODULE_SETUP_APP_ID);
const appId = Number.isFinite(appIdFromEnv) ? appIdFromEnv : 1;

const cardModuleSetupModule = {
  key: "card-module-setup",
  app_id: appId,
  name: "Card Module Setup",
  description: "Configure application card groups and cards.",
  icon: "bi-card-list",
  group_name: "Administration",
  group_desc: "Tools for system configuration and management.",
  order: 130,
  routes: [
    { path: "/admin/card-module-setup", page: "DashboardPage" },
  ],
};

export default cardModuleSetupModule;
