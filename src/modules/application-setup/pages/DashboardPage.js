import React from "react";

export default async function DashboardPage() {
  return React.createElement(
    "main",
    { className: "container py-4" },
    React.createElement(
      "div",
      { className: "notice-banner notice-banner-info mb-0" },
      React.createElement("strong", { className: "d-block" }, "Application Setup moved"),
      React.createElement("span", null, "Open /application-setup to use the full management console."),
    ),
  );
}
