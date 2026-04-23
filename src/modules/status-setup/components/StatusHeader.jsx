import { Button } from "@/shared/components/ui";

export function StatusHeader({
  hasPendingChanges,
  pendingSummary,
  isSavingBatch,
  isMutatingAction,
  handleSaveBatch,
  handleCancelBatch,
  openAddStatusDialog,
}) {
  return (
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
  );
}
