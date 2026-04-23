import { Button, Modal } from "@/shared/components/ui";

export function UserModals({
  showDiscardDraftModal, showCancelBatchModal, showDeactivateUserModal,
  pendingAccessDeactivateRow,
  isDeactivatingUser, isSavingBatch, isRefreshing,
  closeDiscardDraftModal, confirmDiscardDraft,
  closeAccessDeactivateModal, confirmRemoveAccessRow,
  setShowCancelBatchModal, confirmCancelBatch,
  setShowDeactivateUserModal, confirmDeactivateCurrentUser,
}) {
  return (
    <>
      <Modal show={showDiscardDraftModal} onHide={closeDiscardDraftModal} title="Discard Unsaved Changes"
        footer={<><Button type="button" variant="ghost" onClick={closeDiscardDraftModal}>Keep Editing</Button>
          <Button type="button" variant="danger" onClick={confirmDiscardDraft}>Discard Changes</Button></>}>
        <p className="mb-0">You have unsaved panel changes. Discard them?</p>
      </Modal>

      <Modal show={Boolean(pendingAccessDeactivateRow)} onHide={closeAccessDeactivateModal} title="Deactivate Access"
        footer={<><Button type="button" variant="ghost" onClick={closeAccessDeactivateModal}>Keep Access</Button>
          <Button type="button" variant="danger" onClick={confirmRemoveAccessRow}>Deactivate Access</Button></>}>
        <p className="mb-0">Deactivate access {pendingAccessDeactivateRow?.application_name || "Application"}{" / "}{pendingAccessDeactivateRow?.role_name || "Role"}?</p>
      </Modal>

      <Modal show={showDeactivateUserModal} onHide={() => setShowDeactivateUserModal(false)} title="Deactivate User"
        footer={<><Button type="button" variant="ghost" onClick={() => setShowDeactivateUserModal(false)} disabled={isDeactivatingUser || isSavingBatch || isRefreshing}>Keep User Active</Button>
          <Button type="button" variant="danger" onClick={confirmDeactivateCurrentUser} disabled={isDeactivatingUser || isSavingBatch || isRefreshing}>{isDeactivatingUser ? "Deactivating..." : "Deactivate User"}</Button></>}>
        <p className="mb-0">Deactivate this user? This is a soft delete and will revoke all system access.</p>
      </Modal>

      <Modal show={showCancelBatchModal} onHide={() => setShowCancelBatchModal(false)} title="Cancel Batch"
        footer={<><Button type="button" variant="ghost" onClick={() => setShowCancelBatchModal(false)} disabled={isSavingBatch || isRefreshing}>Keep Staged Changes</Button>
          <Button type="button" variant="danger" onClick={confirmCancelBatch} disabled={isSavingBatch || isRefreshing}>Cancel Batch</Button></>}>
        <p className="mb-0">Cancel all staged batch changes?</p>
      </Modal>
    </>
  );
}
