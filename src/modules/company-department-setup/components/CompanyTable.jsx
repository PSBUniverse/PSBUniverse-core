import { useMemo } from "react";
import { Badge, Card, TableZ } from "@/shared/components/ui";
import { isSameId } from "../utils/companyDeptHelpers";

function StatusBadge({ isActive }) {
  return <Badge bg={isActive ? "success" : "primary"} text="light">{isActive ? "Active" : "Inactive"}</Badge>;
}

function batchMarker(bs) {
  const map = {
    deleted: { t: "Deactivated", c: "psb-batch-marker psb-batch-marker-deleted" },
    created: { t: "New", c: "psb-batch-marker psb-batch-marker-new" },
    updated: { t: "Edited", c: "psb-batch-marker psb-batch-marker-edited" },
  };
  return map[bs] || { t: "", c: "" };
}

export function CompanyTable({
  decoratedCompanies, selectedCompany, isSaving, isMutatingAction,
  pendingDeactivatedCompanyIds, handleCompanyRowClick,
  openEditCompanyDialog, openToggleCompanyDialog, openDeactivateCompanyDialog,
}) {
  const columns = useMemo(() => [
    {
      key: "comp_name", label: "Company Name", width: "26%", sortable: true,
      render: (row) => {
        const m = batchMarker(row?.__batchState || "");
        const cls = [
          isSameId(row?.comp_id, selectedCompany?.comp_id) ? "fw-semibold text-primary" : "",
          row?.__batchState === "deleted" ? "text-decoration-line-through" : "",
        ].filter(Boolean).join(" ");
        return <span className={cls}>{row?.comp_name || "--"}{m.t ? <span className={m.c}>{m.t}</span> : null}</span>;
      },
    },
    { key: "comp_short_name", label: "Short Name", width: "18%", sortable: true },
    { key: "comp_email", label: "Email", width: "26%", sortable: true },
    { key: "comp_phone", label: "Phone", width: "18%", sortable: true },
    {
      key: "is_active_bool", label: "Active", width: "12%", sortable: true, align: "center",
      render: (row) => <StatusBadge isActive={Boolean(row?.is_active_bool)} />,
    },
  ], [selectedCompany?.comp_id]);

  const actions = useMemo(() => [
    { key: "edit-company", label: "Edit", type: "secondary", icon: "pencil-square",
      disabled: (r) => isSaving || isMutatingAction || pendingDeactivatedCompanyIds.has(String(r?.comp_id ?? "")),
      onClick: (r) => openEditCompanyDialog(r) },
    { key: "disable-company", label: "Disable", type: "secondary", icon: "slash-circle",
      visible: (r) => Boolean(r?.is_active_bool),
      disabled: (r) => isSaving || isMutatingAction || pendingDeactivatedCompanyIds.has(String(r?.comp_id ?? "")),
      onClick: (r) => openToggleCompanyDialog(r) },
    { key: "enable-company", label: "Enable", type: "secondary", icon: "check-circle",
      visible: (r) => !Boolean(r?.is_active_bool),
      disabled: (r) => isSaving || isMutatingAction || pendingDeactivatedCompanyIds.has(String(r?.comp_id ?? "")),
      onClick: (r) => openToggleCompanyDialog(r) },
    { key: "deactivate-company", label: "Deactivate", type: "danger", icon: "trash",
      disabled: (r) => isSaving || isMutatingAction || pendingDeactivatedCompanyIds.has(String(r?.comp_id ?? "")),
      onClick: (r) => openDeactivateCompanyDialog(r) },
  ], [isMutatingAction, isSaving, openDeactivateCompanyDialog, openEditCompanyDialog, openToggleCompanyDialog, pendingDeactivatedCompanyIds]);

  return (
    <Card title="Companies" subtitle="Master company records.">
      <TableZ columns={columns} data={decoratedCompanies} rowIdKey="comp_id"
        selectedRowId={selectedCompany?.comp_id ?? null} onRowClick={handleCompanyRowClick}
        actions={actions} emptyMessage="No companies found." />
    </Card>
  );
}
