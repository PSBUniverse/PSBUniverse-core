"use client";

import { useCallback, useState } from "react";
import { toastError, toastInfo, toastSuccess, toastWarning } from "@/shared/components/ui";
import {
  normalizeText, normalizeOptionalText, rowIdOf, isTemporaryId, inferActiveFromStatus,
  createEmptyForm, createFormFromUser, cloneForm, cloneAccessRows, makeLocalAccessRow,
  diffAccessRows, buildUserPayload, buildPanelSnapshot, summarizeUserRow, replaceObjectKeyWithArray,
} from "../utils/userMasterHelpers";

const EMPTY_ACCESS_EDITOR = { mode: null, access_key: null, original_app_id: "", original_role_id: "", app_id: "", role_id: "" };

export function useUserPanel({
  lookups, tableRows, selectedUserRow, pendingBatch,
  setTableRows, setPendingBatch,
}) {
  const [panelOpen, setPanelOpen] = useState(false);
  const [panelMode, setPanelMode] = useState("view");
  const [panelUserId, setPanelUserId] = useState(null);
  const [activeTab, setActiveTab] = useState("profile");
  const [isPanelLoading, setIsPanelLoading] = useState(false);

  const [form, setForm] = useState(createEmptyForm());
  const [baselineForm, setBaselineForm] = useState(createEmptyForm());
  const [accessRows, setAccessRows] = useState([]);
  const [baselineAccessRows, setBaselineAccessRows] = useState([]);

  const [enableNewPassword, setEnableNewPassword] = useState(false);
  const [newPasswordValue, setNewPasswordValue] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [baselineSnapshot, setBaselineSnapshot] = useState(buildPanelSnapshot(createEmptyForm(), [], false, "", ""));

  const [showDiscardDraftModal, setShowDiscardDraftModal] = useState(false);
  const [pendingDiscardDraftAction, setPendingDiscardDraftAction] = useState(null);
  const [pendingAccessDeactivateRow, setPendingAccessDeactivateRow] = useState(null);
  const [accessEditor, setAccessEditor] = useState(EMPTY_ACCESS_EDITOR);

  const panelSnapshot = buildPanelSnapshot(form, accessRows, enableNewPassword, newPasswordValue, confirmNewPassword);
  const panelDirty = panelOpen && panelSnapshot !== baselineSnapshot;
  const panelEditable = panelMode === "edit" || panelMode === "add";
  const canDeactivateCurrentUser = panelMode !== "add" && normalizeText(panelUserId) !== "" && !isTemporaryId(panelUserId);

  function resetPanelState() {
    const f = createEmptyForm();
    setPanelOpen(false); setPanelMode("view"); setPanelUserId(null); setActiveTab("profile");
    setForm(f); setBaselineForm(f); setAccessRows([]); setBaselineAccessRows([]);
    setEnableNewPassword(false); setNewPasswordValue(""); setConfirmNewPassword("");
    setAccessEditor(EMPTY_ACCESS_EDITOR);
    setBaselineSnapshot(buildPanelSnapshot(f, [], false, "", "")); setIsPanelLoading(false);
  }

  function requestDiscardDraftConfirmation(onConfirm) {
    if (!panelDirty) { onConfirm(); return; }
    setPendingDiscardDraftAction(() => onConfirm); setShowDiscardDraftModal(true);
  }

  const closeDiscardDraftModal = useCallback(() => { setShowDiscardDraftModal(false); setPendingDiscardDraftAction(null); }, []);

  const confirmDiscardDraft = useCallback(() => {
    const onConfirm = pendingDiscardDraftAction;
    setShowDiscardDraftModal(false); setPendingDiscardDraftAction(null);
    if (typeof onConfirm === "function") onConfirm();
  }, [pendingDiscardDraftAction]);

  function updateTableRow(nextRow, { prepend = false } = {}) {
    const nextId = rowIdOf(nextRow);
    if (!nextId) return;
    setTableRows((prev) => {
      const idx = prev.findIndex((r) => rowIdOf(r) === nextId);
      if (idx < 0) return prepend ? [nextRow, ...prev] : [...prev, nextRow];
      const copy = [...prev]; copy[idx] = nextRow; return copy;
    });
  }

  const openExistingUserPanel = useCallback((row, mode) => {
    const userId = rowIdOf(row);
    if (!userId) { toastError("Invalid user row selected.", "User Master Setup"); return; }
    if (isTemporaryId(userId)) { toastWarning("Save Batch first before opening staged users.", "User Master Setup"); return; }

    requestDiscardDraftConfirmation(() => {
      const loadPanel = async () => {
        setPanelOpen(true); setPanelMode(mode); setPanelUserId(userId); setActiveTab("profile"); setIsPanelLoading(true);
        try {
          const { fetchUserDetail } = await import("../utils/userMasterHelpers");
          const { user, accessRows: loadedAccess } = await fetchUserDetail(userId);
          const fallbackStatusId = lookups?.statuses?.[0]?.status_id ?? null;
          const nextForm = createFormFromUser(user, fallbackStatusId, lookups?.statuses || []);
          setForm(nextForm); setBaselineForm(cloneForm(nextForm));
          setAccessRows(cloneAccessRows(loadedAccess)); setBaselineAccessRows(cloneAccessRows(loadedAccess));
          setEnableNewPassword(false); setNewPasswordValue(""); setConfirmNewPassword("");
          setAccessEditor(EMPTY_ACCESS_EDITOR);
          setBaselineSnapshot(buildPanelSnapshot(nextForm, loadedAccess, false, "", ""));
        } catch (error) {
          toastError(error?.message || "Failed to load selected user.", "User Master Setup"); resetPanelState();
        } finally { setIsPanelLoading(false); }
      };
      void loadPanel();
    });
  }, [lookups?.statuses]); // eslint-disable-line react-hooks/exhaustive-deps

  const openAddUserPanel = useCallback(() => {
    requestDiscardDraftConfirmation(() => {
      const fallbackStatusId = lookups?.statuses?.[0]?.status_id ?? null;
      const nextForm = createEmptyForm(fallbackStatusId, lookups?.statuses || []);
      setPanelOpen(true); setPanelMode("add"); setPanelUserId(null); setActiveTab("profile"); setIsPanelLoading(false);
      setForm(nextForm); setBaselineForm(cloneForm(nextForm)); setAccessRows([]); setBaselineAccessRows([]);
      setEnableNewPassword(true); setNewPasswordValue(""); setConfirmNewPassword("");
      setAccessEditor(EMPTY_ACCESS_EDITOR);
      setBaselineSnapshot(buildPanelSnapshot(nextForm, [], true, "", ""));
    });
  }, [lookups?.statuses]); // eslint-disable-line react-hooks/exhaustive-deps

  const closePanel = useCallback(() => { requestDiscardDraftConfirmation(() => resetPanelState()); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleStatusChange = useCallback((nextStatusId) => {
    setForm((p) => ({ ...p, status_id: normalizeOptionalText(nextStatusId), is_active: inferActiveFromStatus(nextStatusId, lookups?.statuses || [], p?.is_active) }));
  }, [lookups?.statuses]);

  const handleCompanyChange = useCallback((nextCompId) => {
    setForm((p) => {
      const nid = normalizeOptionalText(nextCompId);
      const valid = (lookups?.departments || []).some((r) => String(r?.dept_id) === String(p?.dept_id) && String(r?.comp_id) === String(nid));
      return { ...p, comp_id: nid, dept_id: valid ? p?.dept_id : null };
    });
  }, [lookups?.departments]);

  const startAccessCreate = useCallback(() => {
    if (!panelEditable) return;
    if (panelMode === "add") { toastInfo("Save this new user in batch first, then assign access.", "User Master Setup"); return; }
    setAccessEditor({ mode: "add", access_key: null, original_app_id: "", original_role_id: "", app_id: "", role_id: "" });
  }, [panelEditable, panelMode]);

  const cancelAccessEditor = useCallback(() => setAccessEditor(EMPTY_ACCESS_EDITOR), []);

  const submitAccessEditor = useCallback(() => {
    const appId = normalizeText(accessEditor?.app_id), roleId = normalizeText(accessEditor?.role_id);
    if (!appId || !roleId) { toastError("Application and role are required.", "User Master Setup"); return; }
    const dup = accessRows.some((r) => {
      const same = String(r?.app_id) === appId && String(r?.role_id) === roleId;
      if (!same) return false;
      return accessEditor?.mode !== "edit" || String(r?.access_key) !== String(accessEditor?.access_key);
    });
    if (dup) { toastError("That application/role mapping already exists.", "User Master Setup"); return; }
    if (accessEditor?.mode === "edit") {
      setAccessRows((prev) => prev.map((r) => String(r?.access_key) !== String(accessEditor?.access_key) ? r : makeLocalAccessRow(appId, roleId, lookups, r)));
    } else {
      setAccessRows((prev) => [...prev, makeLocalAccessRow(appId, roleId, lookups)]);
    }
    setAccessEditor(EMPTY_ACCESS_EDITOR);
  }, [accessEditor, accessRows, lookups]);

  const closeAccessDeactivateModal = useCallback(() => setPendingAccessDeactivateRow(null), []);
  const confirmRemoveAccessRow = useCallback(() => {
    const row = pendingAccessDeactivateRow; setPendingAccessDeactivateRow(null);
    if (!row) return;
    setAccessRows((prev) => prev.filter((e) => String(e?.access_key) !== String(row?.access_key)));
  }, [pendingAccessDeactivateRow]);

  const [isStaging, setIsStaging] = useState(false);

  const stagePanelChanges = useCallback(() => {
    if (!panelEditable) return;
    setIsStaging(true);
    try {
      const username = normalizeText(form?.username), email = normalizeText(form?.email).toLowerCase();
      if (!username) throw new Error("Username is required.");
      if (!email) throw new Error("Email is required.");
      if (enableNewPassword) {
        const pw = normalizeText(newPasswordValue), cpw = normalizeText(confirmNewPassword);
        if (!pw) throw new Error("Password is required when Set New Password is enabled.");
        if (pw.length < 8) throw new Error("Password must be at least 8 characters.");
        if (pw !== cpw) throw new Error("Confirm password must match.");
      }
      const stagedPw = enableNewPassword ? normalizeText(newPasswordValue) : "";
      const payload = buildUserPayload(form, stagedPw);

      if (panelMode === "add") {
        const tempId = `tmp-${Date.now().toString(36)}`;
        const previewRow = summarizeUserRow(form, lookups, { id: tempId, user_id: tempId, __batchState: "created" });
        updateTableRow(previewRow, { prepend: true });
        setPendingBatch((p) => ({ ...p, creates: [...(Array.isArray(p?.creates) ? p.creates : []), { tempId, payload, accessRows: [] }] }));
        toastSuccess("New user staged. Use Save Batch to commit.", "User Master Setup"); resetPanelState(); return;
      }

      const userId = normalizeText(panelUserId);
      if (!userId || isTemporaryId(userId)) throw new Error("Invalid user selected for update.");
      const { deletes, upserts } = diffAccessRows(baselineAccessRows, accessRows);
      const previewRow = summarizeUserRow(form, lookups, { ...(selectedUserRow || {}), id: userId, user_id: userId, __batchState: "updated" });
      updateTableRow(previewRow);
      setPendingBatch((p) => ({
        ...p,
        updates: { ...(p?.updates || {}), [userId]: payload },
        accessUpserts: replaceObjectKeyWithArray(p?.accessUpserts, userId, upserts),
        accessDeletes: replaceObjectKeyWithArray(p?.accessDeletes, userId, deletes),
      }));
      setBaselineForm(cloneForm(form)); setBaselineAccessRows(cloneAccessRows(accessRows));
      setEnableNewPassword(false); setNewPasswordValue(""); setConfirmNewPassword("");
      setPanelMode("view"); setBaselineSnapshot(buildPanelSnapshot(form, accessRows, false, "", ""));
      setAccessEditor(EMPTY_ACCESS_EDITOR);
      toastSuccess("User changes staged. Use Save Batch to commit.", "User Master Setup");
    } catch (error) {
      toastError(error?.message || "Failed to stage changes.", "User Master Setup");
    } finally { setIsStaging(false); }
  }, [accessRows, baselineAccessRows, confirmNewPassword, enableNewPassword, form, lookups,
    newPasswordValue, panelEditable, panelMode, panelUserId, selectedUserRow, setPendingBatch, setTableRows]); // eslint-disable-line react-hooks/exhaustive-deps

  const restorePanelToBaseline = useCallback(() => {
    if (panelMode === "add") { resetPanelState(); return; } // eslint-disable-line react-hooks/exhaustive-deps
    setForm(cloneForm(baselineForm)); setAccessRows(cloneAccessRows(baselineAccessRows));
    setEnableNewPassword(false); setNewPasswordValue(""); setConfirmNewPassword("");
    setAccessEditor(EMPTY_ACCESS_EDITOR);
    setBaselineSnapshot(buildPanelSnapshot(baselineForm, baselineAccessRows, false, "", ""));
  }, [baselineAccessRows, baselineForm, panelMode]);

  return {
    panelOpen, panelMode, panelUserId, activeTab, isPanelLoading, panelDirty, panelEditable,
    canDeactivateCurrentUser, isStaging,
    form, setForm, accessRows, setAccessRows, accessEditor, setAccessEditor,
    enableNewPassword, setEnableNewPassword, newPasswordValue, setNewPasswordValue,
    confirmNewPassword, setConfirmNewPassword,
    showDiscardDraftModal, pendingAccessDeactivateRow,
    setActiveTab, setPanelMode,
    openExistingUserPanel, openAddUserPanel, closePanel, resetPanelState,
    handleStatusChange, handleCompanyChange,
    startAccessCreate, cancelAccessEditor, submitAccessEditor,
    closeAccessDeactivateModal, confirmRemoveAccessRow, setPendingAccessDeactivateRow,
    closeDiscardDraftModal, confirmDiscardDraft,
    stagePanelChanges, restorePanelToBaseline,
  };
}
