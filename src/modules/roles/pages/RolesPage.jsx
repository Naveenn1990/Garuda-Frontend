// Roles list page.
import { useNavigate } from "react-router-dom";
import { PageHeader, DataTable, Button, Spinner } from "../../../components";
import { usePermissions } from "../../../app/store/permissionStore";
import { useRoles } from "../hooks/useRoles";

export function RolesPage() {
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const { data: rows = [], isLoading, isError } = useRoles();

  const columns = [
    { key: "name", header: "Role" },
    { key: "description", header: "Description", render: (r) => r.description || "—" },
    {
      key: "permissions",
      header: "Permissions",
      render: (r) => (r.isSuperAdmin ? "All (Super Admin)" : `${r.permissions?.length || 0}`),
    },
    {
      key: "isSystem",
      header: "Type",
      render: (r) => (r.isSystem ? "System" : "Custom"),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Roles & Permissions"
        subtitle="Define what each role can access"
        actions={
          hasPermission("roles.create") && (
            <Button onClick={() => navigate("/roles/create")}>+ Create Role</Button>
          )
        }
      />
      {isLoading ? (
        <Spinner />
      ) : isError ? (
        <p style={{ color: "var(--color-danger)" }}>Failed to load roles.</p>
      ) : (
        <DataTable columns={columns} rows={rows} emptyText="No roles yet." />
      )}
    </div>
  );
}

export default RolesPage;
