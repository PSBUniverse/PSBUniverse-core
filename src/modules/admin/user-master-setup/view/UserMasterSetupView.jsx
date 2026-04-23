"use client";

import { useUserMasterSetup } from "../hooks/useUserMasterSetup";
import { UserMasterHeader } from "../components/UserMasterHeader";
import { UserTable } from "../components/UserTable";
import { UserPanel } from "../components/UserPanel";
import { UserModals } from "../components/UserModals";

export default function UserMasterSetupView({ users, totalUsers }) {
  const h = useUserMasterSetup({ users, totalUsers });

  return (
    <main className="container-fluid py-3 umsp-shell">
      <section className={`umsp-users-pane ${h.panelOpen ? "is-panel-open" : ""}`}>
        <UserMasterHeader
          totalRowCount={h.totalRowCount} hasPendingChanges={h.hasPendingChanges} pendingCount={h.pendingCount}
          isSavingBatch={h.isSavingBatch} isRefreshing={h.isRefreshing}
          openAddUserPanel={h.openAddUserPanel} saveBatch={h.saveBatch}
          cancelBatch={h.cancelBatch} refreshUsers={h.refreshUsers}
        />
        <UserTable tableRows={h.tableRows} panelUserId={h.panelUserId} panelOpen={h.panelOpen}
          onRowClick={(row) => h.openExistingUserPanel(row, "view")} />
      </section>

      <UserPanel
        panelOpen={h.panelOpen} panelMode={h.panelMode} isPanelLoading={h.isPanelLoading}
        panelDirty={h.panelDirty} panelEditable={h.panelEditable}
        canDeactivateCurrentUser={h.canDeactivateCurrentUser} isStaging={h.isStaging}
        isLoadingLookups={h.isLoadingLookups} isSavingBatch={h.isSavingBatch}
        activeTab={h.activeTab} form={h.form} setForm={h.setForm}
        accessRows={h.accessRows} accessEditor={h.accessEditor} setAccessEditor={h.setAccessEditor}
        enableNewPassword={h.enableNewPassword} setEnableNewPassword={h.setEnableNewPassword}
        newPasswordValue={h.newPasswordValue} setNewPasswordValue={h.setNewPasswordValue}
        confirmNewPassword={h.confirmNewPassword} setConfirmNewPassword={h.setConfirmNewPassword}
        selectedStatusLabel={h.selectedStatusLabel} departmentsForCompany={h.departmentsForCompany}
        roleOptionsForAccessEditor={h.roleOptionsForAccessEditor} lookups={h.lookups}
        setPendingAccessDeactivateRow={h.setPendingAccessDeactivateRow}
        setActiveTab={h.setActiveTab} setPanelMode={h.setPanelMode} closePanel={h.closePanel}
        handleStatusChange={h.handleStatusChange} handleCompanyChange={h.handleCompanyChange}
        startAccessCreate={h.startAccessCreate} cancelAccessEditor={h.cancelAccessEditor}
        submitAccessEditor={h.submitAccessEditor}
        stagePanelChanges={h.stagePanelChanges} restorePanelToBaseline={h.restorePanelToBaseline}
        deactivateCurrentUser={h.deactivateCurrentUser}
      />

      <UserModals
        showDiscardDraftModal={h.showDiscardDraftModal} showCancelBatchModal={h.showCancelBatchModal}
        showDeactivateUserModal={h.showDeactivateUserModal}
        pendingAccessDeactivateRow={h.pendingAccessDeactivateRow}
        isDeactivatingUser={h.isDeactivatingUser} isSavingBatch={h.isSavingBatch} isRefreshing={h.isRefreshing}
        closeDiscardDraftModal={h.closeDiscardDraftModal} confirmDiscardDraft={h.confirmDiscardDraft}
        closeAccessDeactivateModal={h.closeAccessDeactivateModal} confirmRemoveAccessRow={h.confirmRemoveAccessRow}
        setShowCancelBatchModal={h.setShowCancelBatchModal} confirmCancelBatch={h.confirmCancelBatch}
        setShowDeactivateUserModal={h.setShowDeactivateUserModal} confirmDeactivateCurrentUser={h.confirmDeactivateCurrentUser}
      />
    </main>
  );
}
