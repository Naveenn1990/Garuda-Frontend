// Stock Transfers — list all transfers with status, workflow actions, and a
// create modal that supports multiple product lines per transfer.
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiPlus, FiTrash2, FiArrowRight, FiEye } from "react-icons/fi";
import { PageHeader, Card, Button, Spinner, Modal, FormField } from "../../../components";
import { usePermissions } from "../../../app/store/permissionStore";
import { useShowrooms } from "../../showrooms/hooks/useShowrooms";
import { useProducts } from "../../products/hooks/useProducts";
import { useTransfers, useCreateTransfer, useTransferAction } from "../hooks/useTransfers";

// Status badge colours
const STATUS_STYLE = {
  requested:  { background: "#fff3cd", color: "#856404" },
  approved:   { background: "#cce5ff", color: "#004085" },
  dispatched: { background: "#d1ecf1", color: "#0c5460" },
  received:   { background: "#d4edda", color: "#155724" },
  cancelled:  { background: "#f8d7da", color: "#721c24" },
  rejected:   { background: "#f8d7da", color: "#721c24" },
};

const NEXT_ACTIONS = {
  requested:  [{ action: "approve",  label: "Approve",  variant: "primary" },
               { action: "reject",   label: "Reject",   variant: "secondary" }],
  approved:   [{ action: "dispatch", label: "Dispatch", variant: "primary" },
               { action: "cancel",   label: "Cancel",   variant: "secondary" }],
  dispatched: [{ action: "receive",  label: "Received", variant: "primary" }],
  received:   [],
  cancelled:  [],
  rejected:   [],
};

const emptyItem = { product: "", quantity: "" };

export function TransfersPage() {
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const { data: allLocations = [] }  = useShowrooms();
  const { data: showroomsOnly = [] } = useShowrooms({ type: "showroom" });
  const { data: products = [] }      = useProducts();
  const { data: rows = [], isLoading, isError } = useTransfers();

  const createTransfer = useCreateTransfer();
  const transferAction = useTransferAction();
  const canTransfer    = hasPermission("inventory.transfer");

  // ── Create modal state ─────────────────────────────────────────────────────
  const [open, setOpen]   = useState(false);
  const [from, setFrom]   = useState("");
  const [to, setTo]       = useState("");
  const [note, setNote]   = useState("");
  const [items, setItems] = useState([{ ...emptyItem }]);
  const [error, setError] = useState("");

  const locLabel = (s) =>
    `${s.type === "warehouse" ? "🏭 " : "🏪 "}${s.name} (${s.code})`;

  function addItem()         { setItems((p) => [...p, { ...emptyItem }]); }
  function removeItem(i)     { setItems((p) => p.filter((_, idx) => idx !== i)); }
  function setItem(i, field) {
    return (e) =>
      setItems((p) => p.map((r, idx) => idx === i ? { ...r, [field]: e.target.value } : r));
  }

  function resetForm() {
    setFrom(""); setTo(""); setNote("");
    setItems([{ ...emptyItem }]); setError("");
  }

  async function handleCreate(e) {
    e.preventDefault();
    setError("");
    const validItems = items.filter((r) => r.product && Number(r.quantity) > 0);
    if (!validItems.length) return setError("Add at least one product with quantity.");
    try {
      await createTransfer.mutateAsync({
        fromShowroom: from,
        toShowroom:   to,
        items: validItems.map((r) => ({ product: r.product, quantity: Number(r.quantity) })),
        note,
      });
      resetForm();
      setOpen(false);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create transfer.");
    }
  }

  async function doAction(id, action) {
    if (!window.confirm(`${action.charAt(0).toUpperCase() + action.slice(1)} this transfer?`))
      return;
    try {
      await transferAction.mutateAsync({ id, action });
    } catch (err) {
      alert(err.response?.data?.message || "Action failed.");
    }
  }

  return (
    <div>
      <PageHeader
        title="Stock Transfers"
        subtitle="Move stock between warehouses and showrooms with an approval workflow"
        actions={
          canTransfer && (
            <Button onClick={() => { resetForm(); setOpen(true); }}>
              <FiPlus /> New Transfer
            </Button>
          )
        }
      />

      {isLoading ? (
        <Spinner />
      ) : isError ? (
        <p style={{ color: "var(--color-danger)" }}>Failed to load transfers.</p>
      ) : (
        <Card>
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>From</th>
                <th></th>
                <th>To</th>
                <th>Products</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td className="data-table__empty" colSpan={7}>
                    No transfers yet. Create one to move stock from a warehouse to a showroom.
                  </td>
                </tr>
              ) : (
                rows.map((t) => (
                  <tr key={t._id}>
                    <td style={{ whiteSpace: "nowrap", fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
                      {new Date(t.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{t.fromShowroom?.name || "—"}</div>
                      <div style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>
                        {t.fromShowroom?.type === "warehouse" ? "🏭 Warehouse" : "🏪 Showroom"}
                      </div>
                    </td>
                    <td style={{ color: "var(--color-text-muted)" }}>
                      <FiArrowRight />
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{t.toShowroom?.name || "—"}</div>
                      <div style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>🏪 Showroom</div>
                    </td>
                    <td>
                      {(t.items || []).map((it, i) => (
                        <div key={i} style={{ fontSize: "0.85rem" }}>
                          {it.product?.name || it.product?.sku || "?"} × {it.quantity}
                        </div>
                      ))}
                    </td>
                    <td>
                      <span style={{
                        ...STATUS_STYLE[t.status],
                        padding: "3px 10px",
                        borderRadius: 999,
                        fontSize: "0.8rem",
                        fontWeight: 600,
                        textTransform: "capitalize",
                      }}>
                        {t.status}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        <Button
                          variant="secondary"
                          onClick={() => navigate(`/transfers/${t._id}`)}>
                          <FiEye /> View
                        </Button>
                        {canTransfer &&
                          (NEXT_ACTIONS[t.status] || []).map((a) => (
                            <Button
                              key={a.action}
                              variant={a.variant}
                              onClick={() => doAction(t._id, a.action)}
                              disabled={transferAction.isPending}>
                              {a.label}
                            </Button>
                          ))}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </Card>
      )}

      {/* ── Create Transfer Modal ── */}
      <Modal
        open={open}
        title="New Stock Transfer"
        onClose={() => setOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={createTransfer.isPending}>
              {createTransfer.isPending ? "Creating…" : "Create Transfer"}
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreate}>
          <div className="form-grid">
            <FormField label="From (Warehouse / Showroom) *" htmlFor="t-from">
              <select
                id="t-from"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                required>
                <option value="">Select source</option>
                {allLocations.map((s) => (
                  <option key={s._id} value={s._id}>{locLabel(s)}</option>
                ))}
              </select>
            </FormField>
            <FormField label="To Showroom *" htmlFor="t-to">
              <select
                id="t-to"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                required>
                <option value="">Select destination</option>
                {showroomsOnly.map((s) => (
                  <option key={s._id} value={s._id}>🏪 {s.name} ({s.code})</option>
                ))}
              </select>
            </FormField>
          </div>

          {/* Product lines */}
          <div className="form-section__title" style={{ marginTop: 16 }}>Products</div>
          {items.map((item, i) => (
            <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-end", marginBottom: 8 }}>
              <FormField label={i === 0 ? "Product *" : ""} htmlFor={`t-p-${i}`} style={{ flex: 2 }}>
                <select
                  id={`t-p-${i}`}
                  value={item.product}
                  onChange={setItem(i, "product")}
                  required>
                  <option value="">Select product</option>
                  {products.map((p) => (
                    <option key={p._id} value={p._id}>{p.name} ({p.sku})</option>
                  ))}
                </select>
              </FormField>
              <FormField label={i === 0 ? "Qty *" : ""} htmlFor={`t-q-${i}`} style={{ flex: "0 0 90px" }}>
                <input
                  id={`t-q-${i}`}
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={setItem(i, "quantity")}
                  required
                />
              </FormField>
              {items.length > 1 && (
                <button
                  type="button"
                  style={{ marginBottom: 4, background: "none", border: "none", cursor: "pointer", color: "var(--color-danger)" }}
                  onClick={() => removeItem(i)}>
                  <FiTrash2 />
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            className="btn btn--secondary"
            style={{ fontSize: "0.85rem", marginBottom: 12 }}
            onClick={addItem}>
            + Add Another Product
          </button>

          <FormField label="Note (optional)" htmlFor="t-note">
            <input
              id="t-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Monthly restocking"
            />
          </FormField>

          {error && <p style={{ color: "var(--color-danger)", marginTop: 8 }}>{error}</p>}
        </form>
      </Modal>
    </div>
  );
}

export default TransfersPage;
