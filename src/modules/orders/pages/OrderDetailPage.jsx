// Order Detail page - the interlink hub. Shows the order with tabs:
//   Items / Payments / Delivery / Timeline
// and lets you drive status, record a payment, and schedule a delivery in-context.
import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { PageHeader, Card, Tabs, Button, Spinner, Modal, FormField, DataTable } from "../../../components";
import { usePermissions } from "../../../app/store/permissionStore";
import { useOrder, useOrderStatus, useOrderReturns, useCreateReturn, useReturnAction } from "../hooks/useOrders";
import { useRecordPayment } from "../../payments/hooks/usePayments";
import { useCreateDelivery } from "../../deliveries/hooks/useDeliveries";
import { useQueryClient } from "@tanstack/react-query";

const inr = (n) => `₹${(Number(n) || 0).toLocaleString("en-IN")}`;
const MODES = ["cash", "card", "upi", "netbanking", "cheque", "other"];

const NEXT_ACTIONS = {
  new: [{ action: "confirm", label: "Confirm" }, { action: "cancel", label: "Cancel", variant: "secondary" }],
  confirmed: [{ action: "process", label: "Process" }, { action: "cancel", label: "Cancel", variant: "secondary" }],
  processing: [{ action: "dispatch", label: "Dispatch" }],
  dispatched: [{ action: "deliver", label: "Deliver" }],
  delivered: [],
  cancelled: [],
};

const TABS = [
  { key: "items", label: "Items" },
  { key: "payments", label: "Payments" },
  { key: "delivery", label: "Delivery" },
  { key: "returns", label: "Returns" },
  { key: "timeline", label: "Timeline" },
];

const RETURN_ACTIONS = {
  requested: [
    { action: "approve", label: "Approve" },
    { action: "reject", label: "Reject", variant: "secondary" },
  ],
  approved: [{ action: "refund", label: "Refund" }],
  rejected: [],
  refunded: [],
};

export function OrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { hasPermission } = usePermissions();
  const { data, isLoading, isError } = useOrder(id);

  const orderStatus = useOrderStatus();
  const recordPayment = useRecordPayment();
  const createDelivery = useCreateDelivery();
  const { data: returns = [] } = useOrderReturns(id);
  const createReturn = useCreateReturn();
  const returnAction = useReturnAction();

  const [tab, setTab] = useState("items");
  const [payOpen, setPayOpen] = useState(false);
  const [delOpen, setDelOpen] = useState(false);
  const [retOpen, setRetOpen] = useState(false);
  const [payForm, setPayForm] = useState({ amount: "", mode: "cash", reference: "" });
  const [delForm, setDelForm] = useState({ scheduledDate: "", address: "" });
  const [retForm, setRetForm] = useState({ reason: "", refundAmount: "" });

  function refresh() {
    qc.invalidateQueries({ queryKey: ["orders", id] });
    qc.invalidateQueries({ queryKey: ["returns", { order: id }] });
  }

  if (isLoading) return <Spinner />;
  if (isError || !data?.item) {
    return (
      <div>
        <p style={{ color: "var(--color-danger)" }}>Order not found.</p>
        <Button variant="secondary" onClick={() => navigate("/orders")}>Back to Orders</Button>
      </div>
    );
  }

  const o = data.item;
  const payments = data.related?.payments || [];
  const deliveries = data.related?.deliveries || [];
  const balance = Math.max((o.grandTotal || 0) - (o.amountPaid || 0), 0);

  async function doStatus(action) {
    try {
      await orderStatus.mutateAsync({ id, action });
      refresh();
    } catch (err) {
      alert(err.response?.data?.message || "Action failed.");
    }
  }

  async function submitPayment(e) {
    e.preventDefault();
    try {
      await recordPayment.mutateAsync({ order: id, amount: Number(payForm.amount), mode: payForm.mode, reference: payForm.reference });
      setPayForm({ amount: "", mode: "cash", reference: "" });
      setPayOpen(false);
      refresh();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to record payment.");
    }
  }

  async function submitDelivery(e) {
    e.preventDefault();
    try {
      await createDelivery.mutateAsync({ order: id, scheduledDate: delForm.scheduledDate || undefined, address: delForm.address || undefined });
      setDelForm({ scheduledDate: "", address: "" });
      setDelOpen(false);
      refresh();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to schedule delivery.");
    }
  }

  async function submitReturn(e) {
    e.preventDefault();
    try {
      await createReturn.mutateAsync({ order: id, reason: retForm.reason, refundAmount: Number(retForm.refundAmount) || 0 });
      setRetForm({ reason: "", refundAmount: "" });
      setRetOpen(false);
      refresh();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to create return.");
    }
  }

  async function doReturnAction(returnId, action) {
    try {
      await returnAction.mutateAsync({ id: returnId, action });
      refresh();
    } catch (err) {
      alert(err.response?.data?.message || "Action failed.");
    }
  }

  return (
    <div>
      <PageHeader
        title={<span className="detail-header__meta">{o.number}<span className={`transfer-status transfer-status--${o.status === "delivered" ? "received" : o.status === "cancelled" ? "cancelled" : o.status === "new" ? "requested" : "approved"}`}>{o.status}</span></span>}
        subtitle={
          <>
            Customer:{" "}
            <a onClick={() => navigate(`/customers/${o.customer?._id}`)} style={{ color: "var(--brand-gold-dark)", cursor: "pointer" }}>
              {o.customer?.name}
            </a>
            {o.showroom ? ` · ${o.showroom.code}` : ""}
          </>
        }
        actions={
          <div style={{ display: "flex", gap: 8 }}>
            <Button variant="secondary" onClick={() => navigate("/orders")}>Back</Button>
            {hasPermission("orders.edit") &&
              (NEXT_ACTIONS[o.status] || []).map((a) => (
                <Button key={a.action} variant={a.variant} onClick={() => doStatus(a.action)} disabled={orderStatus.isPending}>
                  {a.label}
                </Button>
              ))}
          </div>
        }
      />

      {/* Summary stat row */}
      <div className="detail-stats" style={{ marginBottom: 20 }}>
        <div className="detail-stat"><div className="detail-stat__label">Grand Total</div><div className="detail-stat__value">{inr(o.grandTotal)}</div></div>
        <div className="detail-stat"><div className="detail-stat__label">Paid</div><div className="detail-stat__value">{inr(o.amountPaid)}</div></div>
        <div className="detail-stat"><div className="detail-stat__label">Balance</div><div className="detail-stat__value">{inr(balance)}</div></div>
        <div className="detail-stat"><div className="detail-stat__label">Payment</div><div className="detail-stat__value" style={{ textTransform: "capitalize" }}>{o.paymentStatus}</div></div>
      </div>

      <Tabs tabs={TABS} active={tab} onChange={setTab} />

      <Card>
        {tab === "items" && (
          <DataTable
            columns={[
              { key: "name", header: "Product", render: (r) => r.name || r.product?.name || "—" },
              { key: "quantity", header: "Qty" },
              { key: "price", header: "Price", render: (r) => inr(r.price) },
              { key: "discount", header: "Discount", render: (r) => inr(r.discount) },
              { key: "gst", header: "GST %", render: (r) => r.gst },
            ]}
            rows={o.items || []}
            emptyText="No items."
          />
        )}

        {tab === "payments" && (
          <div>
            <div style={{ marginBottom: 12, display: "flex", justifyContent: "flex-end" }}>
              {hasPermission("payments.create") && balance > 0 && (
                <Button onClick={() => setPayOpen(true)}>+ Record Payment</Button>
              )}
            </div>
            <DataTable
              columns={[
                { key: "createdAt", header: "Date", render: (r) => new Date(r.createdAt).toLocaleString() },
                { key: "amount", header: "Amount", render: (r) => inr(r.amount) },
                { key: "mode", header: "Mode" },
                { key: "reference", header: "Reference", render: (r) => r.reference || "—" },
                { key: "status", header: "Status" },
              ]}
              rows={payments}
              emptyText="No payments recorded."
            />
          </div>
        )}

        {tab === "delivery" && (
          <div>
            <div style={{ marginBottom: 12, display: "flex", justifyContent: "flex-end" }}>
              {hasPermission("deliveries.create") && (
                <Button onClick={() => setDelOpen(true)}>+ Schedule Delivery</Button>
              )}
            </div>
            <DataTable
              columns={[
                { key: "scheduledDate", header: "Scheduled", render: (r) => r.scheduledDate ? new Date(r.scheduledDate).toLocaleDateString() : "—" },
                { key: "address", header: "Address", render: (r) => r.address || "—" },
                { key: "status", header: "Status" },
              ]}
              rows={deliveries}
              emptyText="No delivery scheduled."
            />
          </div>
        )}

        {tab === "returns" && (
          <div>
            <div style={{ marginBottom: 12, display: "flex", justifyContent: "flex-end" }}>
              {hasPermission("orders.create") && o.status === "delivered" && (
                <Button onClick={() => setRetOpen(true)}>+ Create Return</Button>
              )}
            </div>
            {o.status !== "delivered" && returns.length === 0 && (
              <p className="tab-empty">Returns can be created once the order is delivered.</p>
            )}
            <table className="data-table">
              <thead>
                <tr><th>Return #</th><th>Reason</th><th>Refund</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {returns.length === 0 ? (
                  <tr><td className="data-table__empty" colSpan={5}>No returns.</td></tr>
                ) : (
                  returns.map((r) => (
                    <tr key={r._id}>
                      <td>{r.number}</td>
                      <td>{r.reason || "—"}</td>
                      <td>{inr(r.refundAmount)}</td>
                      <td><span className={`transfer-status transfer-status--${r.status === "refunded" ? "received" : r.status === "rejected" ? "rejected" : r.status === "approved" ? "approved" : "requested"}`}>{r.status}</span></td>
                      <td>
                        <div style={{ display: "flex", gap: 6 }}>
                          {hasPermission("orders.edit") && (RETURN_ACTIONS[r.status] || []).map((a) => (
                            <Button key={a.action} variant={a.variant} onClick={() => doReturnAction(r._id, a.action)} disabled={returnAction.isPending}>{a.label}</Button>
                          ))}
                          {(RETURN_ACTIONS[r.status] || []).length === 0 && "—"}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {tab === "timeline" && (
          <div className="timeline">
            <div className="timeline__item"><strong>Order created</strong><span>{new Date(o.createdAt).toLocaleString()}</span></div>
            <div className="timeline__item"><strong>Current status: {o.status}</strong><span>Updated {new Date(o.updatedAt).toLocaleString()}</span></div>
            <div className="timeline__item"><strong>Payment: {o.paymentStatus}</strong><span>{inr(o.amountPaid)} of {inr(o.grandTotal)}</span></div>
            {o.stockAllocated && <div className="timeline__item"><strong>Stock allocated</strong><span>Reserved at {o.showroom?.code}</span></div>}
          </div>
        )}
      </Card>

      {/* Record Payment modal */}
      <Modal
        open={payOpen}
        title="Record Payment"
        onClose={() => setPayOpen(false)}
        footer={<><Button variant="secondary" onClick={() => setPayOpen(false)}>Cancel</Button><Button onClick={submitPayment} disabled={recordPayment.isPending}>{recordPayment.isPending ? "Saving..." : "Record"}</Button></>}
      >
        <form onSubmit={submitPayment}>
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.85rem" }}>Balance due: {inr(balance)}</p>
          <FormField label="Amount *" htmlFor="pd-amount">
            <input id="pd-amount" type="number" min="1" value={payForm.amount} onChange={(e) => setPayForm({ ...payForm, amount: e.target.value })} required />
          </FormField>
          <FormField label="Mode" htmlFor="pd-mode">
            <select id="pd-mode" value={payForm.mode} onChange={(e) => setPayForm({ ...payForm, mode: e.target.value })}>
              {MODES.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </FormField>
          <FormField label="Reference" htmlFor="pd-ref">
            <input id="pd-ref" value={payForm.reference} onChange={(e) => setPayForm({ ...payForm, reference: e.target.value })} />
          </FormField>
        </form>
      </Modal>

      {/* Schedule Delivery modal */}
      <Modal
        open={delOpen}
        title="Schedule Delivery"
        onClose={() => setDelOpen(false)}
        footer={<><Button variant="secondary" onClick={() => setDelOpen(false)}>Cancel</Button><Button onClick={submitDelivery} disabled={createDelivery.isPending}>{createDelivery.isPending ? "Saving..." : "Schedule"}</Button></>}
      >
        <form onSubmit={submitDelivery}>
          <FormField label="Scheduled Date" htmlFor="dd-date">
            <input id="dd-date" type="date" value={delForm.scheduledDate} onChange={(e) => setDelForm({ ...delForm, scheduledDate: e.target.value })} />
          </FormField>
          <FormField label="Address" htmlFor="dd-address">
            <input id="dd-address" value={delForm.address} onChange={(e) => setDelForm({ ...delForm, address: e.target.value })} />
          </FormField>
        </form>
      </Modal>

      {/* Create Return modal */}
      <Modal
        open={retOpen}
        title="Create Return"
        onClose={() => setRetOpen(false)}
        footer={<><Button variant="secondary" onClick={() => setRetOpen(false)}>Cancel</Button><Button onClick={submitReturn} disabled={createReturn.isPending}>{createReturn.isPending ? "Saving..." : "Create Return"}</Button></>}
      >
        <form onSubmit={submitReturn}>
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.85rem" }}>
            All items of {o.number} will be returned to stock on approval.
          </p>
          <FormField label="Reason" htmlFor="rd-reason">
            <input id="rd-reason" value={retForm.reason} onChange={(e) => setRetForm({ ...retForm, reason: e.target.value })} placeholder="Damaged / wrong item / etc." />
          </FormField>
          <FormField label="Refund Amount (₹)" htmlFor="rd-refund">
            <input id="rd-refund" type="number" min="0" value={retForm.refundAmount} onChange={(e) => setRetForm({ ...retForm, refundAmount: e.target.value })} />
          </FormField>
        </form>
      </Modal>
    </div>
  );
}

export default OrderDetailPage;
