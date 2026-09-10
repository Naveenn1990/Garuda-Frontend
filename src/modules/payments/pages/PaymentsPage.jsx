// Payments page. List recorded payments + a modal to record a payment against an order.
import { useState } from "react";
import { PageHeader, DataTable, Button, Spinner, Modal, FormField, ExportButton } from "../../../components";
import { usePermissions } from "../../../app/store/permissionStore";
import { useOrders } from "../../orders/hooks/useOrders";
import { usePayments, useRecordPayment } from "../hooks/usePayments";

const MODES = ["cash", "card", "upi", "netbanking", "cheque", "other"];
const inr = (n) => (typeof n === "number" ? `₹${n.toLocaleString("en-IN")}` : "—");

const EXPORT_COLUMNS = [
  { header: "Date", value: (r) => new Date(r.createdAt).toLocaleDateString() },
  { header: "Order", value: (r) => r.order?.number || "" },
  { header: "Customer", value: (r) => r.customer?.name || "" },
  { header: "Amount", value: (r) => r.amount },
  { header: "Mode", value: (r) => r.mode },
  { header: "Status", value: (r) => r.status },
];

export function PaymentsPage() {
  const { hasPermission } = usePermissions();
  const { data: rows = [], isLoading, isError } = usePayments();
  const { data: orders = [] } = useOrders();
  const recordPayment = useRecordPayment();

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ order: "", amount: "", mode: "cash", reference: "" });
  const [error, setError] = useState("");

  const columns = [
    { key: "createdAt", header: "Date", render: (r) => new Date(r.createdAt).toLocaleDateString() },
    { key: "order", header: "Order", render: (r) => r.order?.number || "—" },
    { key: "customer", header: "Customer", render: (r) => r.customer?.name || "—" },
    { key: "amount", header: "Amount", render: (r) => inr(r.amount) },
    { key: "mode", header: "Mode", render: (r) => r.mode },
    { key: "status", header: "Status", render: (r) => <span className={`badge badge--${r.status === "success" ? "active" : "inactive"}`}>{r.status}</span> },
  ];

  async function handleRecord(e) {
    e.preventDefault();
    setError("");
    try {
      await recordPayment.mutateAsync({ ...form, amount: Number(form.amount) });
      setForm({ order: "", amount: "", mode: "cash", reference: "" });
      setOpen(false);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to record payment.");
    }
  }

  return (
    <div>
      <PageHeader
        title="Payments"
        subtitle="Payments recorded against orders"
        actions={
          <div style={{ display: "flex", gap: 8 }}>
            <ExportButton rows={rows} columns={EXPORT_COLUMNS} filename="payments.csv" />
            {hasPermission("payments.create") && <Button onClick={() => setOpen(true)}>+ Record Payment</Button>}
          </div>
        }
      />

      {isLoading ? (
        <Spinner />
      ) : isError ? (
        <p style={{ color: "var(--color-danger)" }}>Failed to load payments. Is the API running?</p>
      ) : (
        <DataTable columns={columns} rows={rows} emptyText="No payments yet." />
      )}

      <Modal
        open={open}
        title="Record Payment"
        onClose={() => setOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleRecord} disabled={recordPayment.isPending}>
              {recordPayment.isPending ? "Saving..." : "Record"}
            </Button>
          </>
        }
      >
        <form onSubmit={handleRecord}>
          <FormField label="Order *" htmlFor="p-order">
            <select id="p-order" value={form.order} onChange={(e) => setForm({ ...form, order: e.target.value })} required>
              <option value="">Select order</option>
              {orders.map((o) => (
                <option key={o._id} value={o._id}>
                  {o.number} — {o.customer?.name} ({inr(o.grandTotal)})
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Amount *" htmlFor="p-amount">
            <input id="p-amount" type="number" min="1" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
          </FormField>
          <FormField label="Mode" htmlFor="p-mode">
            <select id="p-mode" value={form.mode} onChange={(e) => setForm({ ...form, mode: e.target.value })}>
              {MODES.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </FormField>
          <FormField label="Reference" htmlFor="p-ref">
            <input id="p-ref" value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} placeholder="Txn ID / cheque no" />
          </FormField>
          {error && <p style={{ color: "var(--color-danger)" }}>{error}</p>}
        </form>
      </Modal>
    </div>
  );
}

export default PaymentsPage;
