import { Button } from "@/shared/components/ui";

export function ApplicationHeader({
  hasPendingChanges, pendingSummary, isSavingOrder, isMutatingAction,
  isSelectedAppPendingDeactivation, selectedApp,
  handleSaveOrderChanges, handleCancelOrderChanges, openAddApplicationDialog, openAddRoleDialog,
}) {
  return (
    <div className="d-flex flex-wrap justify-content-between align-items-start gap-2 mb-3">
      <div>
        <h1 className="h3 mb-1">Configuration and Settings</h1>
        <p className="text-muted mb-0">Manage setup tables and mapping assignments for User Master.</p>
      </div>
      <div className="d-flex flex-wrap align-items-center justify-content-end gap-2">
        <span className={`small ${hasPendingChanges ? "text-warning-emphasis fw-semibold" : "text-muted"}`}>
          {isMutatingAction || isSavingOrder
            ? "Saving batch..."
            : hasPendingChanges ? `${pendingSummary.total} staged change(s)` : "No changes"}
        </span>
        {hasPendingChanges ? (
          <>
            {pendingSummary.applicationAdded + pendingSummary.roleAdded > 0 ? (
              <span className="psb-batch-chip psb-batch-chip-added">
                +{pendingSummary.applicationAdded + pendingSummary.roleAdded} Added
              </span>
            ) : null}
            {pendingSummary.applicationEdited + pendingSummary.roleEdited > 0 ? (
              <span className="psb-batch-chip psb-batch-chip-edited">
                ~{pendingSummary.applicationEdited + pendingSummary.roleEdited} Edited
              </span>
            ) : null}
            {pendingSummary.applicationDeactivated + pendingSummary.roleDeactivated > 0 ? (
              <span className="psb-batch-chip psb-batch-chip-deleted">
                -{pendingSummary.applicationDeactivated + pendingSummary.roleDeactivated} Deactivated
              </span>
            ) : null}
            {pendingSummary.rowOrderChanged > 0 ? (
              <span className="psb-batch-chip psb-batch-chip-order">Reordered</span>
            ) : null}
          </>
        ) : null}
        <Button type="button" size="sm" variant="secondary" loading={isSavingOrder}
          disabled={!hasPendingChanges || isSavingOrder || isMutatingAction} onClick={handleSaveOrderChanges}>
          Save Batch
        </Button>
        <Button type="button" size="sm" variant="ghost"
          disabled={!hasPendingChanges || isSavingOrder || isMutatingAction} onClick={handleCancelOrderChanges}>
          Cancel Batch
        </Button>
        <Button type="button" size="sm" variant="primary"
          disabled={isSavingOrder || isMutatingAction} onClick={openAddApplicationDialog}>
          Add Application
        </Button>
        <Button type="button" size="sm" variant="primary"
          disabled={isSavingOrder || isMutatingAction || !selectedApp?.app_id || isSelectedAppPendingDeactivation}
          onClick={openAddRoleDialog}>
          Add Role
        </Button>
      </div>
    </div>
  );
}
