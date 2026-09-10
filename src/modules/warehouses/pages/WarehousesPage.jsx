// Warehouses list page. Warehouses are stock-holding locations (Showroom docs with
// type="warehouse") that feed showrooms via stock transfers. Reuses the showroom
// data hooks, filtered to type=warehouse.
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader, DataTable, Button, Spinner } from "../../../components";
import { usePermissions } from "../../../app/store/permissionStore";
import { useShowrooms } from "../../showrooms/hooks/useShowrooms";

export function WarehousesPage() {
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const [q, setQ] = useState("");
  const { data: rows = [], isLoading, isError } = useShowrooms({
    type: "warehouse",
    ...(q ? { q } : {}),
  });

  const columns = [
    { key: "name", header: "Name" },
    { key: "code", header: "Code" },
    { key: "city", header: "City" },
    {
      key: "status",
      header: "Status",
      render: (r) => <span className={`badge badge--${r.status}`}>{r.status}</span>,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Warehouses"
        subtitle="Stock-holding locations that supply showrooms"
        actions={
          hasPermission("showrooms.create") && (
            <Button onClick={() => navigate("/warehouses/create")}>+ Add Warehouse</Button>
          )
        }
      />

      <div style={{ marginBottom: 16 }}>
        <input
          className="search-input"
          placeholder="Search warehouse by name, city or code..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {isLoading ? (
        <Spinner />
      ) : isError ? (
        <p style={{ color: "var(--color-danger)" }}>Failed to load warehouses. Is the API running?</p>
      ) : (
        <DataTable
          columns={columns}
          rows={rows}
          emptyText="No warehouses yet. Click Add Warehouse to create one."
        />
      )}
    </div>
  );
}

export default WarehousesPage;
