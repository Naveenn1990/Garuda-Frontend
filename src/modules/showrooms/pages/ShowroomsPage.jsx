// Showrooms list page. Search box + Add Showroom button; rows link to the detail page.
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiTrash2 } from "react-icons/fi";
import { PageHeader, DataTable, Button, Spinner } from "../../../components";
import { usePermissions } from "../../../app/store/permissionStore";
import { useShowrooms, useDeleteShowroom } from "../hooks/useShowrooms";

export function ShowroomsPage() {
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const [q, setQ] = useState("");
  const { data: rows = [], isLoading, isError } = useShowrooms({
    type: "showroom",
    ...(q ? { q } : {}),
  });
  const deleteShowroom = useDeleteShowroom();

  function handleDelete(e, row) {
    e.stopPropagation(); // don't trigger the row-click navigation
    if (!window.confirm(`Delete showroom "${row.name}"? This cannot be undone.`)) return;
    deleteShowroom.mutate(row._id);
  }

  const columns = [
    { key: "name", header: "Name" },
    { key: "code", header: "Code" },
    { key: "city", header: "City" },
    {
      key: "manager",
      header: "Manager",
      render: (r) => r.manager?.name || "—",
    },
    {
      key: "status",
      header: "Status",
      render: (r) => (
        <span className={`badge badge--${r.status}`}>{r.status}</span>
      ),
    },
  ];

  if (hasPermission("showrooms.delete")) {
    columns.push({
      key: "actions",
      header: "",
      render: (r) => (
        <Button
          variant="secondary"
          onClick={(e) => handleDelete(e, r)}
          disabled={deleteShowroom.isPending}
          title="Delete showroom"
          style={{ color: "var(--color-danger)", display: "inline-flex", alignItems: "center", gap: 6 }}
        >
          <FiTrash2 />
          Delete
        </Button>
      ),
    });
  }

  return (
    <div>
      <PageHeader
        title="Showrooms"
        subtitle="Manage retail showroom locations"
        actions={
          hasPermission("showrooms.create") && (
            <Button onClick={() => navigate("/showrooms/create")}>
              + Add Showroom
            </Button>
          )
        }
      />

      <div style={{ marginBottom: 16 }}>
        <input
          className="search-input"
          placeholder="Search showroom by name, city or code..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {isLoading ? (
        <Spinner />
      ) : isError ? (
        <p style={{ color: "var(--color-danger)" }}>
          Failed to load showrooms. Is the API running?
        </p>
      ) : (
        <DataTable
          columns={columns}
          rows={rows}
          emptyText="No showrooms yet. Click Add Showroom to create one."
          onRowClick={(row) => navigate(`/showrooms/${row._id}`)}
        />
      )}
    </div>
  );
}

export default ShowroomsPage;
