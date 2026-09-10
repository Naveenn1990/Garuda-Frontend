// Stock Transfers. List transfers with their status and the next available workflow
// action (approve/dispatch/receive/cancel), plus a create modal.
import { useState } from "react";
import { PageHeader, Card, Button, Spinner, Modal, FormField } from "../../../components";
import { usePermissions } from "../../../app/store/permissionStore";
import { useShowrooms } from "../../showrooms/hooks/useShowrooms";
import { useProducts } from "../../products/hooks/useProducts";
import { useTransfers, useCreateTransfer, useTransferAction } from "../hooks/useTransfers";



const NEXT_ACTIONS = {
  requested: [
    { action: "approve", label: "Approve", variant: "primary" },
    { action: "reject", label: "Reject", variant: "secondary" },
  ],
  approved: [
    { action: "dispatch", label: "Dispatch", variant: "primary" },
    { action: "cancel", label: "Cancel", variant: "secondary" },
  ],
  dispatched: [{ action: "receive", label: "Receive", variant: "primary" }],
  received: [],
  cancelled: [],
  rejected: [],
};
export function TransfersPage() {
  const { hasPermission } = usePermissions();
  // Source can be any location (warehouse or showroom); destination is a showroom.
  const { data: allLocations = [] } = useShowrooms();
  const { data: showroomsOnly = [] } = useShowrooms({ type: "showroom" });
  const { data: products = [] } = useProducts();

  // Label helper so warehouses are distinguishable in the dropdowns.
  const locLabel = (s) =>
    `${s.type === "warehouse" ? "🏭 " : ""}${s.name} (${s.code})`;
  const { data: rows = [], isLoading, isError } = useTransfers();
  const createTransfer = useCreateTransfer();
  const transferAction = useTransferAction();

  const canTransfer = hasPermission("inventory.transfer");

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ fromShowroom: "", toShowroom: "", product: "", quantity: "" });
  const [error, setError] = useState("");

  async function handleCreate(e) {
    e.preventDefault();
    setError("");
    try {
      await createTransfer.mutateAsync({
        fromShowroom: form.fromShowroom,
        toShowroom: form.toShowroom,
        items: [{ product: form.product, quantity: Number(form.quantity) }],
      });
      setForm({ fromShowroom: "", toShowroom: "", product: "", quantity: "" });
      setOpen(false);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create transfer.");
    }
  }

  async function doAction(id, action) {
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
        subtitle="Move stock from warehouses/showrooms to showrooms, with approval"
        actions={
          canTransfer && <Button onClick={() => setOpen(true)}>+ New Transfer</Button>
        }
      />

      {isLoading ? (
        <Spinner />
      ) : isError ? (
        <p style={{ color: "var(--color-danger)" }}>Failed to load transfers. Is the API running?</p>
      ) : (
        <Card>
          <div className="data-table__wrap" style={{ border: "none" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>From</th>
                  <th>To</th>
                  <th>Items</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td className="data-table__empty" colSpan={5}>No transfers yet.</td>
                  </tr>
                ) : (
                  rows.map((t) => (
                    <tr key={t._id}>
                      <td>{t.fromShowroom?.code || "—"}</td>
                      <td>{t.toShowroom?.code || "—"}</td>
                      <td>
                        {t.items
                          ?.map((i) => `${i.product?.sku || "?"} ×${i.quantity}`)
                          .join(", ")}
                      </td>
                      <td>
                        <span className={`transfer-status transfer-status--${t.status}`}>
                          {t.status}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: 6 }}>
                          {canTransfer &&
                            (NEXT_ACTIONS[t.status] || []).map((a) => (
                              <Button
                                key={a.action}
                                variant={a.variant}
                                onClick={() => doAction(t._id, a.action)}
                                disabled={transferAction.isPending}
                              >
                                {a.label}
                              </Button>
                            ))}
                          {(NEXT_ACTIONS[t.status] || []).length === 0 && "—"}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}
      <Modal
        open={open}
        title="New Stock Transfer"
        onClose={() => setOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={createTransfer.isPending}>
              {createTransfer.isPending ? "Creating..." : "Create Transfer"}
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreate}>
          <FormField label="From (Warehouse or Showroom) *" htmlFor="t-from">
            <select
              id="t-from"
              value={form.fromShowroom}
              onChange={(e) => setForm({ ...form, fromShowroom: e.target.value })}
              required
            >
              <option value="">Select source</option>
              {allLocations.map((s) => (
                <option key={s._id} value={s._id}>{locLabel(s)}</option>
              ))}
            </select>
          </FormField>
          <FormField label="To Showroom *" htmlFor="t-to">
            <select
              id="t-to"
              value={form.toShowroom}
              onChange={(e) => setForm({ ...form, toShowroom: e.target.value })}
              required
            >
              <option value="">Select destination</option>
              {showroomsOnly.map((s) => (
                <option key={s._id} value={s._id}>{s.name} ({s.code})</option>
              ))}
            </select>
          </FormField>
          <FormField label="Product *" htmlFor="t-product">
            <select
              id="t-product"
              value={form.product}
              onChange={(e) => setForm({ ...form, product: e.target.value })}
              required
            >
              <option value="">Select product</option>
              {products.map((p) => (
                <option key={p._id} value={p._id}>{p.name} ({p.sku})</option>
              ))}
            </select>
          </FormField>
          <FormField label="Quantity *" htmlFor="t-qty">
            <input
              id="t-qty"
              type="number"
              min="1"
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: e.target.value })}
              required
            />
          </FormField>
          {error && <p style={{ color: "var(--color-danger)" }}>{error}</p>}
        </form>
      </Modal>
    </div>
  );
}
export default TransfersPage;
