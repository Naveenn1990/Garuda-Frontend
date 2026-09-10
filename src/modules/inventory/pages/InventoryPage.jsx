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

const INWARD_HEADERS = ["sku", "showroomCode", "quantity", "note"];
const INWARD_SAMPLE = ["FRIDGE-LG-260", "BLR-001", "50", "Opening stock"];

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
        subtitle="Stock levels across showrooms"
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

      <div className="inv-filters">
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
        <label className="inv-lowstock">
          <input
            type="checkbox"
            checked={lowStock}
            onChange={(e) => setLowStock(e.target.checked)}
          />
          Low stock only
        </label>
      </div>

      {isLoading ? (
        <Spinner />
      ) : isError ? (
        <p style={{ color: "var(--color-danger)" }}>Failed to load inventory. Is the API running?</p>
      ) : (
        <Card>
          <div className="data-table__wrap" style={{ border: "none" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>Showroom</th>
                  <th>Available</th>
                  <th>Reserved</th>
                  <th>Sold</th>
                  <th>Damaged</th>
                  <th>Min</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td className="data-table__empty" colSpan={8}>
                      No stock records{lowStock ? " below threshold" : ""}.
                    </td>
                  </tr>
                ) : (
                  rows.map((r) => {
                    const low = r.available <= (r.minStock || 0);
                    return (
                      <tr key={r._id} className={low ? "inv-row--low" : ""}>
                        <td>{r.product?.name || "—"}</td>
                        <td>{r.product?.sku || "—"}</td>
                        <td>{r.showroom?.code || "—"}</td>
                        <td>
                          {r.available}
                          {low && <span className="inv-low-tag">low</span>}
                        </td>
                        <td>{r.reserved}</td>
                        <td>{r.sold}</td>
                        <td>{r.damaged}</td>
                        <td>{r.minStock}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>
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
          <FormField label="Showroom *" htmlFor="inw-showroom">
            <select
              id="inw-showroom"
              value={form.showroom}
              onChange={(e) => setForm({ ...form, showroom: e.target.value })}
              required
            >
              <option value="">Select showroom</option>
              {showrooms.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name} ({s.code})
                </option>
              ))}
            </select>
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
