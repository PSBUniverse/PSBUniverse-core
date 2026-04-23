const appId = 1;

const applicationSetupModule = {
  key: "application-setup",
  app_id: appId,
  name: "Application Setup",
  description: "Configure and manage application settings.",
  icon: "bi-gear",
  group_name: "Administration",
  group_desc: "Tools for system configuration and management.",
  order: 100,
  routes: [
    { path: "/application-setup", page: "DashboardPage" },
  ],
};

export default applicationSetupModule;
