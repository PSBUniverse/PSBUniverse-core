import { useMemo } from "react";
import { Badge, Card, TableZ } from "@/shared/components/ui";
import { isSameId } from "../utils/cardModuleHelpers";

function StatusBadge({ isActive }) {
  return <Badge bg={isActive ? "success" : "primary"} text="light">{isActive ? "Active" : "Inactive"}</Badge>;
}

function batchMarker(bs) {
  const map = {
    deleted: { t: "Deactivated", c: "psb-batch-marker psb-batch-marker-deleted" },
    created: { t: "New", c: "psb-batch-marker psb-batch-marker-new" },
    updated: { t: "Edited", c: "psb-batch-marker psb-batch-marker-edited" },
    reordered: { t: "Reordered", c: "psb-batch-marker psb-batch-marker-reordered" },
  };
  return map[bs] || { t: "", c: "" };
}

export function GroupTable({
  decoratedGroups, selectedGroup, isSaving, isMutatingAction,
  pendingDeactivatedGroupIds, handleGroupRowClick, handleGroupReorder,
  openEditGroupDialog, openToggleGroupDialog, openDeactivateGroupDialog,
}) {
  const columns = useMemo(() => [
    {
      key: "display_order", label: "Order", width: "10%", sortable: true, align: "center",
      render: (row) => {
        const prev = row?.__previousOrder;
        return (
          <span>
            {row?.display_order ?? "--"}
            {prev != null ? <> <span className="psb-batch-marker psb-batch-marker-edited">was {prev}</span></> : null}
          </span>
        );
      },
    },
    {
      key: "group_name", label: "Group Name", width: "35%", sortable: true,
      render: (row) => {
        const m = batchMarker(row?.__batchState || "");
        const cls = [
          isSameId(row?.group_id, selectedGroup?.group_id) ? "fw-semibold text-primary" : "",
          row?.__batchState === "deleted" ? "text-decoration-line-through" : "",
        ].filter(Boolean).join(" ");
        return <span className={cls}>{row?.group_name || "--"}{m.t ? <span className={m.c}>{m.t}</span> : null}</span>;
      },
    },
    { key: "group_desc", label: "Description", width: "28%", sortable: true },
    {
      key: "group_icon", label: "Icon", width: "12%", sortable: false, align: "center", defaultVisible: false,
      render: (row) => <i className={`bi ${row?.group_icon || row?.icon || "bi-collection"}`} aria-hidden="true" />,
    },
    {
      key: "is_active_bool", label: "Active", width: "10%", sortable: true, align: "center",
      render: (row) => <StatusBadge isActive={Boolean(row?.is_active_bool)} />,
    },
  ], [selectedGroup?.group_id]);

  const actions = useMemo(() => [
    { key: "edit-group", label: "Edit", type: "secondary", icon: "pencil-square",
      disabled: (r) => isSaving || isMutatingAction || pendingDeactivatedGroupIds.has(String(r?.group_id ?? "")),
      onClick: (r) => openEditGroupDialog(r) },
    { key: "disable-group", label: "Disable", type: "secondary", icon: "slash-circle",
      visible: (r) => Boolean(r?.is_active_bool),
      disabled: (r) => isSaving || isMutatingAction || pendingDeactivatedGroupIds.has(String(r?.group_id ?? "")),
      onClick: (r) => openToggleGroupDialog(r) },
    { key: "enable-group", label: "Enable", type: "secondary", icon: "check-circle",
      visible: (r) => !Boolean(r?.is_active_bool),
      disabled: (r) => isSaving || isMutatingAction || pendingDeactivatedGroupIds.has(String(r?.group_id ?? "")),
      onClick: (r) => openToggleGroupDialog(r) },
    { key: "deactivate-group", label: "Deactivate", type: "danger", icon: "trash",
      disabled: (r) => isSaving || isMutatingAction || pendingDeactivatedGroupIds.has(String(r?.group_id ?? "")),
      onClick: (r) => openDeactivateGroupDialog(r) },
  ], [isMutatingAction, isSaving, openDeactivateGroupDialog, openEditGroupDialog, openToggleGroupDialog, pendingDeactivatedGroupIds]);

  return (
    <Card title="Card Groups" subtitle="Drag the grip icon in Actions to reorder groups.">
      <TableZ columns={columns} data={decoratedGroups} rowIdKey="group_id"
        selectedRowId={selectedGroup?.group_id ?? null} onRowClick={handleGroupRowClick}
        actions={actions} draggable={!isSaving && !isMutatingAction}
        onReorder={handleGroupReorder} emptyMessage="No card groups found for this application." />
    </Card>
  );
}
