import { useMemo } from "react";
import { Button, Input, Modal } from "@/shared/components/ui";

export function CompanyDeptDialog({
  dialog, companyDraft, departmentDraft, isMutatingAction,
  setCompanyDraft, setDepartmentDraft, closeDialog,
  submitAddCompany, submitEditCompany, submitToggleCompany, submitDeactivateCompany,
  submitAddDepartment, submitEditDepartment, submitToggleDepartment, submitDeactivateDepartment,
}) {
  const kind = dialog?.kind;

  const dialogTitle = useMemo(() => {
    const titles = {
      "add-company": "Add Company", "edit-company": "Edit Company",
      "toggle-company": `${dialog?.nextIsActive ? "Enable" : "Disable"} Company`,
      "deactivate-company": "Deactivate Company",
      "add-department": "Add Department", "edit-department": "Edit Department",
      "toggle-department": `${dialog?.nextIsActive ? "Enable" : "Disable"} Department`,
      "deactivate-department": "Deactivate Department",
    };
    return titles[kind] || "";
  }, [kind, dialog?.nextIsActive]);

  if (!kind) return null;
  const isBusy = isMutatingAction;

  const submitMap = {
    "add-company": submitAddCompany, "edit-company": submitEditCompany,
    "toggle-company": submitToggleCompany, "deactivate-company": submitDeactivateCompany,
    "add-department": submitAddDepartment, "edit-department": submitEditDepartment,
    "toggle-department": submitToggleDepartment, "deactivate-department": submitDeactivateDepartment,
  };

  const fc = {
    "add-company": { label: "Add Company", variant: "primary" },
    "edit-company": { label: "Save", variant: "primary" },
    "add-department": { label: "Add Department", variant: "primary" },
    "edit-department": { label: "Save", variant: "primary" },
    "toggle-company": { label: dialog?.nextIsActive ? "Enable" : "Disable", variant: "secondary" },
    "toggle-department": { label: dialog?.nextIsActive ? "Enable" : "Disable", variant: "secondary" },
    "deactivate-company": { label: "Deactivate Company", variant: "danger" },
    "deactivate-department": { label: "Deactivate Department", variant: "danger" },
  }[kind] || { label: "OK", variant: "primary" };

  const footer = (
    <>
      <Button type="button" variant="ghost" onClick={closeDialog} disabled={isBusy}>Cancel</Button>
      <Button type="button" variant={fc.variant} onClick={submitMap[kind]} loading={isBusy}>{fc.label}</Button>
    </>
  );

  const isCompanyForm = kind === "add-company" || kind === "edit-company";
  const isDeptForm = kind === "add-department" || kind === "edit-department";

  return (
    <Modal show onHide={closeDialog} title={dialogTitle} footer={footer}>
      {isCompanyForm ? (
        <div className="d-flex flex-column gap-3">
          <div>
            <label className="form-label mb-1">Company Name</label>
            <Input value={companyDraft.name} onChange={(e) => setCompanyDraft((p) => ({ ...p, name: e.target.value }))} placeholder="Enter company name" autoFocus />
          </div>
          <div>
            <label className="form-label mb-1">Short Name</label>
            <Input value={companyDraft.shortName} onChange={(e) => setCompanyDraft((p) => ({ ...p, shortName: e.target.value }))} placeholder="Enter short name" />
          </div>
          <div>
            <label className="form-label mb-1">Email</label>
            <Input value={companyDraft.email} onChange={(e) => setCompanyDraft((p) => ({ ...p, email: e.target.value }))} placeholder="Enter company email" />
          </div>
          <div>
            <label className="form-label mb-1">Phone</label>
            <Input value={companyDraft.phone} onChange={(e) => setCompanyDraft((p) => ({ ...p, phone: e.target.value }))} placeholder="Enter company phone" />
          </div>
        </div>
      ) : null}

      {isDeptForm ? (
        <div className="d-flex flex-column gap-3">
          {kind === "add-department" ? (
            <div className="small text-muted">Creating department for <strong>{dialog?.target?.comp_name || "selected company"}</strong></div>
          ) : null}
          <div>
            <label className="form-label mb-1">Department Name</label>
            <Input value={departmentDraft.name} onChange={(e) => setDepartmentDraft((p) => ({ ...p, name: e.target.value }))} placeholder="Enter department name" autoFocus />
          </div>
          <div>
            <label className="form-label mb-1">Short Name</label>
            <Input value={departmentDraft.shortName} onChange={(e) => setDepartmentDraft((p) => ({ ...p, shortName: e.target.value }))} placeholder="Enter short name" />
          </div>
        </div>
      ) : null}

      {kind === "toggle-company" ? (
        <p className="mb-0">{dialog?.nextIsActive ? "Enable" : "Disable"} company <strong>{dialog?.target?.comp_name || ""}</strong>?</p>
      ) : null}

      {kind === "toggle-department" ? (
        <p className="mb-0">{dialog?.nextIsActive ? "Enable" : "Disable"} department <strong>{dialog?.target?.dept_name || ""}</strong>?</p>
      ) : null}

      {kind === "deactivate-company" ? (
        <p className="mb-0 text-danger">Deactivate company <strong>{dialog?.target?.comp_name || ""}</strong> and all linked departments?</p>
      ) : null}

      {kind === "deactivate-department" ? (
        <p className="mb-0 text-danger">Deactivate department <strong>{dialog?.target?.dept_name || ""}</strong>?</p>
      ) : null}
    </Modal>
  );
}
