"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toastError, toastInfo, toastSuccess } from "@/shared/components/ui";
import {
  EMPTY_LOOKUPS, normalizeText, rowIdOf, isTemporaryId, findLabel,
  createEmptyPendingBatch, pendingBatchCount, removeObjectKey,
  executeBatchSave, executeDeactivateUser, fetchLookups, fetchUsers,
} from "../utils/userMasterHelpers";
import { useUserPanel } from "./useUserPanel";

export function useUserMasterSetup({ users = [], totalUsers = 0 }) {
  const [tableRows, setTableRows] = useState(Array.isArray(users) ? users : []);
  const [lookups, setLookups] = useState(EMPTY_LOOKUPS);
  const [pendingBatch, setPendingBatch] = useState(createEmptyPendingBatch);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingLookups, setIsLoadingLookups] = useState(false);
  const [isSavingBatch, setIsSavingBatch] = useState(false);
  const [isDeactivatingUser, setIsDeactivatingUser] = useState(false);
  const [showCancelBatchModal, setShowCancelBatchModal] = useState(false);
  const [showDeactivateUserModal, setShowDeactivateUserModal] = useState(false);

  const pendingCount = useMemo(() => pendingBatchCount(pendingBatch), [pendingBatch]);
  const hasPendingChanges = pendingCount > 0;
  const totalRowCount = useMemo(() => tableRows.length || (Number.isFinite(Number(totalUsers)) ? Number(totalUsers) : 0), [tableRows.length, totalUsers]);

  const panel = useUserPanel({ lookups, tableRows, selectedUserRow: null, pendingBatch, setTableRows, setPendingBatch });

  const selectedUserRow = useMemo(
    () => tableRows.find((r) => rowIdOf(r) === String(panel.panelUserId ?? "")) || null,
    [panel.panelUserId, tableRows]);

  const selectedStatusLabel = useMemo(() => {
    const label = findLabel(lookups?.statuses, "status_id", panel.form?.status_id);
    if (label && label !== "--") return label.toUpperCase();
    return panel.form?.is_active ? "ACTIVE" : "INACTIVE";
  }, [panel.form?.is_active, panel.form?.status_id, lookups?.statuses]);

  const departmentsForCompany = useMemo(() => {
    if (!normalizeText(panel.form?.comp_id)) return lookups?.departments || [];
    return (lookups?.departments || []).filter((r) => String(r?.comp_id) === String(panel.form?.comp_id));
  }, [panel.form?.comp_id, lookups?.departments]);

  const roleOptionsForAccessEditor = useMemo(() => {
    if (!normalizeText(panel.accessEditor?.app_id)) return [];
    return (lookups?.roles || []).filter((r) => String(r?.app_id) === String(panel.accessEditor.app_id));
  }, [panel.accessEditor?.app_id, lookups?.roles]);

  const loadLookups = useCallback(async () => {
    setIsLoadingLookups(true);
    try { setLookups(await fetchLookups()); }
    catch (error) { toastError(error?.message || "Failed to load lookups.", "User Master Setup"); }
    finally { setIsLoadingLookups(false); }
  }, []);

  const refreshUsers = useCallback(async ({ silent = false } = {}) => {
    setIsRefreshing(true);
    try {
      const next = await fetchUsers();
      setTableRows(next.map((r) => ({ ...r, __batchState: "none" })));
      if (!silent) toastSuccess("User list refreshed.", "User Master Setup");
    } catch (error) { toastError(error?.message || "Failed to load users.", "User Master Setup"); }
    finally { setIsRefreshing(false); }
  }, []);

  useEffect(() => { loadLookups(); }, [loadLookups]);

  const saveBatch = useCallback(async () => {
    if (!hasPendingChanges) { toastInfo("There are no staged changes.", "User Master Setup"); return; }
    if (panel.panelDirty) { toastError("Stage or discard panel changes before saving the batch.", "User Master Setup"); return; }
    setIsSavingBatch(true);
    try {
      await executeBatchSave(pendingBatch, refreshUsers);
      setPendingBatch(createEmptyPendingBatch());
      await refreshUsers({ silent: true });
      if (isTemporaryId(panel.panelUserId)) panel.resetPanelState();
      toastSuccess("Batch saved successfully.", "User Master Setup");
    } catch (error) { toastError(error?.message || "Failed to save staged batch.", "User Master Setup"); }
    finally { setIsSavingBatch(false); }
  }, [hasPendingChanges, panel.panelDirty, panel.panelUserId, panel.resetPanelState, pendingBatch, refreshUsers]);

  const cancelBatch = useCallback(() => {
    if (!hasPendingChanges) { toastInfo("There are no staged changes to cancel.", "User Master Setup"); return; }
    setShowCancelBatchModal(true);
  }, [hasPendingChanges]);

  const confirmCancelBatch = useCallback(async () => {
    setShowCancelBatchModal(false);
    setPendingBatch(createEmptyPendingBatch());
    await refreshUsers({ silent: true });
    if (isTemporaryId(panel.panelUserId)) panel.resetPanelState();
    toastSuccess("Staged batch changes canceled.", "User Master Setup");
  }, [panel.panelUserId, panel.resetPanelState, refreshUsers]);

  const deactivateCurrentUser = useCallback(() => {
    const userId = normalizeText(panel.panelUserId);
    if (!userId || isTemporaryId(userId)) { toastError("Invalid user selected for deactivation.", "User Master Setup"); return; }
    setShowDeactivateUserModal(true);
  }, [panel.panelUserId]);

  const confirmDeactivateCurrentUser = useCallback(async () => {
    setShowDeactivateUserModal(false);
    const userId = normalizeText(panel.panelUserId);
    if (!userId || isTemporaryId(userId)) { toastError("Invalid user selected for deactivation.", "User Master Setup"); return; }
    setIsDeactivatingUser(true);
    try {
      const revokedCount = await executeDeactivateUser(userId);
      setPendingBatch((p) => ({
        ...p, updates: removeObjectKey(p?.updates, userId),
        accessUpserts: removeObjectKey(p?.accessUpserts, userId),
        accessDeletes: removeObjectKey(p?.accessDeletes, userId),
      }));
      await refreshUsers({ silent: true }); panel.resetPanelState();
      toastSuccess(`User deactivated successfully. Revoked ${revokedCount} access mapping(s).`, "User Master Setup");
    } catch (error) { toastError(error?.message || "Failed to deactivate user.", "User Master Setup"); }
    finally { setIsDeactivatingUser(false); }
  }, [panel.panelUserId, panel.resetPanelState, refreshUsers]);

  return {
    tableRows, lookups, isRefreshing, isLoadingLookups, isSavingBatch, isDeactivatingUser,
    pendingCount, hasPendingChanges, totalRowCount,
    selectedUserRow, selectedStatusLabel, departmentsForCompany, roleOptionsForAccessEditor,
    showCancelBatchModal, setShowCancelBatchModal, showDeactivateUserModal, setShowDeactivateUserModal,
    saveBatch, cancelBatch, confirmCancelBatch, refreshUsers,
    deactivateCurrentUser, confirmDeactivateCurrentUser,
    ...panel,
  };
}
