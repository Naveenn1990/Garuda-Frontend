// Showrooms list page. Search box + Add Showroom button; rows link to the detail page.
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader, DataTable, Button, Spinner } from "../../../components";
import { usePermissions } from "../../../app/store/permissionStore";
import { useShowrooms } from "../hooks/useShowrooms";

export function ShowroomsPage() {
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const [q, setQ] = useState("");
  const { data: rows = [], isLoading, isError } = useShowrooms({
    type: "showroom",
    ...(q ? { q } : {}),
  });

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
