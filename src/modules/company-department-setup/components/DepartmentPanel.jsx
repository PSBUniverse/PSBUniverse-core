import { useMemo } from "react";
import { Badge, Card, TableZ } from "@/shared/components/ui";

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

export function DepartmentPanel({
  selectedCompany, decoratedDepartments, isSaving, isMutatingAction,
  pendingDeactivatedDepartmentIds,
  openEditDepartmentDialog, openToggleDepartmentDialog, openDeactivateDepartmentDialog,
}) {
  const columns = useMemo(() => [
    {
      key: "dept_name", label: "Department Name", width: "48%", sortable: true,
      render: (row) => {
        const m = batchMarker(row?.__batchState || "");
        return (
          <span className={row?.__batchState === "deleted" ? "text-decoration-line-through" : ""}>
            {row?.dept_name || "--"}{m.t ? <span className={m.c}>{m.t}</span> : null}
          </span>
        );
      },
    },
    { key: "dept_short_name", label: "Short Name", width: "30%", sortable: true },
    {
      key: "is_active_bool", label: "Active", width: "22%", sortable: true, align: "center",
      render: (row) => <StatusBadge isActive={Boolean(row?.is_active_bool)} />,
    },
  ], []);

  const actions = useMemo(() => [
    { key: "edit-department", label: "Edit", type: "secondary", icon: "pencil-square",
      disabled: (r) => isSaving || isMutatingAction || pendingDeactivatedDepartmentIds.has(String(r?.dept_id ?? "")),
      onClick: (r) => openEditDepartmentDialog(r) },
    { key: "disable-department", label: "Disable", type: "secondary", icon: "slash-circle",
      visible: (r) => Boolean(r?.is_active_bool),
      disabled: (r) => isSaving || isMutatingAction || pendingDeactivatedDepartmentIds.has(String(r?.dept_id ?? "")),
      onClick: (r) => openToggleDepartmentDialog(r) },
    { key: "enable-department", label: "Enable", type: "secondary", icon: "check-circle",
      visible: (r) => !Boolean(r?.is_active_bool),
      disabled: (r) => isSaving || isMutatingAction || pendingDeactivatedDepartmentIds.has(String(r?.dept_id ?? "")),
      onClick: (r) => openToggleDepartmentDialog(r) },
    { key: "deactivate-department", label: "Deactivate", type: "danger", icon: "trash",
      disabled: (r) => isSaving || isMutatingAction || pendingDeactivatedDepartmentIds.has(String(r?.dept_id ?? "")),
      onClick: (r) => openDeactivateDepartmentDialog(r) },
  ], [isMutatingAction, isSaving, openDeactivateDepartmentDialog, openEditDepartmentDialog, openToggleDepartmentDialog, pendingDeactivatedDepartmentIds]);

  return (
    <Card
      title={selectedCompany ? `Departments for: ${selectedCompany.comp_name}` : "Departments"}
      subtitle={selectedCompany ? "Company-scoped departments" : "Click a company row to view its departments."}
    >
      {selectedCompany ? (
        <TableZ columns={columns} data={decoratedDepartments} rowIdKey="dept_id"
          actions={actions} emptyMessage="No departments found for this company." />
      ) : (
        <div className="notice-banner notice-banner-info mb-0">Click a company row to view its departments.</div>
      )}
    </Card>
  );
}
