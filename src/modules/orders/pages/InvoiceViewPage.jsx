// Full-page Sales Invoice view (myBillBook-style). Shows the printable GST tax
// invoice centred on the page with Download / Print / Record Payment actions and a
// payment-history side panel. All company/store branding is pulled dynamically.
import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FiArrowLeft, FiDownload, FiPrinter, FiDollarSign, FiX } from "react-icons/fi";
import { Spinner, Button, Modal, FormField } from "../../../components";
import { usePermissions } from "../../../app/store/permissionStore";
import { useCompany } from "../../../app/store/companyStore";
import { useOrder } from "../hooks/useOrders";
import { useRecordPayment } from "../../payments/hooks/usePayments";
import { useQueryClient } from "@tanstack/react-query";
import TaxInvoice from "../components/TaxInvoice";
import "./InvoiceViewPage.css";

const inr = (n) => `₹${(Number(n) || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const MODES = ["cash", "card", "upi", "netbanking", "cheque", "other"];

export function InvoiceViewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { hasPermission } = usePermissions();
  const { company } = useCompany();
  const { data, isLoading, isError } = useOrder(id);
  const recordPayment = useRecordPayment();

  const [payOpen, setPayOpen] = useState(false);
  const [payForm, setPayForm] = useState({ amount: "", mode: "cash", reference: "" });

  if (isLoading) return <Spinner />;
  if (isError || !data?.item) {
    return (
      <div style={{ padding: 24 }}>
        <p style={{ color: "var(--color-danger)" }}>Invoice not found.</p>
        <Button variant="secondary" onClick={() => navigate("/orders")}>Back to Invoices</Button>
      </div>
    );
  }

  const o = data.item;
  const payments = data.related?.payments || [];
  const balance = Math.max((o.grandTotal || 0) - (o.amountPaid || 0), 0);

  async function submitPayment(e) {
    e.preventDefault();
    const amt = Number(payForm.amount);
    if (!amt || amt <= 0) {
      alert("Please enter a valid amount.");
      return;
    }
    if (amt > balance) {
      alert(`Amount cannot exceed the balance due of ${inr(balance)}.`);
      return;
    }
    try {
      await recordPayment.mutateAsync({
        order: id,
        amount: amt,
        mode: payForm.mode,
        reference: payForm.reference,
      });
      setPayForm({ amount: "", mode: "cash", reference: "" });
      setPayOpen(false);
      qc.invalidateQueries({ queryKey: ["orders", id] });
    } catch (err) {
      alert(err.response?.data?.message || "Failed to record payment.");
    }
  }

  return (
    <div className="inv-view">
      {/* Top action bar */}
      <div className="inv-view__bar">
        <button className="inv-view__back" onClick={() => navigate("/orders")}>
          <FiArrowLeft /> Sales Invoice {o.number}
          <span className={`inv-view__pill ${balance <= 0 ? "is-paid" : "is-unpaid"}`}>
            {o.status === "cancelled" ? "Cancelled" : balance <= 0 ? "Paid" : "Unpaid"}
          </span>
        </button>
        <div className="inv-view__actions">
          <Button variant="secondary" onClick={() => window.print()}>
            <FiDownload /> Download PDF
          </Button>
          <Button variant="secondary" onClick={() => window.print()}>
            <FiPrinter /> Print
          </Button>
          {hasPermission("payments.create") && balance > 0 && (
            <Button onClick={() => setPayOpen(true)}>
              <FiDollarSign /> Record Payment In
            </Button>
          )}
        </div>
      </div>

      <div className="inv-view__body">
        {/* The printable invoice sheet */}
        <div className="inv-view__sheet">
          <TaxInvoice o={o} company={company} balance={balance} />
        </div>

        {/* Payment history side panel */}
        <aside className="inv-view__side">
          <div className="inv-view__side-head">
            <h3>Payment History</h3>
          </div>
          <div className="inv-view__side-row">
            <span>Invoice Amount</span>
            <strong>{inr(o.grandTotal)}</strong>
          </div>
          <div className="inv-view__side-row">
            <span>Amount Received</span>
            <strong style={{ color: "#16a34a" }}>{inr(o.amountPaid)}</strong>
          </div>
          {payments.length > 0 && (
            <div className="inv-view__payments">
              {payments.map((p) => (
                <div className="inv-view__pay" key={p._id}>
                  <div>
                    <div style={{ fontWeight: 600, textTransform: "capitalize" }}>{p.mode}</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                      {new Date(p.createdAt).toLocaleDateString("en-IN")}
                    </div>
                  </div>
                  <strong>{inr(p.amount)}</strong>
                </div>
              ))}
            </div>
          )}
          <div className="inv-view__side-total">
            <span>Balance Amount</span>
            <strong style={{ color: balance > 0 ? "#dc2626" : "#16a34a" }}>{inr(balance)}</strong>
          </div>
        </aside>
      </div>

      {/* Record payment modal */}
      <Modal
        open={payOpen}
        title="Record Payment In"
        onClose={() => setPayOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setPayOpen(false)}>Cancel</Button>
            <Button onClick={submitPayment} disabled={recordPayment.isPending}>
              {recordPayment.isPending ? "Saving…" : "Record"}
            </Button>
          </>
        }
      >
        <form onSubmit={submitPayment}>
          <p style={{ color: "var(--color-text-muted)", fontSize: "0.85rem" }}>Balance due: {inr(balance)}</p>
          <FormField label="Amount *" htmlFor="p-amount">
            <input
              id="p-amount"
              type="number"
              min="1"
              max={balance}
              step="0.01"
              value={payForm.amount}
              onChange={(e) => setPayForm({ ...payForm, amount: e.target.value })}
              required
            />
            <button
              type="button"
              className="invoice-expandable-btn"
              style={{ background: "none", border: "none", color: "var(--color-primary, #c68629)", fontSize: "0.8rem", cursor: "pointer", padding: "4px 0" }}
              onClick={() => setPayForm({ ...payForm, amount: String(balance) })}
            >
              Pay full balance ({inr(balance)})
            </button>
          </FormField>
          <FormField label="Mode" htmlFor="p-mode">
            <select id="p-mode" value={payForm.mode} onChange={(e) => setPayForm({ ...payForm, mode: e.target.value })}>
              {MODES.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </FormField>
          <FormField label="Reference" htmlFor="p-ref">
            <input id="p-ref" value={payForm.reference} onChange={(e) => setPayForm({ ...payForm, reference: e.target.value })} />
          </FormField>
        </form>
      </Modal>
    </div>
  );
}

export default InvoiceViewPage;
