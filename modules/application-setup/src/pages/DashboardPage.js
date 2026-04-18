import React from "react";
import { loadApplicationSetupData } from "../hooks/applicationSetupData.js";
import { ApplicationSelector } from "../components/ApplicationSelector.js";
import { RoleTable } from "../components/RoleTable.js";
import { getApplicationDisplayName } from "../model/application.model.js";

export default async function DashboardPage({ searchParams }) {
  try {
    const { applications, roles } = await loadApplicationSetupData();

    const rawAppId = searchParams?.app ?? null;
    const selectedAppId = rawAppId
      ? (Number.isInteger(Number(rawAppId)) ? Number(rawAppId) : rawAppId)
      : (applications[0]?.app_id ?? null);

    const selectedApp = applications.find((a) => a.app_id === selectedAppId) ?? applications[0] ?? null;
    const resolvedAppId = selectedApp?.app_id ?? null;

    const appRoles = selectedApp
      ? roles.filter((r) => String(r.app_id || "") === String(resolvedAppId || ""))
      : [];

    return React.createElement(
      "main",
      { style: { maxWidth: 1200, margin: "24px auto", padding: "0 16px" } },
      React.createElement(
        "div",
        { style: { marginBottom: "24px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px" } },
        React.createElement(
          "div",
          null,
          React.createElement("h1", { style: { marginBottom: "8px" } }, "Configuration and Settings"),
          React.createElement(
            "p",
            { style: { color: "#666", marginBottom: "0" } },
            "Manage setup tables and mapping assignments for User Master.",
          ),
        ),
        React.createElement(
          "div",
          { style: { display: "flex", gap: "8px" } },
          React.createElement(
            "span",
            {
              style: {
                display: "inline-flex",
                alignItems: "center",
                padding: "8px 10px",
                border: "1px solid #adb5bd",
                borderRadius: "6px",
                color: "#6c757d",
                fontSize: "12px",
              },
              title: "Refresh and setup-card actions are available in full admin setup page",
            },
            "Admin setup actions available in full setup workflow",
          ),
        ),
      ),
      React.createElement(
        "div",
        { style: { display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: "24px" } },
        React.createElement(ApplicationSelector, { applications, selectedAppId: resolvedAppId }),
        // Roles panel
        React.createElement(
          "div",
          { style: { border: "1px solid #ddd", borderRadius: "8px", padding: "20px" } },
          selectedApp
            ? React.createElement(
                React.Fragment,
                null,
                React.createElement(
                  "div",
                  { style: { marginBottom: "12px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px" } },
                  React.createElement(
                    "h3",
                    { style: { marginBottom: "0" } },
                    `Roles for ${getApplicationDisplayName(selectedApp)}`,
                  ),
                  React.createElement(
                    "span",
                    {
                      style: {
                        display: "inline-flex",
                        alignItems: "center",
                        padding: "6px 10px",
                        border: "1px solid #adb5bd",
                        borderRadius: "6px",
                        color: "#6c757d",
                        fontSize: "12px",
                      },
                      title: "Role create/edit actions are available in full admin setup page",
                    },
                    "Add Role (admin setup)",
                  ),
                ),
                React.createElement(RoleTable, { selectedApp, appRoles }),
              )
            : React.createElement(RoleTable, { selectedApp: null, appRoles: [] }),
        ),
      ),
    );
  } catch (err) {
    return React.createElement(
      "main",
      { style: { maxWidth: 1200, margin: "24px auto", padding: "0 16px" } },
      React.createElement(
        "div",
        { style: { color: "red", padding: "12px", backgroundColor: "#ffe0e0", borderRadius: "4px" } },
        `Error: ${err.message || "Failed to load data"}`,
      ),
    );
  }
}
