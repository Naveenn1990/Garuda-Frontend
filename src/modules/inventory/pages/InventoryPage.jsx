// Inventory dashboard. Filter by showroom, toggle low-stock, view per-showroom stock,
// and record stock inward via a modal. Low-stock rows are highlighted.
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader, Card, Button, Spinner, Modal, FormField, BulkUpload, ExportButton } from "../../../components";
import { usePermissions } from "../../../app/store/permissionStore";
import { useShowrooms } from "../../showrooms/hooks/useShowrooms";
import { useProducts } from "../../products/hooks/useProducts";
import { useInventory, useStockInward, useBulkInward, useStockDamage } from "../hooks/useInventory";
import "./InventoryPage.css";

// Bulk inward loads stock into warehouses only. showroomCode must be a warehouse code.
const INWARD_HEADERS = ["sku", "showroomCode", "quantity", "note"];
const INWARD_SAMPLE = ["FRIDGE-LG-260", "WH-001", "50", "Opening stock (warehouse)"];

// Group flat inventory rows into per-location buckets, warehouses first.
function groupByLocation(rows) {
  const map = new Map();
  for (const r of rows) {
    const loc = r.showroom || {};
    const id = String(loc._id || "unknown");
    if (!map.has(id)) {
      map.set(id, {
        id,
        name: loc.name || "Unknown",
        code: loc.code || "—",
        type: loc.type || "showroom",
        rows: [],
      });
    }
    map.get(id).rows.push(r);
  }
  // Warehouses first, then showrooms; alphabetical within each.
  return [...map.values()].sort((a, b) => {
    if (a.type !== b.type) return a.type === "warehouse" ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
}

const EXPORT_COLUMNS = [
  { header: "Product", value: (r) => r.product?.name || "" },
  { header: "SKU", value: (r) => r.product?.sku || "" },
  { header: "Showroom", value: (r) => r.showroom?.code || "" },
  { header: "Available", value: (r) => r.available },
  { header: "Reserved", value: (r) => r.reserved },
  { header: "Sold", value: (r) => r.sold },
  { header: "Damaged", value: (r) => r.damaged },
  { header: "Min", value: (r) => r.minStock },
];

export function InventoryPage() {
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const { data: showrooms = [] } = useShowrooms();
  // Inward/damage destinations are warehouses only (stock enters via warehouse,
  // then transfers to showrooms).
  const { data: warehouses = [] } = useShowrooms({ type: "warehouse" });
  const { data: products = [] } = useProducts();

  const [showroom, setShowroom] = useState("");
  const [lowStock, setLowStock] = useState(false);

  const params = {};
  if (showroom) params.showroom = showroom;
  if (lowStock) params.lowStock = "true";
  const { data: rows = [], isLoading, isError } = useInventory(params);

  const inward = useStockInward();
  const bulkInward = useBulkInward();
  const damage = useStockDamage();
  const [open, setOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [dmgOpen, setDmgOpen] = useState(false);
  const [form, setForm] = useState({ product: "", showroom: "", quantity: "", note: "" });
  const [dmgForm, setDmgForm] = useState({ product: "", showroom: "", quantity: "", note: "" });
  const [error, setError] = useState("");
  const [dmgError, setDmgError] = useState("");

  async function handleDamage(e) {
    e.preventDefault();
    setDmgError("");
    try {
      await damage.mutateAsync({ ...dmgForm, quantity: Number(dmgForm.quantity) });
      setDmgForm({ product: "", showroom: "", quantity: "", note: "" });
      setDmgOpen(false);
    } catch (err) {
      setDmgError(err.response?.data?.message || "Failed to mark damaged.");
    }
  }

  async function handleInward(e) {
    e.preventDefault();
    setError("");
    try {
      await inward.mutateAsync({ ...form, quantity: Number(form.quantity) });
      setForm({ product: "", showroom: "", quantity: "", note: "" });
      setOpen(false);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to record stock inward.");
    }
  }

  return (
    <div>
      <PageHeader
        title="Inventory"
        subtitle="Stock grouped by warehouse and showroom"
        actions={
          <div style={{ display: "flex", gap: 8 }}>
            <ExportButton rows={rows} columns={EXPORT_COLUMNS} filename="inventory.csv" />
            <Button variant="secondary" onClick={() => navigate("/inventory/ledger")}>
              Stock Ledger
            </Button>
            {hasPermission("inventory.inward") && (
              <>
                <Button variant="secondary" onClick={() => setDmgOpen(true)}>Mark Damaged</Button>
                <Button variant="secondary" onClick={() => setBulkOpen(true)}>Bulk Inward</Button>
                <Button onClick={() => setOpen(true)}>+ Stock Inward</Button>
              </>
            )}
          </div>
        }
      />

      {/* Top Low Stock Alert Banner */}
      {(() => {
        const totalLowStock = rows.filter((r) => (r.available || 0) <= (r.minStock || 0)).length;
        if (totalLowStock > 0 && !lowStock) {
          return (
            <div
              style={{
                backgroundColor: "#fef3c7",
                border: "1px solid #fde047",
                borderRadius: 8,
                padding: "12px 16px",
                marginBottom: 16,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                color: "#854d0e",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: "1.2rem" }}>⚠️</span>
                <div>
                  <strong>Low Stock Alert:</strong> {totalLowStock} items across locations are at or below minimum safety thresholds.
                </div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  type="button"
                  onClick={() => setLowStock(true)}
                  style={{
                    padding: "6px 12px",
                    backgroundColor: "#b45309",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: 6,
                    cursor: "pointer",
                    fontSize: "0.82rem",
                    fontWeight: 600,
                  }}
                >
                  View Low Stock Items
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/transfers")}
                  style={{
                    padding: "6px 12px",
                    backgroundColor: "#ffffff",
                    color: "#854d0e",
                    border: "1px solid #d97706",
                    borderRadius: 6,
                    cursor: "pointer",
                    fontSize: "0.82rem",
                    fontWeight: 600,
                  }}
                >
                  Stock Transfers
                </button>
              </div>
            </div>
          );
        }
        return null;
      })()}

      <div className="inv-filters" style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 16 }}>
        <select
          className="search-input"
          style={{ maxWidth: 240 }}
          value={showroom}
          onChange={(e) => setShowroom(e.target.value)}
        >
          <option value="">All Locations</option>
          {showrooms.map((s) => (
            <option key={s._id} value={s._id}>
              {s.type === "warehouse" ? "🏭 " : "🏪 "}{s.name} ({s.code})
            </option>
          ))}
        </select>

        <div style={{ display: "flex", gap: 6 }}>
          <button
            type="button"
            onClick={() => setLowStock(false)}
            style={{
              padding: "6px 12px",
              borderRadius: 20,
              border: "1px solid var(--color-border)",
              backgroundColor: !lowStock ? "var(--brand-gold-dark, #b45309)" : "#ffffff",
              color: !lowStock ? "#ffffff" : "#475569",
              fontSize: "0.82rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            All Stock
          </button>
          <button
            type="button"
            onClick={() => setLowStock(true)}
            style={{
              padding: "6px 12px",
              borderRadius: 20,
              border: "1px solid #f59e0b",
              backgroundColor: lowStock ? "#f59e0b" : "#fffbeb",
              color: lowStock ? "#ffffff" : "#b45309",
              fontSize: "0.82rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            ⚠️ Low Stock Only
          </button>
        </div>
      </div>

      {isLoading ? (
        <Spinner />
      ) : isError ? (
        <p style={{ color: "var(--color-danger)" }}>Failed to load inventory. Is the API running?</p>
      ) : rows.length === 0 ? (
        <Card>
          <p className="tab-empty">No stock records{lowStock ? " below threshold" : ""}.</p>
        </Card>
      ) : (
        // Group inventory rows by location (warehouse / showroom).
        groupByLocation(rows).map((group) => {
          const isWh = group.type === "warehouse";
          const totalUnits = group.rows.reduce((s, r) => s + (r.available || 0), 0);
          const lowInGroup = group.rows.filter((r) => r.available <= (r.minStock || 0)).length;
          return (
            <Card key={group.id} style={{ marginBottom: 16 }}>
              {/* Location header */}
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                flexWrap: "wrap", gap: 8, marginBottom: 12,
                paddingBottom: 12, borderBottom: "1px solid var(--color-line, #eee)",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: "1.3rem" }}>{isWh ? "🏭" : "🏪"}</span>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: "1.05rem" }}>
                      {group.name}
                      <span style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", fontWeight: 500, marginLeft: 8 }}>
                        ({group.code})
                      </span>
                    </div>
                    <div style={{ fontSize: "0.78rem", color: "var(--color-text-muted)", textTransform: "capitalize" }}>
                      {isWh ? "Warehouse" : "Showroom"}
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 16, fontSize: "0.85rem" }}>
                  <span><strong>{group.rows.length}</strong> products</span>
                  <span><strong>{totalUnits}</strong> units</span>
                  {lowInGroup > 0 && (
                    <span style={{ color: "var(--color-danger)" }}>
                      <strong>{lowInGroup}</strong> low
                    </span>
                  )}
                </div>
              </div>

              <div className="data-table__wrap" style={{ border: "none" }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>SKU</th>
                      <th style={{ textAlign: "right" }}>Available</th>
                      <th style={{ textAlign: "right" }}>Reserved</th>
                      <th style={{ textAlign: "right" }}>Sold</th>
                      <th style={{ textAlign: "right" }}>Damaged</th>
                      <th style={{ textAlign: "right" }}>Min</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.rows.map((r) => {
                      const low = r.available <= (r.minStock || 0);
                      return (
                        <tr key={r._id} className={low ? "inv-row--low" : ""}>
                          <td>{r.product?.name || "—"}</td>
                          <td style={{ fontFamily: "monospace", color: "var(--color-text-muted)" }}>{r.product?.sku || "—"}</td>
                          <td style={{ textAlign: "right", fontWeight: 700 }}>
                            {r.available}
                            {low && <span className="inv-low-tag">low</span>}
                          </td>
                          <td style={{ textAlign: "right" }}>{r.reserved}</td>
                          <td style={{ textAlign: "right" }}>{r.sold}</td>
                          <td style={{ textAlign: "right" }}>{r.damaged}</td>
                          <td style={{ textAlign: "right" }}>{r.minStock}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          );
        })
      )}

      <Modal
        open={open}
        title="Stock Inward"
        onClose={() => setOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleInward} disabled={inward.isPending}>
              {inward.isPending ? "Saving..." : "Add Stock"}
            </Button>
          </>
        }
      >
        <form onSubmit={handleInward}>
          <FormField label="Product *" htmlFor="inw-product">
            <select
              id="inw-product"
              value={form.product}
              onChange={(e) => setForm({ ...form, product: e.target.value })}
              required
            >
              <option value="">Select product</option>
              {products.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name} ({p.sku})
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Warehouse *" htmlFor="inw-showroom">
            <select
              id="inw-showroom"
              value={form.showroom}
              onChange={(e) => setForm({ ...form, showroom: e.target.value })}
              required
            >
              <option value="">Select warehouse</option>
              {warehouses.map((s) => (
                <option key={s._id} value={s._id}>
                  🏭 {s.name} ({s.code})
                </option>
              ))}
            </select>
            {warehouses.length === 0 && (
              <p style={{ fontSize: "0.8rem", color: "var(--color-danger)", marginTop: 4 }}>
                No warehouses found. Create a warehouse first (Showrooms → set type = Warehouse).
              </p>
            )}
          </FormField>
          <FormField label="Quantity *" htmlFor="inw-qty">
            <input
              id="inw-qty"
              type="number"
              min="1"
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: e.target.value })}
              required
            />
          </FormField>
          <FormField label="Note" htmlFor="inw-note">
            <input
              id="inw-note"
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
            />
          </FormField>
          {error && <p style={{ color: "var(--color-danger)" }}>{error}</p>}
        </form>
      </Modal>

      <BulkUpload
        open={bulkOpen}
        onClose={() => setBulkOpen(false)}
        title="Bulk Stock Inward"
        headers={INWARD_HEADERS}
        sampleRow={INWARD_SAMPLE}
        templateName="stock-inward-template.csv"
        onUpload={(rows) => bulkInward.mutateAsync(rows)}
      />

      <Modal
        open={dmgOpen}
        title="Mark Stock Damaged"
        onClose={() => setDmgOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setDmgOpen(false)}>Cancel</Button>
            <Button variant="danger" onClick={handleDamage} disabled={damage.isPending}>
              {damage.isPending ? "Saving..." : "Mark Damaged"}
            </Button>
          </>
        }
      >
        <form onSubmit={handleDamage}>
          <FormField label="Product *" htmlFor="dmg-product">
            <select id="dmg-product" value={dmgForm.product} onChange={(e) => setDmgForm({ ...dmgForm, product: e.target.value })} required>
              <option value="">Select product</option>
              {products.map((p) => <option key={p._id} value={p._id}>{p.name} ({p.sku})</option>)}
            </select>
          </FormField>
          <FormField label="Showroom *" htmlFor="dmg-showroom">
            <select id="dmg-showroom" value={dmgForm.showroom} onChange={(e) => setDmgForm({ ...dmgForm, showroom: e.target.value })} required>
              <option value="">Select showroom</option>
              {showrooms.map((s) => <option key={s._id} value={s._id}>{s.name} ({s.code})</option>)}
            </select>
          </FormField>
          <FormField label="Quantity *" htmlFor="dmg-qty">
            <input id="dmg-qty" type="number" min="1" value={dmgForm.quantity} onChange={(e) => setDmgForm({ ...dmgForm, quantity: e.target.value })} required />
          </FormField>
          <FormField label="Note" htmlFor="dmg-note">
            <input id="dmg-note" value={dmgForm.note} onChange={(e) => setDmgForm({ ...dmgForm, note: e.target.value })} />
          </FormField>
          {dmgError && <p style={{ color: "var(--color-danger)" }}>{dmgError}</p>}
        </form>
      </Modal>
    </div>
  );
}

export default InventoryPage;
