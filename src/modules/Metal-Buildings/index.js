const metalBuildingsModule = {
  key: "metal-buildings",
  app_id: 1,
  name: "Metal Buildings",
  description: "Metal Buildings application.",
  icon: "bi-building",
  group_name: "Applications",
  group_desc: "Business applications.",
  order: 200,
  routes: [
    { path: "/metal-buildings", page: "DashboardPage" },
  ],
};

export default metalBuildingsModule;
