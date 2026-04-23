"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toastError, toastSuccess } from "@/shared/components/ui";
import {
  parseCompanyId, isSameId, compareText, mapCompanyRow, mapDepartmentRow,
  EMPTY_DIALOG, createEmptyCompanyChanges, createEmptyDepartmentChanges,
  executeBatchSave, remapDepartmentsByCompanyId,
} from "../utils/companyDeptHelpers";
import { useCompanyActions } from "./useCompanyActions";
import { useDepartmentActions } from "./useDepartmentActions";

export function useCompanyDepartmentSetup({ companies = [], departments = [], initialSelectedCompanyId = null }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const seedCompanies = useMemo(
    () => (Array.isArray(companies) ? companies : []).map((c, i) => mapCompanyRow(c, i)).sort((a, b) => compareText(a.comp_name, b.comp_name)),
    [companies]);

  const seedDepartments = useMemo(
    () => (Array.isArray(departments) ? departments : []).map((d, i) => mapDepartmentRow(d, i)).sort((a, b) => compareText(a.dept_name, b.dept_name)),
    [departments]);

  const [orderedCompanies, setOrderedCompanies] = useState(seedCompanies);
  const [allDepartments, setAllDepartments] = useState(seedDepartments);
  const [companyChanges, setCompanyChanges] = useState(createEmptyCompanyChanges());
  const [departmentChanges, setDepartmentChanges] = useState(createEmptyDepartmentChanges());
  const [isMutatingAction, setIsMutatingAction] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [dialog, setDialog] = useState(EMPTY_DIALOG);
  const [companyDraft, setCompanyDraft] = useState({ name: "", shortName: "", email: "", phone: "" });
  const [departmentDraft, setDepartmentDraft] = useState({ name: "", shortName: "" });

  const [selectedCompanyId, setSelectedCompanyId] = useState(() => {
    const fromQ = parseCompanyId(searchParams?.get("company"));
    if (fromQ !== null) return fromQ;
    if (initialSelectedCompanyId != null && initialSelectedCompanyId !== "") return initialSelectedCompanyId;
    return seedCompanies[0]?.comp_id ?? null;
  });

  useEffect(() => {
    setOrderedCompanies(seedCompanies); setAllDepartments(seedDepartments);
    setCompanyChanges(createEmptyCompanyChanges()); setDepartmentChanges(createEmptyDepartmentChanges());
    setDialog(EMPTY_DIALOG); setCompanyDraft({ name: "", shortName: "", email: "", phone: "" }); setDepartmentDraft({ name: "", shortName: "" });
    setIsMutatingAction(false); setIsSaving(false);
    const qId = parseCompanyId(searchParams?.get("company"));
    setSelectedCompanyId(qId ?? initialSelectedCompanyId ?? seedCompanies[0]?.comp_id ?? null);
  }, [initialSelectedCompanyId, searchParams, seedCompanies, seedDepartments]);

  const pendingSummary = useMemo(() => {
    const cA = companyChanges.creates.length, cE = Object.keys(companyChanges.updates || {}).length, cD = companyChanges.deactivations.length;
    const dA = departmentChanges.creates.length, dE = Object.keys(departmentChanges.updates || {}).length, dD = departmentChanges.deactivations.length;
    return { companyAdded: cA, companyEdited: cE, companyDeactivated: cD, departmentAdded: dA, departmentEdited: dE, departmentDeactivated: dD, total: cA + cE + cD + dA + dE + dD };
  }, [companyChanges, departmentChanges]);

  const hasPendingChanges = pendingSummary.total > 0;

  const pendingDeactivatedCompanyIds = useMemo(
    () => new Set((companyChanges.deactivations || []).map((id) => String(id ?? ""))), [companyChanges.deactivations]);
  const pendingDeactivatedDepartmentIds = useMemo(
    () => new Set((departmentChanges.deactivations || []).map((id) => String(id ?? ""))), [departmentChanges.deactivations]);

  const selectedCompany = useMemo(
    () => orderedCompanies.find((c) => isSameId(c?.comp_id, selectedCompanyId)) ?? null, [orderedCompanies, selectedCompanyId]);

  const selectedCompanyDepartments = useMemo(() => {
    if (!selectedCompany?.comp_id) return [];
    return allDepartments.filter((d) => isSameId(d?.comp_id, selectedCompany.comp_id)).sort((a, b) => compareText(a.dept_name, b.dept_name));
  }, [allDepartments, selectedCompany?.comp_id]);

  const isSelectedCompanyPendingDeactivation = useMemo(
    () => pendingDeactivatedCompanyIds.has(String(selectedCompany?.comp_id ?? "")), [pendingDeactivatedCompanyIds, selectedCompany?.comp_id]);

  const decoratedCompanies = useMemo(() => {
    const cIds = new Set((companyChanges.creates || []).map((e) => String(e?.tempId ?? "")));
    const uIds = new Set(Object.keys(companyChanges.updates || {}));
    const dIds = new Set((companyChanges.deactivations || []).map((e) => String(e ?? "")));
    return orderedCompanies.map((row) => {
      const id = String(row?.comp_id ?? "");
      if (dIds.has(id)) return { ...row, __batchState: "deleted" };
      if (cIds.has(id)) return { ...row, __batchState: "created" };
      if (uIds.has(id)) return { ...row, __batchState: "updated" };
      return { ...row, __batchState: "none" };
    });
  }, [companyChanges, orderedCompanies]);

  const decoratedDepartments = useMemo(() => {
    const cIds = new Set((departmentChanges.creates || []).map((e) => String(e?.tempId ?? "")));
    const uIds = new Set(Object.keys(departmentChanges.updates || {}));
    const dIds = new Set((departmentChanges.deactivations || []).map((e) => String(e ?? "")));
    return selectedCompanyDepartments.map((row) => {
      const id = String(row?.dept_id ?? "");
      if (dIds.has(id)) return { ...row, __batchState: "deleted" };
      if (cIds.has(id)) return { ...row, __batchState: "created" };
      if (uIds.has(id)) return { ...row, __batchState: "updated" };
      return { ...row, __batchState: "none" };
    });
  }, [departmentChanges, selectedCompanyDepartments]);

  const updateSelectedCompanyInQuery = useCallback((companyId) => {
    const p = new URLSearchParams(searchParams?.toString() || "");
    if (companyId == null || companyId === "") p.delete("company"); else p.set("company", String(companyId));
    const q = p.toString();
    router.replace(q ? `${pathname}?${q}` : pathname, { scroll: false });
    setSelectedCompanyId(companyId ?? null);
  }, [pathname, router, searchParams]);

  const closeDialog = useCallback(() => { if (!isMutatingAction && !isSaving) setDialog(EMPTY_DIALOG); }, [isMutatingAction, isSaving]);

  const handleCompanyRowClick = useCallback((row) => {
    if (isMutatingAction || isSaving) return;
    if (isSameId(row?.comp_id, selectedCompany?.comp_id)) return;
    updateSelectedCompanyInQuery(row?.comp_id);
  }, [isMutatingAction, isSaving, selectedCompany?.comp_id, updateSelectedCompanyInQuery]);

  const handleCancelBatch = useCallback(() => {
    if (isMutatingAction || isSaving || !hasPendingChanges) return;
    setOrderedCompanies(seedCompanies); setAllDepartments(seedDepartments);
    setCompanyChanges(createEmptyCompanyChanges()); setDepartmentChanges(createEmptyDepartmentChanges());
    setDialog(EMPTY_DIALOG); setCompanyDraft({ name: "", shortName: "", email: "", phone: "" }); setDepartmentDraft({ name: "", shortName: "" });
    updateSelectedCompanyInQuery(seedCompanies[0]?.comp_id ?? null);
    toastSuccess("Batch changes canceled.", "Batching");
  }, [hasPendingChanges, isMutatingAction, isSaving, seedCompanies, seedDepartments, updateSelectedCompanyInQuery]);

  const handleSaveBatch = useCallback(async () => {
    if (!hasPendingChanges || isSaving || isMutatingAction) return;
    setIsSaving(true); setIsMutatingAction(true);
    try {
      const { companyIdMap, nextSelectedCompanyId } = await executeBatchSave(
        companyChanges, departmentChanges, orderedCompanies, selectedCompany?.comp_id);
      if (companyIdMap.size > 0) setAllDepartments((prev) => remapDepartmentsByCompanyId(prev, companyIdMap));
      setCompanyChanges(createEmptyCompanyChanges()); setDepartmentChanges(createEmptyDepartmentChanges());
      updateSelectedCompanyInQuery(nextSelectedCompanyId);
      router.refresh();
      toastSuccess(`Saved ${pendingSummary.total} batched change(s).`, "Save Batch");
    } catch (error) {
      toastError(error?.message || "Failed to save batched changes.");
    } finally { setIsMutatingAction(false); setIsSaving(false); }
  }, [companyChanges, departmentChanges, hasPendingChanges, isMutatingAction, isSaving,
    orderedCompanies, pendingSummary.total, router, selectedCompany?.comp_id, updateSelectedCompanyInQuery]);

  const companyActions = useCompanyActions({
    isSaving, isMutatingAction, selectedCompany, allDepartments, orderedCompanies,
    dialog, companyDraft,
    setOrderedCompanies, setAllDepartments, setCompanyChanges, setDepartmentChanges,
    setDialog, setCompanyDraft, updateSelectedCompanyInQuery,
  });

  const deptActions = useDepartmentActions({
    isSaving, isMutatingAction, isSelectedCompanyPendingDeactivation,
    selectedCompany, dialog, departmentDraft,
    setAllDepartments, setDepartmentChanges, setDialog, setDepartmentDraft,
  });

  return {
    decoratedCompanies, decoratedDepartments,
    dialog, companyDraft, departmentDraft, isSaving, isMutatingAction,
    pendingSummary, hasPendingChanges,
    pendingDeactivatedCompanyIds, pendingDeactivatedDepartmentIds,
    selectedCompany, isSelectedCompanyPendingDeactivation,
    setDialog, setCompanyDraft, setDepartmentDraft,
    handleCompanyRowClick, handleCancelBatch, handleSaveBatch, closeDialog,
    ...companyActions, ...deptActions,
  };
}
