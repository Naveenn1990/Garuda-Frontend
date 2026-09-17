// Purchase Invoices overview. Stat cards (Total / Paid / Unpaid), a search box, a
// table of purchase invoices, and a "Create Purchase Invoice" button.
import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { FiShoppingBag, FiCheckCircle, FiAlertCircle } from "react-icons/fi";
import { PageHeader, DataTable, Button, Spinner } from "../../../components";
import { usePurchases, usePurchaseStats } from "../hooks/usePurchases";

const inr = (n) => `₹${(Number(n) || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("en-GB") : "—");

function StatCard({ icon: Icon, label, value, tone }) {
  const colors = {
    total: { bg: "#faf7ef", border: "#e8dfc7", text: "#8a6016" },
    paid: { bg: "#f0fdf4", border: "#bbf7d0", text: "#16a34a" },
    unpaid: { bg: "#fef2f2", border: "#fecaca", text: "#dc2626" },
  }[tone];
  return (
    <div style={{ flex: 1, minWidth: 200, background: colors.bg, border: `1px solid ${colors.border}`, borderRadius: 10, padding: "14px 18px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, color: colors.text, fontSize: "0.82rem", fontWeight: 600 }}>
        <Icon /> {label}
      </div>
      <div style={{ fontSize: "1.35rem", fontWeight: 800, color: colors.text, marginTop: 6 }}>{value}</div>
    </div>
  );
}

export default function PurchaseInvoicePage() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const { data: rows = [], isLoading, isError } = usePurchases(q ? { q } : {});
  const { data: stats } = usePurchaseStats();

  const columns = useMemo(
    () => [
      { key: "createdAt", header: "Date", render: (r) => fmtDate(r.invoiceDate || r.createdAt) },
      { key: "number", header: "Purchase Invoice Number", render: (r) => r.number || "—" },
      { key: "supplier", header: "Party Name", render: (r) => r.supplier?.name || "—" },
      { key: "dueDate", header: "Due In", render: (r) => (r.dueDate ? fmtDate(r.dueDate) : "—") },
      {
        key: "grandTotal",
        header: "Amount",
        render: (r) => {
          const unpaid = Math.max((r.grandTotal || 0) - (r.amountPaid || 0), 0);
          return (
            <div>
              <div style={{ fontWeight: 700 }}>{inr(r.grandTotal)}</div>
              {unpaid > 0 && (
                <div style={{ fontSize: "0.75rem", color: "#dc2626" }}>({inr(unpaid)} unpaid)</div>
              )}
            </div>
          );
        },
      },
      {
        key: "paymentStatus",
        header: "Status",
        render: (r) => {
          const paid = r.paymentStatus === "paid";
          return (
            <span
              className={`badge badge--${paid ? "active" : "inactive"}`}
              style={{ color: paid ? "#16a34a" : "#dc2626", background: paid ? "#f0fdf4" : "#fef2f2" }}
            >
              {paid ? "Paid" : r.paymentStatus === "partial" ? "Partial" : "Unpaid"}
            </span>
          );
        },
      },
    ],
    []
  );

  return (
    <div>
      <PageHeader
        title="Purchase Invoices"
        subtitle="Bills received from suppliers"
        actions={<Button onClick={() => navigate("/purchases/create")}>Create Purchase Invoice</Button>}
      />

      {/* Stat cards */}
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 18 }}>
        <StatCard icon={FiShoppingBag} label="Total Purchases" value={inr(stats?.totalPurchases)} tone="total" />
        <StatCard icon={FiCheckCircle} label="Paid" value={inr(stats?.totalPaid)} tone="paid" />
        <StatCard icon={FiAlertCircle} label="Unpaid" value={inr(stats?.totalUnpaid)} tone="unpaid" />
      </div>

      <div style={{ marginBottom: 16 }}>
        <input
          className="search-input"
          placeholder="Search by invoice number or supplier..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {isLoading ? (
        <Spinner />
      ) : isError ? (
        <p style={{ color: "var(--color-danger)" }}>Failed to load purchase invoices. Is the API running?</p>
      ) : (
        <DataTable
          columns={columns}
          rows={rows}
          emptyText="No purchase invoices yet. Click Create Purchase Invoice to add one."
          onRowClick={(row) => navigate(`/purchases/${row._id}`)}
        />
      )}
    </div>
  );
}
