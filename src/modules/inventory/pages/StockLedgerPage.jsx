// Stock Ledger - chronological history of every stock movement, filterable by showroom.
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader, DataTable, Button, Spinner } from "../../../components";
import { useShowrooms } from "../../showrooms/hooks/useShowrooms";
import { useStockLedger } from "../hooks/useInventory";

const TYPE_LABEL = {
  inward: "Inward",
  outward: "Outward",
  adjustment: "Adjustment",
  transfer_out: "Transfer Out",
  transfer_in: "Transfer In",
  damaged: "Damaged",
};

export function StockLedgerPage() {
  const navigate = useNavigate();
  const { data: showrooms = [] } = useShowrooms();
  const [showroom, setShowroom] = useState("");
  const { data: rows = [], isLoading, isError } = useStockLedger(showroom ? { showroom } : {});

  const columns = [
    {
      key: "createdAt",
      header: "Date",
      render: (r) => new Date(r.createdAt).toLocaleString(),
    },
    { key: "product", header: "Product", render: (r) => r.product?.sku || "—" },
    { key: "showroom", header: "Showroom", render: (r) => r.showroom?.code || "—" },
    { key: "type", header: "Type", render: (r) => TYPE_LABEL[r.type] || r.type },
    {
      key: "quantity",
      header: "Qty",
      render: (r) => (
        <span style={{ color: r.quantity < 0 ? "var(--color-danger)" : "var(--color-success)" }}>
          {r.quantity > 0 ? `+${r.quantity}` : r.quantity}
        </span>
      ),
    },
    { key: "balance", header: "Balance" },
    { key: "note", header: "Note", render: (r) => r.note || "—" },
  ];

  return (
    <div>
      <PageHeader
        title="Stock Ledger"
        subtitle="Complete stock movement history"
        actions={
          <Button variant="secondary" onClick={() => navigate("/inventory")}>
            Back to Inventory
          </Button>
        }
      />

      <div style={{ marginBottom: 16 }}>
        <select
          className="search-input"
          style={{ maxWidth: 240 }}
          value={showroom}
          onChange={(e) => setShowroom(e.target.value)}
        >
          <option value="">All Showrooms</option>
          {showrooms.map((s) => (
            <option key={s._id} value={s._id}>
              {s.name} ({s.code})
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <Spinner />
      ) : isError ? (
        <p style={{ color: "var(--color-danger)" }}>Failed to load ledger.</p>
      ) : (
        <DataTable columns={columns} rows={rows} emptyText="No stock movements yet." />
      )}
    </div>
  );
}

export default StockLedgerPage;
