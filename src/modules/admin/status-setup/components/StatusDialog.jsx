import { useMemo } from "react";
import { Button, Input, Modal } from "@/shared/components/ui";

export function StatusDialog({
  dialog,
  statusDraft,
  isMutatingAction,
  isSavingBatch,
  setStatusDraft,
  closeDialog,
  submitAddStatus,
  submitEditStatus,
  submitToggleStatus,
  submitDeactivateStatus,
}) {
  const dialogTitle = useMemo(() => {
    const kind = dialog?.kind;
    if (kind === "add-status") return "Add Status";
    if (kind === "edit-status") return "Edit Status";
    if (kind === "toggle-status") {
      return dialog?.nextIsActive ? "Enable Status" : "Disable Status";
    }
    if (kind === "deactivate-status") return "Deactivate Status";
    return "Status";
  }, [dialog?.kind, dialog?.nextIsActive]);

  if (!dialog?.kind) return null;

  const isBusy = isMutatingAction || isSavingBatch;

  return (
    <Modal show onHide={closeDialog} title={dialogTitle}>
      {dialog.kind === "add-status" || dialog.kind === "edit-status" ? (
        <div>
          <div className="mb-3">
            <Input
              label="Status Name"
              value={statusDraft.name}
              onChange={(event) =>
                setStatusDraft((previous) => ({ ...previous, name: event.target.value }))
              }
              placeholder="Enter status name"
              disabled={isBusy}
            />
          </div>
          <div className="mb-3">
            <Input
              label="Description"
              value={statusDraft.desc}
              onChange={(event) =>
                setStatusDraft((previous) => ({ ...previous, desc: event.target.value }))
              }
              placeholder="Enter description (optional)"
              disabled={isBusy}
            />
          </div>
          <div className="d-flex justify-content-end gap-2">
            <Button variant="ghost" size="sm" onClick={closeDialog} disabled={isBusy}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              loading={isBusy}
              disabled={isBusy}
              onClick={dialog.kind === "add-status" ? submitAddStatus : submitEditStatus}
            >
              {dialog.kind === "add-status" ? "Add" : "Save"}
            </Button>
          </div>
        </div>
      ) : null}

      {dialog.kind === "toggle-status" ? (
        <div>
          <p className="mb-3">
            {dialog.nextIsActive
              ? `Enable status "${dialog.target?.sts_name || "--"}"?`
              : `Disable status "${dialog.target?.sts_name || "--"}"?`}
          </p>
          <div className="d-flex justify-content-end gap-2">
            <Button variant="ghost" size="sm" onClick={closeDialog} disabled={isBusy}>
              Cancel
            </Button>
            <Button
              variant={dialog.nextIsActive ? "primary" : "secondary"}
              size="sm"
              loading={isBusy}
              disabled={isBusy}
              onClick={submitToggleStatus}
            >
              {dialog.nextIsActive ? "Enable" : "Disable"}
            </Button>
          </div>
        </div>
      ) : null}

      {dialog.kind === "deactivate-status" ? (
        <div>
          <p className="mb-3">
            Deactivate status <strong>&quot;{dialog.target?.sts_name || "--"}&quot;</strong>? This
            action will be staged for Save Batch.
          </p>
          <div className="d-flex justify-content-end gap-2">
            <Button variant="ghost" size="sm" onClick={closeDialog} disabled={isBusy}>
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              loading={isBusy}
              disabled={isBusy}
              onClick={submitDeactivateStatus}
            >
              Deactivate
            </Button>
          </div>
        </div>
      ) : null}
    </Modal>
  );
}
