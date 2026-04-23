import { useMemo } from "react";
import { Badge, Card, TableZ } from "@/shared/components/ui";
import { isSameId } from "../utils/applicationHelpers";

function StatusBadge({ isActive }) {
  return <Badge bg={isActive ? "success" : "primary"} text="light">{isActive ? "Active" : "Inactive"}</Badge>;
}

function batchMarker(batchState) {
  if (batchState === "deleted") return { text: "Deactivated", cls: "psb-batch-marker psb-batch-marker-deleted" };
  if (batchState === "created") return { text: "New", cls: "psb-batch-marker psb-batch-marker-new" };
  if (batchState === "updated") return { text: "Edited", cls: "psb-batch-marker psb-batch-marker-edited" };
  return { text: "", cls: "" };
}

export function ApplicationTable({
  decoratedApplications, selectedApp, isSavingOrder, isMutatingAction,
  pendingDeactivatedAppIds, handleApplicationRowClick, handleApplicationReorder,
  openEditApplicationDialog, openToggleApplicationDialog, openDeactivateApplicationDialog,
}) {
  const columns = useMemo(() => [
    {
      key: "app_name", label: "Application Name", width: "30%", sortable: true,
      render: (row) => {
        const m = batchMarker(row?.__batchState || "");
        const cls = [
          isSameId(row?.app_id, selectedApp?.app_id) ? "fw-semibold text-primary" : "",
          row?.__batchState === "deleted" ? "text-decoration-line-through" : "",
        ].filter(Boolean).join(" ");
        return (
          <span className={cls}>
            {row?.app_name || "--"}
            {m.text ? <span className={m.cls}>{m.text}</span> : null}
          </span>
        );
      },
    },
    { key: "app_order", label: "Order", width: "10%", sortable: true, align: "center" },
    { key: "app_desc", label: "Description", width: "38%", sortable: true },
    {
      key: "is_active_bool", label: "Active", width: "12%", sortable: true, align: "center",
      render: (row) => <StatusBadge isActive={Boolean(row?.is_active_bool)} />,
    },
  ], [selectedApp?.app_id]);

  const actions = useMemo(() => [
    {
      key: "edit-application", label: "Edit", type: "secondary", icon: "pencil-square",
      disabled: (r) => isSavingOrder || isMutatingAction || pendingDeactivatedAppIds.has(String(r?.app_id ?? "")),
      onClick: (r) => openEditApplicationDialog(r),
    },
    {
      key: "disable-application", label: "Disable", type: "secondary", icon: "slash-circle",
      visible: (r) => Boolean(r?.is_active_bool),
      disabled: (r) => isSavingOrder || isMutatingAction || pendingDeactivatedAppIds.has(String(r?.app_id ?? "")),
      onClick: (r) => openToggleApplicationDialog(r),
    },
    {
      key: "enable-application", label: "Enable", type: "secondary", icon: "check-circle",
      visible: (r) => !Boolean(r?.is_active_bool),
      disabled: (r) => isSavingOrder || isMutatingAction || pendingDeactivatedAppIds.has(String(r?.app_id ?? "")),
      onClick: (r) => openToggleApplicationDialog(r),
    },
    {
      key: "deactivate-application", label: "Deactivate", type: "danger", icon: "trash",
      disabled: (r) => isSavingOrder || isMutatingAction || pendingDeactivatedAppIds.has(String(r?.app_id ?? "")),
      onClick: (r) => openDeactivateApplicationDialog(r),
    },
  ], [isMutatingAction, isSavingOrder, openDeactivateApplicationDialog, openEditApplicationDialog,
    openToggleApplicationDialog, pendingDeactivatedAppIds]);

  return (
    <Card title="Applications" subtitle="Drag the grip icon in Actions to reorder applications.">
      <TableZ
        columns={columns} data={decoratedApplications} rowIdKey="app_id"
        selectedRowId={selectedApp?.app_id ?? null} onRowClick={handleApplicationRowClick}
        actions={actions} draggable={!isSavingOrder && !isMutatingAction}
        onReorder={handleApplicationReorder} emptyMessage="No applications found."
      />
    </Card>
  );
}
