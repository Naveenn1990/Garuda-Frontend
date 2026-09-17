// Payment In — myBillBook-style. Pick a party, see their outstanding balance, enter
// the amount received, and settle it across their open invoices. Auto-allocates the
// received amount oldest-invoice-first; the user can tweak per-invoice amounts.
import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiArrowLeft,
  FiSettings,
  FiSearch,
  FiUserPlus,
} from "react-icons/fi";
import { useCustomers } from "../../customers/hooks/useCustomers";
import { useOutstanding, useSettlePayment } from "../hooks/usePayments";
import { useUI } from "../../../app/store/uiStore";
import { Spinner } from "../../../components";
import "../../orders/pages/SalesInvoiceCreate.css";

const inr = (n) => `₹${(Number(n) || 0).toLocaleString("en-IN")}`;
const MODES = [
  { label: "Cash", value: "cash" },
  { label: "UPI / QR Code", value: "upi" },
  { label: "Card", value: "card" },
  { label: "Net Banking", value: "netbanking" },
  { label: "Cheque", value: "cheque" },
];

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("en-GB") : "—");

export function PaymentInPage() {
  const navigate = useNavigate();
  const { openPartyModal } = useUI();

  const { data: customers = [], isLoading: cLoading } = useCustomers();
  const settle = useSettlePayment();

  // Header fields
  const [customerId, setCustomerId] = useState("");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split("T")[0]);
  const [mode, setMode] = useState("cash");
  const [notes, setNotes] = useState("");
  const [amountReceived, setAmountReceived] = useState("");
  const [reference, setReference] = useState("");

  const selectedParty = useMemo(
    () => customers.find((c) => c._id === customerId) || null,
    [customers, customerId]
  );

  const { data: outstanding, isLoading: oLoading } = useOutstanding(customerId);
  const invoices = outstanding?.items || [];
  const totalOutstanding = outstanding?.totalOutstanding || 0;

  // Per-invoice settlement state: { [orderId]: { selected, amount } }
  const [alloc, setAlloc] = useState({});
  const [error, setError] = useState("");

  // Reset allocations when the party (and therefore the invoice list) changes.
  useEffect(() => {
    setAlloc({});
    setAmountReceived("");
  }, [customerId]);

  // Auto-allocate the received amount across selected invoices, oldest first. If no
  // invoices are explicitly selected yet, select from the top until the amount runs out.
  function autoAllocate(received) {
    let remaining = Number(received) || 0;
    const next = {};
    for (const inv of invoices) {
      if (remaining <= 0) {
        next[inv._id] = { selected: false, amount: "" };
        continue;
      }
      const pay = Math.min(inv.balance, remaining);
      next[inv._id] = { selected: true, amount: String(Math.round(pay * 100) / 100) };
      remaining -= pay;
    }
    setAlloc(next);
  }

  function onAmountReceivedChange(val) {
    setAmountReceived(val);
    autoAllocate(val);
    if (error) setError("");
  }

  function toggleInvoice(inv) {
    setAlloc((prev) => {
      const cur = prev[inv._id] || { selected: false, amount: "" };
      const selected = !cur.selected;
      return {
        ...prev,
        [inv._id]: {
          selected,
          amount: selected ? String(inv.balance) : "",
        },
      };
    });
  }

  function setInvoiceAmount(inv, value) {
    setAlloc((prev) => ({
      ...prev,
      [inv._id]: { selected: Number(value) > 0, amount: value },
    }));
  }

  // Totals from the allocation table.
  const allocation = useMemo(() => {
    let total = 0;
    let count = 0;
    const list = [];
    for (const inv of invoices) {
      const a = alloc[inv._id];
      const amt = a && a.selected ? Number(a.amount) || 0 : 0;
      if (amt > 0) {
        total += amt;
        count += 1;
        list.push({ order: inv._id, amount: amt });
      }
    }
    return { total: Math.round(total * 100) / 100, count, list };
  }, [invoices, alloc]);

  async function handleSave() {
    setError("");
    if (!customerId) {
      setError("Please select a party.");
      return;
    }
    if (allocation.list.length === 0) {
      setError("Select at least one invoice and enter an amount to settle.");
      return;
    }
    // Guard: no allocation may exceed its invoice balance (backend also enforces this).
    for (const inv of invoices) {
      const a = alloc[inv._id];
      const amt = a && a.selected ? Number(a.amount) || 0 : 0;
      if (amt > inv.balance) {
        setError(`Amount for invoice ${inv.number} exceeds its balance of ${inr(inv.balance)}.`);
        return;
      }
    }
    try {
      await settle.mutateAsync({
        customer: customerId,
        mode,
        reference,
        date: paymentDate,
        allocations: allocation.list,
      });
      navigate("/payments");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to record payment.");
    }
  }

  if (cLoading) return <Spinner />;

  return (
    <div className="invoice-create-container">
      {/* Top bar */}
      <div className="invoice-top-bar">
        <div className="invoice-top-left">
          <button type="button" className="invoice-btn-exit" onClick={() => navigate("/payments")}>
            <FiArrowLeft />
            <span>Exit</span>
          </button>
          <h1 className="invoice-title">Record Payment In</h1>
        </div>
        <div className="invoice-top-right">
          <button type="button" className="invoice-btn-save-new" onClick={() => navigate("/payments")}>
            Cancel
          </button>
          <button
            type="button"
            className="invoice-btn-save-primary"
            onClick={handleSave}
            disabled={settle.isPending}
          >
            {settle.isPending ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      <main className="invoice-sheet">
        {error && (
          <div style={{ background: "#fef2f2", color: "#b91c1c", padding: "10px 16px", borderRadius: 8, marginBottom: 12, fontWeight: 600 }}>
            {error}
          </div>
        )}

        {/* Header: party + payment meta */}
        <div className="invoice-meta-grid">
          <div className="invoice-bill-to-box">
            <div className="invoice-box-label">Party Name</div>
            {selectedParty ? (
              <div className="invoice-party-selected-card">
                <div className="invoice-party-info-name">{selectedParty.name}</div>
                <div className="invoice-party-info-sub">
                  {selectedParty.mobile || "—"}
                </div>
                <div style={{ marginTop: 6, fontWeight: 700, color: totalOutstanding > 0 ? "#dc2626" : "#16a34a" }}>
                  Current Balance: {inr(totalOutstanding)}
                </div>
                <button
                  type="button"
                  className="invoice-expandable-btn"
                  style={{ marginTop: 4 }}
                  onClick={() => setCustomerId("")}
                >
                  Change Party
                </button>
              </div>
            ) : (
              <>
                <select
                  className="invoice-meta-select"
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                  style={{ marginBottom: 10 }}
                >
                  <option value="">Select a party</option>
                  {customers.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name} ({c.mobile})
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="invoice-party-dashed-btn"
                  onClick={() => openPartyModal && openPartyModal()}
                >
                  <FiUserPlus />
                  <span>+ Add Party</span>
                </button>
              </>
            )}
          </div>

          <div className="invoice-details-box">
            <div className="invoice-details-header">
              <FiSettings />
              <span style={{ fontWeight: 700 }}>Payment Details</span>
            </div>
            <div className="invoice-details-grid">
              <div className="invoice-meta-field">
                <label className="invoice-meta-label">Payment Date</label>
                <input
                  type="date"
                  className="invoice-meta-input"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                />
              </div>
              <div className="invoice-meta-field">
                <label className="invoice-meta-label">Payment Mode</label>
                <select className="invoice-meta-select" value={mode} onChange={(e) => setMode(e.target.value)}>
                  {MODES.map((m) => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>
              <div className="invoice-meta-field">
                <label className="invoice-meta-label">Payment In Number</label>
                <input className="invoice-meta-input" value="Auto (assigned on save)" readOnly />
              </div>
              <div className="invoice-meta-field">
                <label className="invoice-meta-label">Reference</label>
                <input
                  className="invoice-meta-input"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="Txn ID / cheque no"
                />
              </div>
              <div className="invoice-meta-field" style={{ gridColumn: "1 / -1" }}>
                <label className="invoice-meta-label">Notes</label>
                <textarea
                  rows={2}
                  className="invoice-meta-input"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Enter Notes"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Amount received */}
        <div className="invoice-financials-card" style={{ maxWidth: 360, marginBottom: 20 }}>
          <div className="invoice-meta-field">
            <label className="invoice-meta-label">Amount Received</label>
            <input
              type="number"
              min="0"
              className="invoice-meta-input"
              value={amountReceived}
              onChange={(e) => onAmountReceivedChange(e.target.value)}
              placeholder="0"
              disabled={!customerId}
            />
          </div>
          <p style={{ margin: "6px 0 0", fontSize: "0.78rem", color: "#6b6352" }}>
            Auto-allocates to open invoices, oldest first. You can adjust each row below.
          </p>
        </div>

        {/* Settle invoices table */}
        <div className="invoice-table-wrap">
          <div style={{ padding: "12px 16px", fontWeight: 700, color: "#1c1b17", borderBottom: "1px solid #f0e8d5" }}>
            Settle invoices with this payment
            {allocation.count > 0 && (
              <span style={{ marginLeft: 10, fontSize: "0.82rem", color: "#8a6016", fontWeight: 600 }}>
                {allocation.count} invoice{allocation.count > 1 ? "s" : ""} selected
              </span>
            )}
          </div>

          {!customerId ? (
            <div style={{ padding: 32, textAlign: "center", color: "#8a8372" }}>
              <FiSearch style={{ marginBottom: 6 }} />
              <div>Select a party to see their open invoices.</div>
            </div>
          ) : oLoading ? (
            <div style={{ padding: 24 }}><Spinner /></div>
          ) : invoices.length === 0 ? (
            <div style={{ padding: 32, textAlign: "center", color: "#16a34a", fontWeight: 600 }}>
              No open invoices. This party has no outstanding balance.
            </div>
          ) : (
            <table className="invoice-table">
              <thead>
                <tr>
                  <th style={{ width: 44 }}></th>
                  <th>Date</th>
                  <th>Invoice #</th>
                  <th style={{ textAlign: "right" }}>Invoice Amount</th>
                  <th style={{ textAlign: "right" }}>Balance</th>
                  <th style={{ width: 150, textAlign: "right" }}>Amount Received</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => {
                  const a = alloc[inv._id] || { selected: false, amount: "" };
                  return (
                    <tr key={inv._id}>
                      <td style={{ textAlign: "center" }}>
                        <input
                          type="checkbox"
                          checked={a.selected}
                          onChange={() => toggleInvoice(inv)}
                        />
                      </td>
                      <td>{fmtDate(inv.createdAt)}</td>
                      <td style={{ fontWeight: 600 }}>{inv.number}</td>
                      <td style={{ textAlign: "right" }}>{inr(inv.grandTotal)}</td>
                      <td style={{ textAlign: "right", color: "#dc2626" }}>{inr(inv.balance)}</td>
                      <td style={{ textAlign: "right" }}>
                        <input
                          type="number"
                          min="0"
                          max={inv.balance}
                          step="0.01"
                          className="invoice-item-input"
                          style={{ textAlign: "right" }}
                          value={a.amount}
                          onChange={(e) => setInvoiceAmount(inv, e.target.value)}
                          placeholder="0"
                        />
                      </td>
                    </tr>
                  );
                })}
                <tr className="invoice-table-subtotal-row">
                  <td></td>
                  <td colSpan={2}>Total</td>
                  <td style={{ textAlign: "right" }}>{inr(invoices.reduce((s, i) => s + i.grandTotal, 0))}</td>
                  <td style={{ textAlign: "right" }}>{inr(totalOutstanding)}</td>
                  <td style={{ textAlign: "right" }}>{inr(allocation.total)}</td>
                </tr>
              </tbody>
            </table>
          )}
        </div>

        {/* Footer summary */}
        {customerId && invoices.length > 0 && (
          <div className="invoice-financials-card" style={{ maxWidth: 360, marginLeft: "auto", marginTop: 16 }}>
            <div className="invoice-calc-row">
              <span>Total Outstanding</span>
              <strong>{inr(totalOutstanding)}</strong>
            </div>
            <div className="invoice-calc-row invoice-calc-grand-total">
              <span>Settling Now</span>
              <span>{inr(allocation.total)}</span>
            </div>
            <div className="invoice-calc-row">
              <span>Remaining Balance</span>
              <strong style={{ color: "#dc2626" }}>
                {inr(Math.max(totalOutstanding - allocation.total, 0))}
              </strong>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default PaymentInPage;
