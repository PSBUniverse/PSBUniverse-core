import { useMemo } from "react";
import { Badge, Card, TableZ } from "@/shared/components/ui";

function StatusBadge({ isActive }) {
  return <Badge bg={isActive ? "success" : "primary"} text="light">{isActive ? "Active" : "Inactive"}</Badge>;
}

function batchMarker(batchState) {
  if (batchState === "deleted") return { text: "Deactivated", cls: "psb-batch-marker psb-batch-marker-deleted" };
  if (batchState === "created") return { text: "New", cls: "psb-batch-marker psb-batch-marker-new" };
  if (batchState === "updated") return { text: "Edited", cls: "psb-batch-marker psb-batch-marker-edited" };
  return { text: "", cls: "" };
}

export function RolePanel({
  selectedApp, decoratedSelectedAppRoles, isSavingOrder, isMutatingAction,
  pendingDeactivatedRoleIds, openEditRoleDialog, openToggleRoleDialog, openDeactivateRoleDialog,
}) {
  const columns = useMemo(() => [
    {
      key: "role_name", label: "Role Name", width: "30%", sortable: true,
      render: (row) => {
        const m = batchMarker(row?.__batchState || "");
        return (
          <span className={row?.__batchState === "deleted" ? "text-decoration-line-through" : ""}>
            {row?.role_name || "--"}
            {m.text ? <span className={m.cls}>{m.text}</span> : null}
          </span>
        );
      },
    },
    { key: "role_desc", label: "Description", width: "44%", sortable: true },
    {
      key: "is_active_bool", label: "Active", width: "16%", sortable: true, align: "center",
      render: (row) => <StatusBadge isActive={Boolean(row?.is_active_bool)} />,
    },
  ], []);

  const actions = useMemo(() => [
    {
      key: "edit-role", label: "Edit", type: "secondary", icon: "pencil-square",
      disabled: (r) => isSavingOrder || isMutatingAction || pendingDeactivatedRoleIds.has(String(r?.role_id ?? "")),
      onClick: (r) => openEditRoleDialog(r),
    },
    {
      key: "disable-role", label: "Disable", type: "secondary", icon: "slash-circle",
      visible: (r) => Boolean(r?.is_active_bool),
      disabled: (r) => isSavingOrder || isMutatingAction || pendingDeactivatedRoleIds.has(String(r?.role_id ?? "")),
      onClick: (r) => openToggleRoleDialog(r),
    },
    {
      key: "enable-role", label: "Enable", type: "secondary", icon: "check-circle",
      visible: (r) => !Boolean(r?.is_active_bool),
      disabled: (r) => isSavingOrder || isMutatingAction || pendingDeactivatedRoleIds.has(String(r?.role_id ?? "")),
      onClick: (r) => openToggleRoleDialog(r),
    },
    {
      key: "deactivate-role", label: "Deactivate", type: "danger", icon: "trash",
      disabled: (r) => isSavingOrder || isMutatingAction || pendingDeactivatedRoleIds.has(String(r?.role_id ?? "")),
      onClick: (r) => openDeactivateRoleDialog(r),
    },
  ], [isMutatingAction, isSavingOrder, openDeactivateRoleDialog, openEditRoleDialog,
    openToggleRoleDialog, pendingDeactivatedRoleIds]);

  return (
    <Card
      title={selectedApp ? `Roles for: ${selectedApp.app_name}` : "Roles"}
      subtitle={selectedApp ? "Application-scoped roles" : "Click an application row to view its roles."}
    >
      {selectedApp ? (
        <TableZ
          columns={columns} data={decoratedSelectedAppRoles} rowIdKey="role_id"
          actions={actions} emptyMessage="No roles assigned to this application."
        />
      ) : (
        <div className="notice-banner notice-banner-info mb-0">Click an application row to view its roles.</div>
      )}
    </Card>
  );
}
