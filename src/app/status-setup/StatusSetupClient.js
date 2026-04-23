"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge, Button, Card, Input, Modal, TableZ, toastError, toastSuccess } from "@/shared/components/ui";
import {
  getStatusDescription,
  getStatusDisplayName,
  isStatusActive,
} from "@/modules/status-setup/model/status.model.js";

function isSameId(left, right) {
  return String(left ?? "") === String(right ?? "");
}

function compareText(left, right) {
  return String(left || "").localeCompare(String(right || ""), undefined, {
    sensitivity: "base",
    numeric: true,
  });
}

function resolveErrorMessage(payload, fallbackMessage) {
  if (payload && typeof payload === "object" && typeof payload.error === "string" && payload.error.trim()) {
    return payload.error.trim();
  }

  return fallbackMessage;
}

function normalizeText(value) {
  return String(value ?? "").trim();
}

function mapStatusRow(status, index) {
  return {
    ...status,
    id: status?.status_id ?? `status-${index}`,
    sts_name: getStatusDisplayName(status),
    sts_desc: getStatusDescription(status),
    is_active_bool: isStatusActive(status),
  };
}

function removeObjectKey(objectValue, keyToRemove) {
  const normalizedKey = String(keyToRemove ?? "");
  const nextObject = {};

  Object.entries(objectValue || {}).forEach(([key, value]) => {
    if (key !== normalizedKey) {
      nextObject[key] = value;
    }
  });

  return nextObject;
}

function mergeUpdatePatch(previousPatch, nextPatch) {
  const mergedPatch = {
    ...(previousPatch || {}),
  };

  Object.entries(nextPatch || {}).forEach(([key, value]) => {
    if (value !== undefined) {
      mergedPatch[key] = value;
    }
  });

  return mergedPatch;
}

function appendUniqueId(idList, value) {
  const normalizedValue = String(value ?? "");

  if (!normalizedValue) {
    return Array.isArray(idList) ? [...idList] : [];
  }

  const existing = Array.isArray(idList) ? idList : [];
  if (existing.some((entry) => isSameId(entry, normalizedValue))) {
    return [...existing];
  }

  return [...existing, normalizedValue];
}

const EMPTY_DIALOG = {
  kind: null,
  target: null,
  nextIsActive: null,
};

const TEMP_STATUS_PREFIX = "tmp-status-";

function createTempId(prefix) {
  return `${prefix}${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function isTempStatusId(value) {
  return String(value ?? "").startsWith(TEMP_STATUS_PREFIX);
}

function createEmptyStatusChanges() {
  return {
    creates: [],
    updates: {},
    deactivations: [],
  };
}

function StatusBadge({ isActive }) {
  return (
    <Badge bg={isActive ? "success" : "primary"} text="light">
      {isActive ? "Active" : "Inactive"}
    </Badge>
  );
}

export default function StatusSetupClient({ statuses = [] }) {
  const router = useRouter();

  const seedStatuses = useMemo(
    () =>
      (Array.isArray(statuses) ? statuses : [])
        .map((status, index) => mapStatusRow(status, index))
        .sort((left, right) => compareText(left.sts_name, right.sts_name)),
    [statuses],
  );

  const [orderedStatuses, setOrderedStatuses] = useState(seedStatuses);
  const [statusChanges, setStatusChanges] = useState(createEmptyStatusChanges());
  const [isMutatingAction, setIsMutatingAction] = useState(false);
  const [isSavingBatch, setIsSavingBatch] = useState(false);
  const [dialog, setDialog] = useState(EMPTY_DIALOG);
  const [statusDraft, setStatusDraft] = useState({ name: "", desc: "" });

  useEffect(() => {
    setOrderedStatuses(seedStatuses);
    setStatusChanges(createEmptyStatusChanges());
    setDialog(EMPTY_DIALOG);
    setStatusDraft({ name: "", desc: "" });
    setIsMutatingAction(false);
    setIsSavingBatch(false);
  }, [seedStatuses]);

  const pendingSummary = useMemo(() => {
    const added = statusChanges.creates.length;
    const edited = Object.keys(statusChanges.updates || {}).length;
    const deactivated = statusChanges.deactivations.length;

    return {
      added,
      edited,
      deactivated,
      total: added + edited + deactivated,
    };
  }, [statusChanges]);

  const hasPendingChanges = pendingSummary.total > 0;

  const pendingDeactivatedStatusIds = useMemo(
    () => new Set((statusChanges.deactivations || []).map((id) => String(id ?? ""))),
    [statusChanges.deactivations],
  );

  const decoratedStatuses = useMemo(() => {
    const createdIds = new Set((statusChanges.creates || []).map((entry) => String(entry?.tempId ?? "")));
    const updatesMap = statusChanges.updates || {};
    const deactivatedIds = new Set((statusChanges.deactivations || []).map((entry) => String(entry ?? "")));

    return orderedStatuses.map((row) => {
      const id = String(row?.status_id ?? "");

      if (deactivatedIds.has(id)) {
        return { ...row, __batchState: "deleted" };
      }

      if (createdIds.has(id)) {
        return { ...row, __batchState: "created" };
      }

      const updates = updatesMap[id];
      if (updates) {
        const hasIsActive = Object.prototype.hasOwnProperty.call(updates, "is_active");
        const hasOtherFields = Object.keys(updates).some((k) => k !== "is_active");

        if (hasIsActive && !hasOtherFields) {
          return { ...row, __batchState: updates.is_active ? "activated" : "deactivated" };
        }

        if (hasIsActive && hasOtherFields) {
          return { ...row, __batchState: updates.is_active ? "activated" : "deactivated" };
        }

        return { ...row, __batchState: "updated" };
      }

      return { ...row, __batchState: "none" };
    });
  }, [statusChanges.creates, statusChanges.deactivations, statusChanges.updates, orderedStatuses]);

  const requestJson = useCallback(async (url, options, fallbackMessage) => {
    const response = await fetch(url, options);
    const payload = await response.json().catch(() => ({}));

    if (!response.ok || payload?.ok === false) {
      throw new Error(resolveErrorMessage(payload, fallbackMessage));
    }

    return payload;
  }, []);

  const closeDialog = useCallback(() => {
    if (isMutatingAction || isSavingBatch) {
      return;
    }

    setDialog(EMPTY_DIALOG);
  }, [isMutatingAction, isSavingBatch]);

  const handleCancelBatch = useCallback(() => {
    if (isMutatingAction || isSavingBatch) {
      return;
    }

    if (!hasPendingChanges) {
      return;
    }

    setOrderedStatuses(seedStatuses);
    setStatusChanges(createEmptyStatusChanges());
    setDialog(EMPTY_DIALOG);
    setStatusDraft({ name: "", desc: "" });
    toastSuccess("Batch changes canceled.", "Batching");
  }, [hasPendingChanges, isMutatingAction, isSavingBatch, seedStatuses]);

  const handleSaveBatch = useCallback(async () => {
    if (!hasPendingChanges || isSavingBatch || isMutatingAction) {
      return;
    }

    setIsSavingBatch(true);
    setIsMutatingAction(true);

    try {
      const deactivatedSet = new Set((statusChanges.deactivations || []).map((id) => String(id ?? "")));
      const tempIdMap = new Map();

      for (const createEntry of statusChanges.creates || []) {
        const payload = await requestJson(
          "/api/status-setup/statuses",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(createEntry.payload),
          },
          "Failed to create status.",
        );

        const createdId = payload?.status?.status_id;

        if (createdId === undefined || createdId === null || createdId === "") {
          throw new Error("Created status response is invalid.");
        }

        tempIdMap.set(String(createEntry.tempId), createdId);
      }

      for (const [statusId, updates] of Object.entries(statusChanges.updates || {})) {
        const resolvedStatusId = tempIdMap.get(String(statusId)) ?? statusId;

        if (deactivatedSet.has(String(resolvedStatusId))) {
          continue;
        }

        if (isTempStatusId(resolvedStatusId)) {
          continue;
        }

        const updateKeys = Object.keys(updates || {});
        if (updateKeys.length === 0) {
          continue;
        }

        await requestJson(
          `/api/status-setup/statuses/${encodeURIComponent(String(resolvedStatusId))}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updates),
          },
          "Failed to update status.",
        );
      }

      for (const statusId of statusChanges.deactivations || []) {
        const resolvedStatusId = tempIdMap.get(String(statusId)) ?? statusId;

        if (isTempStatusId(resolvedStatusId)) {
          continue;
        }

        await requestJson(
          `/api/status-setup/statuses/${encodeURIComponent(String(resolvedStatusId))}`,
          { method: "DELETE" },
          "Failed to deactivate status.",
        );
      }

      setStatusChanges(createEmptyStatusChanges());
      router.refresh();
      toastSuccess(`Saved ${pendingSummary.total} batched change(s).`, "Save Batch");
    } catch (error) {
      toastError(error?.message || "Failed to save batched changes.");
    } finally {
      setIsMutatingAction(false);
      setIsSavingBatch(false);
    }
  }, [
    hasPendingChanges,
    isMutatingAction,
    isSavingBatch,
    pendingSummary.total,
    requestJson,
    router,
    statusChanges.creates,
    statusChanges.deactivations,
    statusChanges.updates,
  ]);

  const openAddStatusDialog = useCallback(() => {
    if (isMutatingAction || isSavingBatch) {
      return;
    }

    setStatusDraft({ name: "", desc: "" });
    setDialog({ kind: "add-status", target: null, nextIsActive: true });
  }, [isMutatingAction, isSavingBatch]);

  const openEditStatusDialog = useCallback((row) => {
    if (isMutatingAction || isSavingBatch) {
      return;
    }

    setStatusDraft({
      name: String(row?.sts_name || ""),
      desc: String(row?.sts_desc === "--" ? "" : (row?.sts_desc || "")),
    });

    setDialog({ kind: "edit-status", target: row, nextIsActive: null });
  }, [isMutatingAction, isSavingBatch]);

  const openToggleStatusDialog = useCallback((row) => {
    if (isMutatingAction || isSavingBatch) {
      return;
    }

    setDialog({ kind: "toggle-status", target: row, nextIsActive: !Boolean(row?.is_active_bool) });
  }, [isMutatingAction, isSavingBatch]);

  const openDeactivateStatusDialog = useCallback((row) => {
    if (isMutatingAction || isSavingBatch) {
      return;
    }

    setDialog({ kind: "deactivate-status", target: row, nextIsActive: null });
  }, [isMutatingAction, isSavingBatch]);

  const submitAddStatus = useCallback(() => {
    const statusName = normalizeText(statusDraft.name);
    if (!statusName) {
      toastError("Status name is required.");
      return;
    }

    const tempStatusId = createTempId(TEMP_STATUS_PREFIX);
    const statusDesc = normalizeText(statusDraft.desc);

    setOrderedStatuses((previous) => [
      ...previous,
      mapStatusRow(
        {
          status_id: tempStatusId,
          sts_name: statusName,
          sts_desc: statusDesc || null,
          is_active: true,
        },
        previous.length,
      ),
    ]);

    setStatusChanges((previous) => ({
      ...previous,
      creates: [
        ...previous.creates,
        {
          tempId: tempStatusId,
          payload: {
            sts_name: statusName,
            sts_desc: statusDesc || null,
            is_active: true,
          },
        },
      ],
    }));

    setDialog(EMPTY_DIALOG);
    setStatusDraft({ name: "", desc: "" });
    toastSuccess("Status staged for Save Batch.", "Batching");
  }, [statusDraft.desc, statusDraft.name]);

  const submitEditStatus = useCallback(() => {
    const row = dialog?.target;

    if (!row?.status_id) {
      toastError("Invalid status.");
      return;
    }

    const statusName = normalizeText(statusDraft.name);
    if (!statusName) {
      toastError("Status name is required.");
      return;
    }

    const statusDesc = normalizeText(statusDraft.desc);
    const statusId = row.status_id;

    setOrderedStatuses((previous) =>
      previous.map((status, index) => {
        if (!isSameId(status?.status_id, statusId)) {
          return status;
        }

        return mapStatusRow(
          {
            ...status,
            sts_name: statusName,
            sts_desc: statusDesc || null,
          },
          index,
        );
      }),
    );

    setStatusChanges((previous) => {
      if (isTempStatusId(statusId)) {
        return {
          ...previous,
          creates: previous.creates.map((entry) => {
            if (!isSameId(entry?.tempId, statusId)) {
              return entry;
            }

            return {
              ...entry,
              payload: {
                ...entry.payload,
                sts_name: statusName,
                sts_desc: statusDesc || null,
              },
            };
          }),
        };
      }

      return {
        ...previous,
        updates: {
          ...previous.updates,
          [String(statusId)]: mergeUpdatePatch(previous.updates?.[String(statusId)], {
            sts_name: statusName,
            sts_desc: statusDesc || null,
          }),
        },
      };
    });

    setDialog(EMPTY_DIALOG);
    setStatusDraft({ name: "", desc: "" });
    toastSuccess("Status edit staged for Save Batch.", "Batching");
  }, [dialog?.target, statusDraft.desc, statusDraft.name]);

  const submitToggleStatus = useCallback(() => {
    const row = dialog?.target;

    if (!row?.status_id) {
      toastError("Invalid status.");
      return;
    }

    const statusId = row.status_id;
    const nextIsActive = Boolean(dialog?.nextIsActive);

    setOrderedStatuses((previous) =>
      previous.map((status, index) => {
        if (!isSameId(status?.status_id, statusId)) {
          return status;
        }

        return mapStatusRow(
          {
            ...status,
            is_active: nextIsActive,
          },
          index,
        );
      }),
    );

    setStatusChanges((previous) => {
      if (isTempStatusId(statusId)) {
        return {
          ...previous,
          creates: previous.creates.map((entry) => {
            if (!isSameId(entry?.tempId, statusId)) {
              return entry;
            }

            return {
              ...entry,
              payload: {
                ...entry.payload,
                is_active: nextIsActive,
              },
            };
          }),
        };
      }

      return {
        ...previous,
        updates: {
          ...previous.updates,
          [String(statusId)]: mergeUpdatePatch(previous.updates?.[String(statusId)], {
            is_active: nextIsActive,
          }),
        },
      };
    });

    setDialog(EMPTY_DIALOG);
    toastSuccess(
      nextIsActive ? "Status enabled — staged for Save Batch." : "Status disabled — staged for Save Batch.",
      "Batching",
    );
  }, [dialog?.nextIsActive, dialog?.target]);

  const submitDeactivateStatus = useCallback(() => {
    const row = dialog?.target;

    if (!row?.status_id) {
      toastError("Invalid status.");
      return;
    }

    const statusId = row.status_id;

    if (isTempStatusId(statusId)) {
      setOrderedStatuses((previous) =>
        previous.filter((status) => !isSameId(status?.status_id, statusId)),
      );

      setStatusChanges((previous) => ({
        ...previous,
        creates: previous.creates.filter((entry) => !isSameId(entry?.tempId, statusId)),
        updates: removeObjectKey(previous.updates, String(statusId)),
      }));

      setDialog(EMPTY_DIALOG);
      toastSuccess("Staged status removed.", "Batching");
      return;
    }

    setStatusChanges((previous) => ({
      ...previous,
      deactivations: appendUniqueId(previous.deactivations, statusId),
    }));

    setDialog(EMPTY_DIALOG);
    toastSuccess("Status deactivation staged for Save Batch.", "Batching");
  }, [dialog?.target]);

  const statusColumns = useMemo(
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

  const statusActions = useMemo(
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

  const dialogTitle = useMemo(() => {
    switch (dialog.kind) {
      case "add-status":
        return "Add Status";
      case "edit-status":
        return "Edit Status";
      case "toggle-status":
        return dialog?.nextIsActive ? "Enable Status" : "Disable Status";
      case "deactivate-status":
        return "Deactivate Status";
      default:
        return "";
    }
  }, [dialog.kind, dialog?.nextIsActive]);

  return (
    <main className="container py-4">
      <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
        <h4 className="mb-0">Status Setup</h4>
        <div className="d-flex align-items-center gap-2 flex-wrap">
          {hasPendingChanges ? (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.35rem",
                fontSize: "0.78rem",
                fontWeight: 600,
                color: "#856404",
                background: "#fff3cd",
                border: "1px solid #ffc107",
                borderRadius: "999px",
                padding: "0.25rem 0.7rem",
                lineHeight: 1.4,
              }}
            >
              <span
                style={{
                  display: "inline-block",
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: "#d39e00",
                  flexShrink: 0,
                }}
              />
              {pendingSummary.total} pending
            </span>
          ) : null}
          <Button
            type="button"
            size="sm"
            variant="secondary"
            loading={isSavingBatch}
            disabled={!hasPendingChanges || isSavingBatch || isMutatingAction}
            onClick={handleSaveBatch}
          >
            Save Batch
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            disabled={!hasPendingChanges || isSavingBatch || isMutatingAction}
            onClick={handleCancelBatch}
          >
            Cancel Batch
          </Button>
          <Button
            type="button"
            size="sm"
            variant="primary"
            disabled={isSavingBatch || isMutatingAction}
            onClick={openAddStatusDialog}
          >
            Add Status
          </Button>
        </div>
      </div>

      <div className="row g-3 align-items-start">
        <div className="col-12">
          <Card title="Statuses" subtitle="System-wide status records.">
            <TableZ
              columns={statusColumns}
              data={decoratedStatuses}
              rowIdKey="status_id"
              actions={statusActions}
              emptyMessage="No statuses found."
            />
          </Card>
        </div>
      </div>

      <Modal
        show={Boolean(dialog.kind)}
        onHide={closeDialog}
        title={dialogTitle}
        footer={
          dialog.kind === "add-status" ? (
            <>
              <Button type="button" variant="ghost" onClick={closeDialog} disabled={isMutatingAction}>
                Cancel
              </Button>
              <Button type="button" variant="primary" onClick={submitAddStatus} loading={isMutatingAction}>
                Add Status
              </Button>
            </>
          ) : dialog.kind === "edit-status" ? (
            <>
              <Button type="button" variant="ghost" onClick={closeDialog} disabled={isMutatingAction}>
                Cancel
              </Button>
              <Button type="button" variant="primary" onClick={submitEditStatus} loading={isMutatingAction}>
                Save
              </Button>
            </>
          ) : dialog.kind === "toggle-status" ? (
            <>
              <Button type="button" variant="ghost" onClick={closeDialog} disabled={isMutatingAction}>
                Cancel
              </Button>
              <Button type="button" variant="secondary" onClick={submitToggleStatus} loading={isMutatingAction}>
                {dialog?.nextIsActive ? "Enable" : "Disable"}
              </Button>
            </>
          ) : dialog.kind === "deactivate-status" ? (
            <>
              <Button type="button" variant="ghost" onClick={closeDialog} disabled={isMutatingAction}>
                Cancel
              </Button>
              <Button type="button" variant="danger" onClick={submitDeactivateStatus} loading={isMutatingAction}>
                Deactivate Status
              </Button>
            </>
          ) : null
        }
      >
        {dialog.kind === "add-status" ? (
          <div className="d-flex flex-column gap-3">
            <div>
              <label className="form-label mb-1">Status Name</label>
              <Input
                value={statusDraft.name}
                onChange={(event) => setStatusDraft((previous) => ({ ...previous, name: event.target.value }))}
                placeholder="e.g. PENDING"
              />
            </div>
            <div>
              <label className="form-label mb-1">Description</label>
              <Input
                value={statusDraft.desc}
                onChange={(event) => setStatusDraft((previous) => ({ ...previous, desc: event.target.value }))}
                placeholder="e.g. Awaiting review"
              />
            </div>
          </div>
        ) : dialog.kind === "edit-status" ? (
          <div className="d-flex flex-column gap-3">
            <div>
              <label className="form-label mb-1">Status Name</label>
              <Input
                value={statusDraft.name}
                onChange={(event) => setStatusDraft((previous) => ({ ...previous, name: event.target.value }))}
                placeholder="e.g. PENDING"
              />
            </div>
            <div>
              <label className="form-label mb-1">Description</label>
              <Input
                value={statusDraft.desc}
                onChange={(event) => setStatusDraft((previous) => ({ ...previous, desc: event.target.value }))}
                placeholder="e.g. Awaiting review"
              />
            </div>
          </div>
        ) : dialog.kind === "toggle-status" ? (
          <p>
            {dialog?.nextIsActive
              ? `Enable status "${dialog?.target?.sts_name || "--"}"?`
              : `Disable status "${dialog?.target?.sts_name || "--"}"?`}
          </p>
        ) : dialog.kind === "deactivate-status" ? (
          <p>
            Deactivate status <strong>&quot;{dialog?.target?.sts_name || "--"}&quot;</strong>?
            This will set <code>is_active</code> to <code>false</code>.
          </p>
        ) : null}
      </Modal>
    </main>
  );
}
