// Quotations list with the approval & customer dispatch workflow.
// Send via WhatsApp, Email, or Print/PDF, plus one-click Order conversion.
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader, Card, Button, Spinner, Modal, ExportButton } from "../../../components";
import { usePermissions } from "../../../app/store/permissionStore";
import {
  useQuotations,
  useQuotationStatus,
  useConvertQuotation,
  useSendQuotation,
} from "../hooks/useQuotations";

const inr = (n) => (typeof n === "number" ? `₹${n.toLocaleString("en-IN")}` : "—");

const EXPORT_COLUMNS = [
  { header: "Quote #", value: (r) => r.number },
  { header: "Customer", value: (r) => r.customer?.name || "" },
  { header: "Total", value: (r) => r.grandTotal },
  { header: "Status", value: (r) => r.status },
  { header: "Created", value: (r) => new Date(r.createdAt).toLocaleDateString() },
];

const NEXT_ACTIONS = {
  draft: [
    { action: "share", label: "📤 Send / Share", kind: "share", variant: "primary" },
    { action: "approve", label: "Approve", kind: "status" },
    { action: "reject", label: "Reject", kind: "status", variant: "secondary" },
  ],
  sent: [
    { action: "share", label: "📤 Re-Share", kind: "share", variant: "secondary" },
    { action: "approve", label: "Approve", kind: "status" },
    { action: "accept", label: "Accept", kind: "status" },
    { action: "reject", label: "Reject", kind: "status", variant: "secondary" },
  ],
  approved: [
    { action: "share", label: "📤 Send to Customer", kind: "share", variant: "primary" },
    { action: "accept", label: "Accept", kind: "status" },
    { action: "reject", label: "Reject", kind: "status", variant: "secondary" },
  ],
  accepted: [
    { action: "share", label: "📄 View / Print", kind: "share", variant: "secondary" },
    { action: "convert", label: "Convert to Order", kind: "convert" },
  ],
  rejected: [],
  converted: [{ action: "share", label: "📄 View Quote", kind: "share", variant: "secondary" }],
};

const statusClass = (s) =>
  s === "converted" || s === "accepted"
    ? "received"
    : s === "rejected"
    ? "rejected"
    : s === "approved"
    ? "approved"
    : "requested";

export function QuotationsPage() {
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const { data: rows = [], isLoading, isError } = useQuotations();
  const quotationStatus = useQuotationStatus();
  const convertQuotation = useConvertQuotation();
  const sendQuotation = useSendQuotation();

  // Selected quotation for sending / printing modal
  const [selectedQuote, setSelectedQuote] = useState(null);
  const [emailStatus, setEmailStatus] = useState("");
  const [copied, setCopied] = useState(false);

  async function doAction(q, a) {
    if (a.kind === "share") {
      setSelectedQuote(q);
      setEmailStatus("");
      setCopied(false);
      return;
    }

    try {
      if (a.kind === "convert") {
        const res = await convertQuotation.mutateAsync(q._id);
        const num = res?.data?.item?.number;
        alert(`Order ${num || ""} created from quotation.`);
        navigate("/orders");
      } else {
        await quotationStatus.mutateAsync({ id: q._id, action: a.action });
      }
    } catch (err) {
      alert(err.response?.data?.message || "Action failed.");
    }
  }

  // Handle email sending
  async function handleSendEmail() {
    if (!selectedQuote) return;
    setEmailStatus("Sending email...");
    try {
      await sendQuotation.mutateAsync(selectedQuote._id);
      setEmailStatus("✅ Quotation email sent successfully!");
    } catch (err) {
      setEmailStatus(`❌ Failed: ${err.response?.data?.message || "Could not send email"}`);
    }
  }

  // Format summary text for WhatsApp / Clipboard
  function getQuoteSummaryText(q) {
    if (!q) return "";
    const itemsList = (q.items || [])
      .map((it, idx) => `${idx + 1}. ${it.name || it.product?.name || "Item"} x ${it.quantity} = ${inr((it.price - (it.discount || 0)) * it.quantity)}`)
      .join("\n");

    return `*GARUDA RETAIL - PRICE QUOTATION*\nQuotation #: *${q.number}*\nCustomer: ${q.customer?.name || "Valued Customer"}\n\n*Items:*\n${itemsList}\n\n*Total Offer Price:* *${inr(q.grandTotal)}* (GST Included)\nValidity: 7 Days from issue\n\nFor questions or to confirm your order, reply to this message. Thank you!`;
  }

  // Open WhatsApp Web/App
  function handleWhatsAppShare() {
    if (!selectedQuote) return;
    const phone = selectedQuote.customer?.mobile || "";
    const cleanPhone = phone.replace(/[^0-9]/g, "");
    const fullPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const text = encodeURIComponent(getQuoteSummaryText(selectedQuote));
    const url = fullPhone ? `https://wa.me/${fullPhone}?text=${text}` : `https://wa.me/?text=${text}`;
    window.open(url, "_blank");
  }

  // Copy to clipboard
  function handleCopyText() {
    if (!selectedQuote) return;
    navigator.clipboard.writeText(getQuoteSummaryText(selectedQuote));
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  }

  return (
    <div>
      <PageHeader
        title="Quotations"
        subtitle="Price offers, customer sharing and conversion pipeline"
        actions={
          <div style={{ display: "flex", gap: 8 }}>
            <ExportButton rows={rows} columns={EXPORT_COLUMNS} filename="quotations.csv" />
            {hasPermission("quotations.create") && (
              <Button onClick={() => navigate("/quotations/create")}>+ New Quotation</Button>
            )}
          </div>
        }
      />

      {isLoading ? (
        <Spinner />
      ) : isError ? (
        <p style={{ color: "var(--color-danger)" }}>Failed to load quotations. Is the API running?</p>
      ) : (
        <Card>
          <div className="data-table__wrap" style={{ border: "none" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Quote #</th>
                  <th>Customer</th>
                  <th>Total Offer</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td className="data-table__empty" colSpan={5}>
                      No quotations yet.
                    </td>
                  </tr>
                ) : (
                  rows.map((q) => (
                    <tr key={q._id}>
                      <td>
                        <strong
                          style={{ color: "var(--brand-gold-dark)", cursor: "pointer" }}
                          onClick={() => {
                            setSelectedQuote(q);
                            setEmailStatus("");
                            setCopied(false);
                          }}
                        >
                          {q.number}
                        </strong>
                      </td>
                      <td>
                        {q.customer?.name || "—"}
                        {q.customer?.mobile ? ` (${q.customer.mobile})` : ""}
                      </td>
                      <td style={{ fontWeight: 700 }}>{inr(q.grandTotal)}</td>
                      <td>
                        <span className={`transfer-status transfer-status--${statusClass(q.status)}`}>
                          {q.status}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                          {(NEXT_ACTIONS[q.status] || []).map((a) => {
                            const allowed =
                              a.kind === "convert"
                                ? hasPermission("orders.create")
                                : a.kind === "share"
                                ? true
                                : hasPermission("quotations.approve");
                            if (!allowed) return null;
                            return (
                              <Button
                                key={a.action}
                                variant={a.variant}
                                onClick={() => doAction(q, a)}
                                disabled={quotationStatus.isPending || convertQuotation.isPending}
                              >
                                {a.label}
                              </Button>
                            );
                          })}
                          {(NEXT_ACTIONS[q.status] || []).length === 0 && "—"}
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

      {/* Share & Send Quotation Modal */}
      {selectedQuote && (
        <Modal
          open={Boolean(selectedQuote)}
          title={`Quotation ${selectedQuote.number} — Customer Dispatch`}
          onClose={() => setSelectedQuote(null)}
          footer={
            <Button variant="secondary" onClick={() => setSelectedQuote(null)}>
              Close
            </Button>
          }
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Quick Dispatch Channels */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 12,
                backgroundColor: "#f8fafc",
                padding: 14,
                borderRadius: 8,
                border: "1px solid #e2e8f0",
              }}
            >
              <button
                type="button"
                onClick={handleWhatsAppShare}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  padding: "10px 14px",
                  backgroundColor: "#25D366",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: 6,
                  fontWeight: 700,
                  fontSize: "0.9rem",
                  cursor: "pointer",
                }}
              >
                💬 Send on WhatsApp
              </button>

              <button
                type="button"
                onClick={handleSendEmail}
                disabled={sendQuotation.isPending}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  padding: "10px 14px",
                  backgroundColor: "#2563eb",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: 6,
                  fontWeight: 700,
                  fontSize: "0.9rem",
                  cursor: "pointer",
                }}
              >
                ✉️ Send via Email
              </button>

              <button
                type="button"
                onClick={() => window.print()}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  padding: "10px 14px",
                  backgroundColor: "#ffffff",
                  color: "#1e293b",
                  border: "1px solid #cbd5e1",
                  borderRadius: 6,
                  fontWeight: 600,
                  fontSize: "0.88rem",
                  cursor: "pointer",
                }}
              >
                🖨️ Print / Save PDF
              </button>

              <button
                type="button"
                onClick={handleCopyText}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  padding: "10px 14px",
                  backgroundColor: "#ffffff",
                  color: "#1e293b",
                  border: "1px solid #cbd5e1",
                  borderRadius: 6,
                  fontWeight: 600,
                  fontSize: "0.88rem",
                  cursor: "pointer",
                }}
              >
                {copied ? "✅ Copied Text!" : "📋 Copy Summary"}
              </button>
            </div>

            {emailStatus && (
              <div
                style={{
                  padding: "8px 12px",
                  borderRadius: 6,
                  fontSize: "0.85rem",
                  backgroundColor: emailStatus.startsWith("✅") ? "#ecfdf5" : "#fef2f2",
                  color: emailStatus.startsWith("✅") ? "#065f46" : "#991b1b",
                  fontWeight: 600,
                }}
              >
                {emailStatus}
              </div>
            )}

            {/* Printable Formal Quotation Template */}
            <div
              className="printable-document"
              style={{
                backgroundColor: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: 8,
                padding: 16,
                fontSize: "0.85rem",
                color: "#1e293b",
                lineHeight: "1.4",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "2px solid #334155", paddingBottom: 10, marginBottom: 12 }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 800, color: "var(--brand-gold-dark, #b45309)" }}>
                    GARUDA INTERNATIONAL
                  </h3>
                  <div style={{ fontSize: "0.78rem", color: "#64748b" }}>
                    Official Price Quotation & Offer
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontWeight: 800, fontSize: "1rem" }}>{selectedQuote.number}</div>
                  <div style={{ fontSize: "0.78rem", color: "#64748b" }}>
                    Date: {new Date(selectedQuote.createdAt).toLocaleDateString("en-IN")}
                  </div>
                  <div style={{ fontSize: "0.78rem", color: "#64748b" }}>
                    Valid: 7 Days
                  </div>
                </div>
              </div>

              <div style={{ backgroundColor: "#f8fafc", padding: 10, borderRadius: 6, marginBottom: 12 }}>
                <strong>Customer:</strong> {selectedQuote.customer?.name || "Customer"}
                {selectedQuote.customer?.mobile && <span> · Phone: {selectedQuote.customer.mobile}</span>}
                {selectedQuote.customer?.email && <div>Email: {selectedQuote.customer.email}</div>}
              </div>

              <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 12 }}>
                <thead>
                  <tr style={{ backgroundColor: "#f1f5f9", textAlign: "left", fontSize: "0.8rem" }}>
                    <th style={{ padding: "6px 8px", border: "1px solid #cbd5e1" }}>#</th>
                    <th style={{ padding: "6px 8px", border: "1px solid #cbd5e1" }}>Product</th>
                    <th style={{ padding: "6px 8px", border: "1px solid #cbd5e1", textAlign: "center" }}>Qty</th>
                    <th style={{ padding: "6px 8px", border: "1px solid #cbd5e1", textAlign: "right" }}>MRP (₹)</th>
                    <th style={{ padding: "6px 8px", border: "1px solid #cbd5e1", textAlign: "right" }}>Offer Rate (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {(selectedQuote.items || []).map((it, idx) => (
                    <tr key={idx}>
                      <td style={{ padding: "6px 8px", border: "1px solid #cbd5e1" }}>{idx + 1}</td>
                      <td style={{ padding: "6px 8px", border: "1px solid #cbd5e1" }}>
                        <strong>{it.name || it.product?.name}</strong>
                      </td>
                      <td style={{ padding: "6px 8px", border: "1px solid #cbd5e1", textAlign: "center" }}>{it.quantity}</td>
                      <td style={{ padding: "6px 8px", border: "1px solid #cbd5e1", textAlign: "right" }}>{inr(it.price)}</td>
                      <td style={{ padding: "6px 8px", border: "1px solid #cbd5e1", textAlign: "right", fontWeight: 700 }}>
                        {inr((it.price - (it.discount || 0)) * it.quantity)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
                <div style={{ width: 220 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}>
                    <span>Subtotal:</span>
                    <span>{inr(selectedQuote.subtotal)}</span>
                  </div>
                  {selectedQuote.discount > 0 && (
                    <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", color: "#16a34a" }}>
                      <span>Discount:</span>
                      <span>- {inr(selectedQuote.discount)}</span>
                    </div>
                  )}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "6px 0",
                      borderTop: "2px solid #334155",
                      fontWeight: 800,
                      fontSize: "0.95rem",
                    }}
                  >
                    <span>Total Offer:</span>
                    <span style={{ color: "var(--brand-gold-dark, #b45309)" }}>{inr(selectedQuote.grandTotal)}</span>
                  </div>
                </div>
              </div>

              <div style={{ borderTop: "1px dashed #cbd5e1", paddingTop: 8, fontSize: "0.75rem", color: "#64748b" }}>
                <div>• All prices include GST.</div>
                <div>• Quotation valid for 7 days from date of issue.</div>
                <div style={{ marginTop: 4, fontWeight: 600 }}>Thank you for choosing Garuda International!</div>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default QuotationsPage;
