// Quotations list with the approval workflow: Draft -> Send -> Approve -> Accept ->
// Convert to Order (or Reject). Next-step actions render as buttons per row.
import { useNavigate } from "react-router-dom";
import { PageHeader, Card, Button, Spinner, ExportButton } from "../../../components";
import { usePermissions } from "../../../app/store/permissionStore";
import { useQuotations, useQuotationStatus, useConvertQuotation } from "../hooks/useQuotations";

const inr = (n) => (typeof n === "number" ? `₹${n.toLocaleString("en-IN")}` : "—");

const EXPORT_COLUMNS = [
  { header: "Quote #", value: (r) => r.number },
  { header: "Customer", value: (r) => r.customer?.name || "" },
  { header: "Total", value: (r) => r.grandTotal },
  { header: "Status", value: (r) => r.status },
  { header: "Created", value: (r) => new Date(r.createdAt).toLocaleDateString() },
];

// Which workflow actions are available from each status.
const NEXT_ACTIONS = {
  draft: [
    { action: "send", label: "Send", kind: "status" },
    { action: "approve", label: "Approve", kind: "status" },
    { action: "reject", label: "Reject", kind: "status", variant: "secondary" },
  ],
  sent: [
    { action: "approve", label: "Approve", kind: "status" },
    { action: "accept", label: "Accept", kind: "status" },
    { action: "reject", label: "Reject", kind: "status", variant: "secondary" },
  ],
  approved: [
    { action: "accept", label: "Accept", kind: "status" },
    { action: "reject", label: "Reject", kind: "status", variant: "secondary" },
  ],
  accepted: [{ action: "convert", label: "Convert to Order", kind: "convert" }],
  rejected: [],
  converted: [],
};

const statusClass = (s) =>
  s === "converted" || s === "accepted" ? "received" : s === "rejected" ? "rejected" : s === "approved" ? "approved" : "requested";

export function QuotationsPage() {
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const { data: rows = [], isLoading, isError } = useQuotations();
  const quotationStatus = useQuotationStatus();
  const convertQuotation = useConvertQuotation();

  async function doAction(q, a) {
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

  return (
    <div>
      <PageHeader
        title="Quotations"
        subtitle="Price offers and approval workflow"
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
                  <th>Total</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr><td className="data-table__empty" colSpan={5}>No quotations yet.</td></tr>
                ) : (
                  rows.map((q) => (
                    <tr key={q._id}>
                      <td>{q.number}</td>
                      <td>{q.customer?.name || "—"}</td>
                      <td>{inr(q.grandTotal)}</td>
                      <td><span className={`transfer-status transfer-status--${statusClass(q.status)}`}>{q.status}</span></td>
                      <td>
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                          {(NEXT_ACTIONS[q.status] || []).map((a) => {
                            // Gate convert by orders.create, status changes by quotations.approve.
                            const allowed = a.kind === "convert" ? hasPermission("orders.create") : hasPermission("quotations.approve");
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
    </div>
  );
}

export default QuotationsPage;
