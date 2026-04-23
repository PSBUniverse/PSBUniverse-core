import { useMemo } from "react";
import { Badge, Card, TableZ } from "@/shared/components/ui";

function StatusBadge({ isActive }) {
  return (
    <Badge bg={isActive ? "success" : "primary"} text="light">
      {isActive ? "Active" : "Inactive"}
    </Badge>
  );
}

export function StatusTable({
  decoratedStatuses,
  isMutatingAction,
  isSavingBatch,
  pendingDeactivatedStatusIds,
  openEditStatusDialog,
  openToggleStatusDialog,
  openDeactivateStatusDialog,
}) {
  const columns = useMemo(
    () => [
      {
        key: "sts_name",
        label: "Status Name",
        width: "30%",
        sortable: true,
        render: (row) => {
          const batchState = String(row?.__batchState || "");

          let markerText = "";
          let markerClass = "";

          switch (batchState) {
            case "deleted":
              markerText = "Deactivated";
              markerClass = "psb-batch-marker psb-batch-marker-deleted";
              break;
            case "created":
              markerText = "New";
              markerClass = "psb-batch-marker psb-batch-marker-new";
              break;
            case "updated":
              markerText = "Edited";
              markerClass = "psb-batch-marker psb-batch-marker-edited";
              break;
            case "activated":
              markerText = "Activated";
              markerClass = "psb-batch-marker psb-batch-marker-activated";
              break;
            case "deactivated":
              markerText = "Deactivated";
              markerClass = "psb-batch-marker psb-batch-marker-deactivated";
              break;
            default:
              break;
          }

          const textClassName = batchState === "deleted" ? "text-decoration-line-through" : "";

          return (
            <span className={textClassName}>
              {row?.sts_name || "--"}
              {markerText ? <span className={markerClass}>{markerText}</span> : null}
            </span>
          );
        },
      },
      {
        key: "sts_desc",
        label: "Description",
        width: "48%",
        sortable: true,
      },
      {
        key: "is_active_bool",
        label: "Active",
        width: "22%",
        sortable: true,
        align: "center",
        render: (row) => <StatusBadge isActive={Boolean(row?.is_active_bool)} />,
      },
    ],
    [],
  );

  const actions = useMemo(
    () => [
      {
        key: "edit-status",
        label: "Edit",
        type: "secondary",
        icon: "pencil-square",
        disabled: (row) => {
          const isPendingDeactivation = pendingDeactivatedStatusIds.has(String(row?.status_id ?? ""));
          return isMutatingAction || isSavingBatch || isPendingDeactivation;
        },
        onClick: (row) => openEditStatusDialog(row),
      },
      {
        key: "disable-status",
        label: "Disable",
        type: "secondary",
        icon: "slash-circle",
        visible: (row) => Boolean(row?.is_active_bool),
        disabled: (row) => {
          const isPendingDeactivation = pendingDeactivatedStatusIds.has(String(row?.status_id ?? ""));
          return isMutatingAction || isSavingBatch || isPendingDeactivation;
        },
        onClick: (row) => openToggleStatusDialog(row),
      },
      {
        key: "enable-status",
        label: "Enable",
        type: "secondary",
        icon: "check-circle",
        visible: (row) => !Boolean(row?.is_active_bool),
        disabled: (row) => {
          const isPendingDeactivation = pendingDeactivatedStatusIds.has(String(row?.status_id ?? ""));
          return isMutatingAction || isSavingBatch || isPendingDeactivation;
        },
        onClick: (row) => openToggleStatusDialog(row),
      },
      {
        key: "deactivate-status",
        label: "Deactivate",
        type: "danger",
        icon: "trash",
        disabled: (row) => {
          const isPendingDeactivation = pendingDeactivatedStatusIds.has(String(row?.status_id ?? ""));
          return isMutatingAction || isSavingBatch || isPendingDeactivation;
        },
        onClick: (row) => openDeactivateStatusDialog(row),
      },
    ],
    [
      isMutatingAction,
      isSavingBatch,
      openDeactivateStatusDialog,
      openEditStatusDialog,
      openToggleStatusDialog,
      pendingDeactivatedStatusIds,
    ],
  );

  return (
    <div className="row g-3 align-items-start">
      <div className="col-12">
        <Card title="Statuses" subtitle="System-wide status records.">
          <TableZ
            columns={columns}
            data={decoratedStatuses}
            rowIdKey="status_id"
            actions={actions}
            emptyMessage="No statuses found."
          />
        </Card>
      </div>
    </div>
  );
}
