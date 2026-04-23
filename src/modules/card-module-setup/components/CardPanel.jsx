import { useMemo } from "react";
import { Badge, Card, TableZ } from "@/shared/components/ui";

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

export function CardPanel({
  selectedGroup, decoratedSelectedGroupCards, isSaving, isMutatingAction,
  pendingDeactivatedCardIds, handleCardReorder,
  openEditCardDialog, openToggleCardDialog, openDeactivateCardDialog,
}) {
  const columns = useMemo(() => [
    {
      key: "display_order", label: "Order", width: "8%", sortable: true, align: "center",
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
      key: "card_name", label: "Card Name", width: "25%", sortable: true,
      render: (row) => {
        const m = batchMarker(row?.__batchState || "");
        return (
          <span className={row?.__batchState === "deleted" ? "text-decoration-line-through" : ""}>
            {row?.card_name || "--"}{m.t ? <span className={m.c}>{m.t}</span> : null}
          </span>
        );
      },
    },
    { key: "card_desc", label: "Description", width: "20%", sortable: true, defaultVisible: false },
    {
      key: "route_path", label: "Route", width: "25%", sortable: true,
      render: (row) => <code className="small">{row?.route_path || "#"}</code>,
    },
    {
      key: "card_icon", label: "Icon", width: "10%", sortable: false, align: "center", defaultVisible: false,
      render: (row) => <i className={`bi ${row?.card_icon || row?.icon || "bi-grid-3x3-gap"}`} aria-hidden="true" />,
    },
    {
      key: "is_active_bool", label: "Active", width: "12%", sortable: true, align: "center",
      render: (row) => <StatusBadge isActive={Boolean(row?.is_active_bool)} />,
    },
  ], []);

  const actions = useMemo(() => [
    { key: "edit-card", label: "Edit", type: "secondary", icon: "pencil-square",
      disabled: (r) => isSaving || isMutatingAction || pendingDeactivatedCardIds.has(String(r?.card_id ?? "")),
      onClick: (r) => openEditCardDialog(r) },
    { key: "disable-card", label: "Disable", type: "secondary", icon: "slash-circle",
      visible: (r) => Boolean(r?.is_active_bool),
      disabled: (r) => isSaving || isMutatingAction || pendingDeactivatedCardIds.has(String(r?.card_id ?? "")),
      onClick: (r) => openToggleCardDialog(r) },
    { key: "enable-card", label: "Enable", type: "secondary", icon: "check-circle",
      visible: (r) => !Boolean(r?.is_active_bool),
      disabled: (r) => isSaving || isMutatingAction || pendingDeactivatedCardIds.has(String(r?.card_id ?? "")),
      onClick: (r) => openToggleCardDialog(r) },
    { key: "deactivate-card", label: "Deactivate", type: "danger", icon: "trash",
      disabled: (r) => isSaving || isMutatingAction || pendingDeactivatedCardIds.has(String(r?.card_id ?? "")),
      onClick: (r) => openDeactivateCardDialog(r) },
  ], [isMutatingAction, isSaving, openDeactivateCardDialog, openEditCardDialog, openToggleCardDialog, pendingDeactivatedCardIds]);

  return (
    <Card
      title={selectedGroup ? `Cards for: ${selectedGroup.group_name}` : "Cards"}
      subtitle={selectedGroup ? "Drag rows to reorder cards within the group" : "Click a card group row to view its cards."}
    >
      {selectedGroup ? (
        <TableZ columns={columns} data={decoratedSelectedGroupCards} rowIdKey="card_id"
          actions={actions} emptyMessage="No cards assigned to this group."
          draggable={!isSaving && !isMutatingAction} onReorder={handleCardReorder} />
      ) : (
        <div className="notice-banner notice-banner-info mb-0">Click a card group row to view its cards.</div>
      )}
    </Card>
  );
}
