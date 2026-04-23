import { Button } from "@/shared/components/ui";

export function CardModuleHeader({
  safeApplications, selectedApp, hasPendingChanges, pendingSummary,
  isSaving, isMutatingAction, isSelectedGroupPendingDeactivation, selectedGroup,
  handleSaveBatch, handleCancelBatch, handleApplicationChange,
  openAddGroupDialog, openAddCardDialog,
}) {
  return (
    <>
      <div className="d-flex flex-wrap justify-content-between align-items-start gap-2 mb-3">
        <div>
          <h1 className="h3 mb-1">Card Module Setup</h1>
          <p className="text-muted mb-0">Manage card groups and cards for each application.</p>
        </div>
        <div className="d-flex flex-wrap align-items-center justify-content-end gap-2">
          <span className={`small ${hasPendingChanges ? "text-warning-emphasis fw-semibold" : "text-muted"}`}>
            {isMutatingAction || isSaving
              ? "Saving batch..."
              : hasPendingChanges ? `${pendingSummary.total} staged change(s)` : "No changes"}
          </span>
          {hasPendingChanges ? (
            <>
              {pendingSummary.groupAdded + pendingSummary.cardAdded > 0 ? (
                <span className="psb-batch-chip psb-batch-chip-added">+{pendingSummary.groupAdded + pendingSummary.cardAdded} Added</span>
              ) : null}
              {pendingSummary.groupEdited + pendingSummary.cardEdited > 0 ? (
                <span className="psb-batch-chip psb-batch-chip-edited">~{pendingSummary.groupEdited + pendingSummary.cardEdited} Edited</span>
              ) : null}
              {pendingSummary.groupDeactivated + pendingSummary.cardDeactivated > 0 ? (
                <span className="psb-batch-chip psb-batch-chip-deleted">-{pendingSummary.groupDeactivated + pendingSummary.cardDeactivated} Deactivated</span>
              ) : null}
              {pendingSummary.rowOrderChanged > 0 ? (
                <span className="psb-batch-chip psb-batch-chip-order">Reordered</span>
              ) : null}
            </>
          ) : null}
          <Button type="button" size="sm" variant="secondary" loading={isSaving}
            disabled={!hasPendingChanges || isSaving || isMutatingAction} onClick={handleSaveBatch}>Save Batch</Button>
          <Button type="button" size="sm" variant="ghost"
            disabled={!hasPendingChanges || isSaving || isMutatingAction} onClick={handleCancelBatch}>Cancel Batch</Button>
          <Button type="button" size="sm" variant="primary"
            disabled={isSaving || isMutatingAction || !selectedApp?.app_id} onClick={openAddGroupDialog}>Add Group</Button>
          <Button type="button" size="sm" variant="primary"
            disabled={isSaving || isMutatingAction || !selectedGroup?.group_id || isSelectedGroupPendingDeactivation}
            onClick={openAddCardDialog}>Add Card</Button>
        </div>
      </div>
      <div className="mb-3">
        <label className="form-label mb-1 fw-semibold small">Application</label>
        <select className="form-select form-select-sm" style={{ maxWidth: 340 }}
          value={String(selectedApp?.app_id ?? "")} onChange={handleApplicationChange}
          disabled={isSaving || isMutatingAction}>
          {safeApplications.length === 0 ? <option value="">No applications available</option> : null}
          {safeApplications.map((app) => (
            <option key={app.app_id} value={String(app.app_id)}>
              {app.app_name || app.name || `App ${app.app_id}`}
            </option>
          ))}
        </select>
      </div>
    </>
  );
}
