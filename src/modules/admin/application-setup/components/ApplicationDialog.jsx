import { useMemo } from "react";
import { Button, Input, Modal } from "@/shared/components/ui";

export function ApplicationDialog({
  dialog, applicationDraft, roleDraft, isMutatingAction,
  setApplicationDraft, setRoleDraft, closeDialog,
  submitAddApplication, submitEditApplication, submitToggleApplication, submitDeactivateApplication,
  submitEditRole, submitToggleRole, submitDeactivateRole, submitAddRole,
}) {
  const kind = dialog?.kind;

  const dialogTitle = useMemo(() => {
    const titles = {
      "add-application": "Add Application",
      "edit-application": "Edit Application",
      "toggle-application": `${dialog?.nextIsActive ? "Enable" : "Disable"} Application`,
      "deactivate-application": "Deactivate Application",
      "edit-role": "Edit Role",
      "toggle-role": `${dialog?.nextIsActive ? "Enable" : "Disable"} Role`,
      "deactivate-role": "Deactivate Role",
      "add-role": "Add Role",
    };
    return titles[kind] || "";
  }, [kind, dialog?.nextIsActive]);

  if (!kind) return null;

  const isBusy = isMutatingAction;

  const submitMap = {
    "add-application": submitAddApplication,
    "edit-application": submitEditApplication,
    "toggle-application": submitToggleApplication,
    "deactivate-application": submitDeactivateApplication,
    "edit-role": submitEditRole,
    "toggle-role": submitToggleRole,
    "deactivate-role": submitDeactivateRole,
    "add-role": submitAddRole,
  };

  const footerConfig = {
    "add-application": { label: "Add Application", variant: "primary" },
    "edit-application": { label: "Save", variant: "primary" },
    "edit-role": { label: "Save", variant: "primary" },
    "add-role": { label: "Add Role", variant: "primary" },
    "toggle-application": { label: dialog?.nextIsActive ? "Enable" : "Disable", variant: "secondary" },
    "toggle-role": { label: dialog?.nextIsActive ? "Enable" : "Disable", variant: "secondary" },
    "deactivate-application": { label: "Deactivate Application", variant: "danger" },
    "deactivate-role": { label: "Deactivate Role", variant: "danger" },
  };

  const fc = footerConfig[kind] || { label: "OK", variant: "primary" };

  const footer = (
    <>
      <Button type="button" variant="ghost" onClick={closeDialog} disabled={isBusy}>Cancel</Button>
      <Button type="button" variant={fc.variant} onClick={submitMap[kind]} loading={isBusy}>{fc.label}</Button>
    </>
  );

  const isAppForm = kind === "add-application" || kind === "edit-application";
  const isRoleForm = kind === "edit-role" || kind === "add-role";

  return (
    <Modal show onHide={closeDialog} title={dialogTitle} footer={footer}>
      {isAppForm ? (
        <div className="d-flex flex-column gap-3">
          <div>
            <label className="form-label mb-1">Application Name</label>
            <Input value={applicationDraft.name}
              onChange={(e) => setApplicationDraft((p) => ({ ...p, name: e.target.value }))}
              placeholder="Enter application name" autoFocus />
          </div>
          <div>
            <label className="form-label mb-1">Description</label>
            <Input as="textarea" rows={3} value={applicationDraft.desc}
              onChange={(e) => setApplicationDraft((p) => ({ ...p, desc: e.target.value }))}
              placeholder="Enter application description" />
          </div>
        </div>
      ) : null}

      {isRoleForm ? (
        <div className="d-flex flex-column gap-3">
          {kind === "add-role" ? (
            <div className="small text-muted">
              Creating role for <strong>{dialog?.target?.app_name || "selected application"}</strong>
            </div>
          ) : null}
          <div>
            <label className="form-label mb-1">Role Name</label>
            <Input value={roleDraft.name}
              onChange={(e) => setRoleDraft((p) => ({ ...p, name: e.target.value }))}
              placeholder="Enter role name" autoFocus />
          </div>
          <div>
            <label className="form-label mb-1">Description</label>
            <Input as="textarea" rows={3} value={roleDraft.desc}
              onChange={(e) => setRoleDraft((p) => ({ ...p, desc: e.target.value }))}
              placeholder="Enter role description" />
          </div>
        </div>
      ) : null}

      {kind === "toggle-application" ? (
        <p className="mb-0">
          {dialog?.nextIsActive ? "Enable" : "Disable"} application <strong>{dialog?.target?.app_name || ""}</strong>?
        </p>
      ) : null}

      {kind === "toggle-role" ? (
        <p className="mb-0">
          {dialog?.nextIsActive ? "Enable" : "Disable"} role <strong>{dialog?.target?.role_name || ""}</strong>?
        </p>
      ) : null}

      {kind === "deactivate-application" ? (
        <p className="mb-0 text-danger">
          Deactivate application <strong>{dialog?.target?.app_name || ""}</strong> and all associated roles?
        </p>
      ) : null}

      {kind === "deactivate-role" ? (
        <p className="mb-0 text-danger">
          Deactivate role <strong>{dialog?.target?.role_name || ""}</strong>?
        </p>
      ) : null}
    </Modal>
  );
}
