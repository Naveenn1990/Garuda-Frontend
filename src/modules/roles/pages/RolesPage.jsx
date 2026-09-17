// Roles list page.
import { useNavigate } from "react-router-dom";
import { FiEdit2, FiTrash2 } from "react-icons/fi";
import { PageHeader, DataTable, Button, Spinner } from "../../../components";
import { usePermissions } from "../../../app/store/permissionStore";
import { useRoles, useDeleteRole } from "../hooks/useRoles";

export function RolesPage() {
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const { data: rows = [], isLoading, isError } = useRoles();
  const deleteRole = useDeleteRole();

  const canEdit = hasPermission("roles.edit");
  const canDelete = hasPermission("roles.delete");

  async function handleDelete(role) {
    if (!window.confirm(`Delete role "${role.name}"? Users with this role must be reassigned.`)) return;
    try {
      await deleteRole.mutateAsync(role._id);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete role.");
    }
  }

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
    {
      key: "actions",
      header: "Actions",
      render: (r) => {
        // Super Admin role is untouchable. System roles can be edited but not deleted.
        if (r.isSuperAdmin) return <span style={{ color: "var(--color-text-muted)" }}>—</span>;
        return (
          <div style={{ display: "flex", gap: 6 }}>
            {canEdit && (
              <button
                className="cat-card__btn"
                onClick={(e) => { e.stopPropagation(); navigate(`/roles/${r._id}/edit`); }}>
                <FiEdit2 /> Edit
              </button>
            )}
            {canDelete && !r.isSystem && (
              <button
                className="cat-card__btn cat-card__btn--danger"
                onClick={(e) => { e.stopPropagation(); handleDelete(r); }}
                disabled={deleteRole.isPending}>
                <FiTrash2 /> Delete
              </button>
            )}
          </div>
        );
      },
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
