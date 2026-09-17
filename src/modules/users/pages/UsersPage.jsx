// Users list page.
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiEdit2, FiTrash2 } from "react-icons/fi";
import { PageHeader, DataTable, Button, Spinner } from "../../../components";
import { usePermissions } from "../../../app/store/permissionStore";
import { useUsers, useDeleteUser } from "../hooks/useUsers";

export function UsersPage() {
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const [q, setQ] = useState("");
  const { data: rows = [], isLoading, isError } = useUsers(q ? { q } : {});
  const deleteUser = useDeleteUser();

  const canEdit = hasPermission("users.edit");
  const canDelete = hasPermission("users.delete");

  async function handleDelete(e, user) {
    e.stopPropagation(); // don't trigger the row-click (edit)
    if (!window.confirm(`Delete user "${user.name}"? This cannot be undone.`)) return;
    try {
      await deleteUser.mutateAsync(user._id);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete user.");
    }
  }

  const columns = [
    { key: "name", header: "Name" },
    { key: "email", header: "Email" },
    { key: "mobile", header: "Mobile", render: (r) => r.mobile || "—" },
    { key: "role", header: "Role", render: (r) => r.role?.name || "—" },
    {
      key: "showrooms",
      header: "Showrooms",
      render: (r) =>
        r.showrooms?.length ? r.showrooms.map((s) => s.code).join(", ") : "All",
    },
    {
      key: "status",
      header: "Status",
      render: (r) => <span className={`badge badge--${r.status}`}>{r.status}</span>,
    },
    {
      key: "actions",
      header: "Actions",
      render: (r) => {
        const isSuperAdmin = r.role?.isSuperAdmin || r.role?.name === "Super Admin";
        return (
          <div style={{ display: "flex", gap: 6 }}>
            {canEdit && (
              <button
                className="cat-card__btn"
                onClick={(e) => { e.stopPropagation(); navigate(`/users/${r._id}/edit`); }}>
                <FiEdit2 /> Edit
              </button>
            )}
            {canDelete && !isSuperAdmin && (
              <button
                className="cat-card__btn cat-card__btn--danger"
                onClick={(e) => handleDelete(e, r)}
                disabled={deleteUser.isPending}>
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
        title="Users"
        subtitle="Manage system users and their access"
        actions={
          hasPermission("users.create") && (
            <Button onClick={() => navigate("/users/create")}>+ Create User</Button>
          )
        }
      />
      <div style={{ marginBottom: 16 }}>
        <input
          className="search-input"
          placeholder="Search by name, email or mobile..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>
      {isLoading ? (
        <Spinner />
      ) : isError ? (
        <p style={{ color: "var(--color-danger)" }}>Failed to load users.</p>
      ) : (
        <DataTable
          columns={columns}
          rows={rows}
          emptyText="No users yet."
          onRowClick={(row) => navigate(`/users/${row._id}/edit`)}
        />
      )}
    </div>
  );
}

export default UsersPage;
