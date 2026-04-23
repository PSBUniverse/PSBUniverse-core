import { useMemo } from "react";
import { Badge, Card, TableZ } from "@/shared/components/ui";
import { normalizeText } from "../utils/userMasterHelpers";

export function UserTable({ tableRows, panelUserId, panelOpen, onRowClick }) {
  const columns = useMemo(() => [
    { key: "username", label: "Username", width: 170, sortable: true },
    { key: "full_name", label: "Full Name", width: 210, sortable: true },
    { key: "email", label: "Email", width: 280, sortable: true },
    { key: "company_name", label: "Company", width: 210, sortable: true },
    { key: "department_name", label: "Department", width: 200, sortable: true },
    {
      key: "status_label", label: "Status", width: 130, sortable: true, align: "center",
      render: (row) => (
        <Badge bg={row?.is_active ? "success" : "secondary"} text="light">
          {normalizeText(row?.status_label).toUpperCase() || (row?.is_active ? "ACTIVE" : "INACTIVE")}
        </Badge>
      ),
    },
  ], []);

  return (
    <Card>
      <TableZ columns={columns} data={tableRows} rowIdKey="id"
        selectedRowId={panelUserId} onRowClick={onRowClick}
        showActionColumn={false} emptyMessage="No users found." />
    </Card>
  );
}
