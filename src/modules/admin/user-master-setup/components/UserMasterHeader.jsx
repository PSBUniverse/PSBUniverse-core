import { Button } from "@/shared/components/ui";

export function UserMasterHeader({
  totalRowCount, hasPendingChanges, pendingCount,
  isSavingBatch, isRefreshing,
  openAddUserPanel, saveBatch, cancelBatch, refreshUsers,
}) {
  return (
    <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
      <div>
        <h1 className="h4 mb-1">User Master Setup</h1>
        <p className="text-muted mb-0">{totalRowCount} user row(s)</p>
      </div>
      <div className="d-flex flex-wrap align-items-center gap-2">
        <span className={`small ${hasPendingChanges ? "text-warning" : "text-muted"}`}>
          {hasPendingChanges ? `${pendingCount} staged change(s)` : "No staged changes"}
        </span>
        <Button type="button" variant="secondary" size="sm" onClick={openAddUserPanel} disabled={isSavingBatch || isRefreshing}>
          Add User
        </Button>
        <Button type="button" variant="primary" size="sm" onClick={saveBatch} disabled={!hasPendingChanges || isSavingBatch || isRefreshing}>
          {isSavingBatch ? "Saving..." : "Save Batch"}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={cancelBatch} disabled={!hasPendingChanges || isSavingBatch || isRefreshing}>
          Cancel Batch
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => refreshUsers()} disabled={isSavingBatch || isRefreshing}>
          {isRefreshing ? "Refreshing..." : "Refresh"}
        </Button>
      </div>
    </div>
  );
}
