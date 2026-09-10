// Orders page. List with lifecycle status + next-step actions, and a create modal
// (customer + showroom + one product line to keep it focused).
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader, Card, Button, Spinner, Modal, FormField, ExportButton } from "../../../components";
import { usePermissions } from "../../../app/store/permissionStore";
import { useCustomers } from "../../customers/hooks/useCustomers";
import { useProducts } from "../../products/hooks/useProducts";
import { useShowrooms } from "../../showrooms/hooks/useShowrooms";
import { useOrders, useCreateOrder, useOrderStatus } from "../hooks/useOrders";

const EXPORT_COLUMNS = [
  { header: "Order #", value: (r) => r.number },
  { header: "Channel", value: (r) => r.channel || "showroom" },
  { header: "Customer", value: (r) => r.customer?.name || "" },
  { header: "Showroom", value: (r) => r.showroom?.code || "" },
  { header: "Total", value: (r) => r.grandTotal },
  { header: "Payment", value: (r) => r.paymentStatus },
  { header: "Status", value: (r) => r.status },
];

const CHANNEL_LABEL = { website: "Website", mobile: "Mobile App", showroom: "Showroom" };

const NEXT_ACTIONS = {
  new: [
    { action: "confirm", label: "Confirm", variant: "primary" },
    { action: "cancel", label: "Cancel", variant: "secondary" },
  ],
  confirmed: [
    { action: "process", label: "Process", variant: "primary" },
    { action: "cancel", label: "Cancel", variant: "secondary" },
  ],
  processing: [{ action: "dispatch", label: "Dispatch", variant: "primary" }],
  dispatched: [{ action: "deliver", label: "Deliver", variant: "primary" }],
  delivered: [],
  cancelled: [],
};

const inr = (n) => (typeof n === "number" ? `₹${n.toLocaleString("en-IN")}` : "—");

export function OrdersPage() {
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const [channelFilter, setChannelFilter] = useState("");
  const { data: orders = [], isLoading, isError } = useOrders(channelFilter ? { channel: channelFilter } : {});
  const { data: customers = [] } = useCustomers();
  const { data: products = [] } = useProducts();
  const { data: showrooms = [] } = useShowrooms({ type: "showroom" });

  const createOrder = useCreateOrder();
  const orderStatus = useOrderStatus();

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ customer: "", showroom: "", product: "", quantity: 1 });
  const [error, setError] = useState("");

  async function handleCreate(e) {
    e.preventDefault();
    setError("");
    const p = products.find((x) => x._id === form.product);
    try {
      await createOrder.mutateAsync({
        customer: form.customer,
        showroom: form.showroom,
        items: [
          {
            product: form.product,
            name: p?.name,
            quantity: Number(form.quantity) || 1,
            price: p?.sellingPrice || 0,
            discount: p?.discount || 0,
            gst: p?.gst || 0,
          },
        ],
      });
      setForm({ customer: "", showroom: "", product: "", quantity: 1 });
      setOpen(false);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create order.");
    }
  }

  async function doAction(id, action) {
    try {
      await orderStatus.mutateAsync({ id, action });
    } catch (err) {
      alert(err.response?.data?.message || "Action failed.");
    }
  }

  return (
    <div>
      <PageHeader
        title="Orders"
        subtitle="Sales orders and fulfilment"
        actions={
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <select
              value={channelFilter}
              onChange={(e) => setChannelFilter(e.target.value)}
              style={{ padding: "8px 10px", border: "1px solid var(--color-border)", borderRadius: 8 }}
            >
              <option value="">All channels</option>
              <option value="website">Website</option>
              <option value="showroom">Showroom</option>
              <option value="mobile">Mobile App</option>
            </select>
            <ExportButton rows={orders} columns={EXPORT_COLUMNS} filename="orders.csv" />
            {hasPermission("orders.create") && <Button onClick={() => setOpen(true)}>+ New Order</Button>}
          </div>
        }
      />

      {isLoading ? (
        <Spinner />
      ) : isError ? (
        <p style={{ color: "var(--color-danger)" }}>Failed to load orders. Is the API running?</p>
      ) : (
        <Card>
          <div className="data-table__wrap" style={{ border: "none" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Channel</th>
                  <th>Customer</th>
                  <th>Showroom</th>
                  <th>Total</th>
                  <th>Payment</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 ? (
                  <tr><td className="data-table__empty" colSpan={8}>No orders yet.</td></tr>
                ) : (
                  orders.map((o) => (
                    <tr key={o._id}>
                      <td>
                        <a
                          onClick={() => navigate(`/orders/${o._id}`)}
                          style={{ color: "var(--brand-gold-dark)", cursor: "pointer", fontWeight: 600 }}
                        >
                          {o.number}
                        </a>
                      </td>
                      <td>
                        <span className={`order-channel order-channel--${o.channel || "showroom"}`}>
                          {CHANNEL_LABEL[o.channel] || "Showroom"}
                        </span>
                      </td>
                      <td>{o.customer?.name || "—"}</td>
                      <td>{o.showroom?.code || "—"}</td>
                      <td>{inr(o.grandTotal)}</td>
                      <td><span className={`badge badge--${o.paymentStatus === "paid" ? "active" : "inactive"}`}>{o.paymentStatus}</span></td>
                      <td><span className={`transfer-status transfer-status--${o.status === "delivered" ? "received" : o.status === "cancelled" ? "cancelled" : o.status === "new" ? "requested" : "approved"}`}>{o.status}</span></td>
                      <td>
                        <div style={{ display: "flex", gap: 6 }}>
                          {hasPermission("orders.edit") &&
                            (NEXT_ACTIONS[o.status] || []).map((a) => (
                              <Button key={a.action} variant={a.variant} onClick={() => doAction(o._id, a.action)} disabled={orderStatus.isPending}>
                                {a.label}
                              </Button>
                            ))}
                          {(NEXT_ACTIONS[o.status] || []).length === 0 && "—"}
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
        title="New Order"
        onClose={() => setOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={createOrder.isPending}>
              {createOrder.isPending ? "Creating..." : "Create Order"}
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreate}>
          <FormField label="Customer *" htmlFor="o-customer">
            <select id="o-customer" value={form.customer} onChange={(e) => setForm({ ...form, customer: e.target.value })} required>
              <option value="">Select customer</option>
              {customers.map((c) => <option key={c._id} value={c._id}>{c.name} ({c.mobile})</option>)}
            </select>
          </FormField>
          <FormField label="Showroom *" htmlFor="o-showroom">
            <select id="o-showroom" value={form.showroom} onChange={(e) => setForm({ ...form, showroom: e.target.value })} required>
              <option value="">Select showroom</option>
              {showrooms.map((s) => <option key={s._id} value={s._id}>{s.name} ({s.code})</option>)}
            </select>
          </FormField>
          <FormField label="Product *" htmlFor="o-product">
            <select id="o-product" value={form.product} onChange={(e) => setForm({ ...form, product: e.target.value })} required>
              <option value="">Select product</option>
              {products.map((p) => <option key={p._id} value={p._id}>{p.name} ({p.sku})</option>)}
            </select>
          </FormField>
          <FormField label="Quantity *" htmlFor="o-qty">
            <input id="o-qty" type="number" min="1" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} required />
          </FormField>
          {error && <p style={{ color: "var(--color-danger)" }}>{error}</p>}
        </form>
      </Modal>
    </div>
  );
}

export default OrdersPage;
