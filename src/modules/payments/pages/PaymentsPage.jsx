// Payments list. Shows recorded payments; "+ Record Payment In" opens the full
// myBillBook-style settlement page at /payments/create.
import { useNavigate } from "react-router-dom";
import { PageHeader, DataTable, Button, Spinner, ExportButton } from "../../../components";
import { usePermissions } from "../../../app/store/permissionStore";
import { usePayments } from "../hooks/usePayments";

const inr = (n) => (typeof n === "number" ? `₹${n.toLocaleString("en-IN")}` : "—");

const EXPORT_COLUMNS = [
  { header: "Payment #", value: (r) => r.number || "" },
  { header: "Date", value: (r) => new Date(r.createdAt).toLocaleDateString() },
  { header: "Invoice", value: (r) => r.order?.number || "" },
  { header: "Customer", value: (r) => r.customer?.name || "" },
  { header: "Amount", value: (r) => r.amount },
  { header: "Mode", value: (r) => r.mode },
  { header: "Status", value: (r) => r.status },
];

export function PaymentsPage() {
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const { data: rows = [], isLoading, isError } = usePayments();

  const columns = [
    { key: "number", header: "Payment #", render: (r) => r.number || "—" },
    { key: "createdAt", header: "Date", render: (r) => new Date(r.createdAt).toLocaleDateString() },
    { key: "order", header: "Invoice", render: (r) => r.order?.number || "—" },
    { key: "customer", header: "Customer", render: (r) => r.customer?.name || "—" },
    { key: "amount", header: "Amount", render: (r) => inr(r.amount) },
    { key: "mode", header: "Mode", render: (r) => r.mode },
    { key: "status", header: "Status", render: (r) => <span className={`badge badge--${r.status === "success" ? "active" : "inactive"}`}>{r.status}</span> },
  ];

  return (
    <div>
      <PageHeader
        title="Payment In"
        subtitle="Payments recorded against invoices"
        actions={
          <div style={{ display: "flex", gap: 8 }}>
            <ExportButton rows={rows} columns={EXPORT_COLUMNS} filename="payments.csv" />
            {hasPermission("payments.create") && (
              <Button onClick={() => navigate("/payments/create")}>+ Record Payment In</Button>
            )}
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
    </div>
  );
}

export default PaymentsPage;
