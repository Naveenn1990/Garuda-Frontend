// Users list page.
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader, DataTable, Button, Spinner } from "../../../components";
import { usePermissions } from "../../../app/store/permissionStore";
import { useUsers } from "../hooks/useUsers";

export function UsersPage() {
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const [q, setQ] = useState("");
  const { data: rows = [], isLoading, isError } = useUsers(q ? { q } : {});

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
        <DataTable columns={columns} rows={rows} emptyText="No users yet." />
      )}
    </div>
  );
}

export default UsersPage;
