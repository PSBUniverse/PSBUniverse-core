import { Button } from "@/shared/components/ui";

export function CompanyDeptHeader({
  hasPendingChanges, pendingSummary, isSaving, isMutatingAction,
  isSelectedCompanyPendingDeactivation, selectedCompany,
  handleSaveBatch, handleCancelBatch,
  openAddCompanyDialog, openAddDepartmentDialog,
}) {
  return (
    <div className="d-flex flex-wrap justify-content-between align-items-start gap-2 mb-3">
      <div>
        <h1 className="h3 mb-1">Configuration and Settings</h1>
        <p className="text-muted mb-0">Manage setup tables and mapping assignments for Company-Department.</p>
      </div>
      <div className="d-flex flex-wrap align-items-center justify-content-end gap-2">
        <span className={`small ${hasPendingChanges ? "text-warning-emphasis fw-semibold" : "text-muted"}`}>
          {isMutatingAction || isSaving
            ? "Saving batch..."
            : hasPendingChanges ? `${pendingSummary.total} staged change(s)` : "No changes"}
        </span>
        {hasPendingChanges ? (
          <>
            {pendingSummary.companyAdded + pendingSummary.departmentAdded > 0 ? (
              <span className="psb-batch-chip psb-batch-chip-added">+{pendingSummary.companyAdded + pendingSummary.departmentAdded} Added</span>
            ) : null}
            {pendingSummary.companyEdited + pendingSummary.departmentEdited > 0 ? (
              <span className="psb-batch-chip psb-batch-chip-edited">~{pendingSummary.companyEdited + pendingSummary.departmentEdited} Edited</span>
            ) : null}
            {pendingSummary.companyDeactivated + pendingSummary.departmentDeactivated > 0 ? (
              <span className="psb-batch-chip psb-batch-chip-deleted">-{pendingSummary.companyDeactivated + pendingSummary.departmentDeactivated} Deactivated</span>
            ) : null}
          </>
        ) : null}
        <Button type="button" size="sm" variant="secondary" loading={isSaving}
          disabled={!hasPendingChanges || isSaving || isMutatingAction} onClick={handleSaveBatch}>Save Batch</Button>
        <Button type="button" size="sm" variant="ghost"
          disabled={!hasPendingChanges || isSaving || isMutatingAction} onClick={handleCancelBatch}>Cancel Batch</Button>
        <Button type="button" size="sm" variant="primary"
          disabled={isSaving || isMutatingAction} onClick={openAddCompanyDialog}>Add Company</Button>
        <Button type="button" size="sm" variant="primary"
          disabled={isSaving || isMutatingAction || !selectedCompany?.comp_id || isSelectedCompanyPendingDeactivation}
          onClick={openAddDepartmentDialog}>Add Department</Button>
      </div>
    </div>
  );
}
