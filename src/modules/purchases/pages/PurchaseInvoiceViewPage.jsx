// Full-page Purchase Invoice view. Renders the dedicated PurchaseInvoiceDocument
// (separate template from the sales invoice) with Download / Print actions and an
// amount summary side panel. Payment Out will hook in here later.
import { useNavigate, useParams } from "react-router-dom";
import { FiArrowLeft, FiDownload, FiPrinter } from "react-icons/fi";
import { Spinner, Button } from "../../../components";
import { useCompany } from "../../../app/store/companyStore";
import { usePurchase } from "../hooks/usePurchases";
import PurchaseInvoiceDocument from "../components/PurchaseInvoiceDocument";
import "../../orders/pages/InvoiceViewPage.css";

const inr = (n) => `₹${(Number(n) || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function PurchaseInvoiceViewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { company } = useCompany();
  const { data: p, isLoading, isError } = usePurchase(id);

  if (isLoading) return <Spinner />;
  if (isError || !p) {
    return (
      <div style={{ padding: 24 }}>
        <p style={{ color: "var(--color-danger)" }}>Purchase invoice not found.</p>
        <Button variant="secondary" onClick={() => navigate("/purchases")}>Back to Purchase Invoices</Button>
      </div>
    );
  }

  const balance = Math.max((p.grandTotal || 0) - (p.amountPaid || 0), 0);
  const paid = balance <= 0 && p.grandTotal > 0;

  return (
    <div className="inv-view">
      <div className="inv-view__bar">
        <button className="inv-view__back" onClick={() => navigate("/purchases")}>
          <FiArrowLeft /> Purchase Invoice {p.number}
          <span className={`inv-view__pill ${paid ? "is-paid" : "is-unpaid"}`}>
            {paid ? "Paid" : p.paymentStatus === "partial" ? "Partial" : "Unpaid"}
          </span>
        </button>
        <div className="inv-view__actions">
          <Button variant="secondary" onClick={() => window.print()}>
            <FiDownload /> Download PDF
          </Button>
          <Button variant="secondary" onClick={() => window.print()}>
            <FiPrinter /> Print
          </Button>
        </div>
      </div>

      <div className="inv-view__body">
        <div className="inv-view__sheet">
          <PurchaseInvoiceDocument p={p} company={company} />
        </div>

        <aside className="inv-view__side">
          <div className="inv-view__side-head">
            <h3>Purchase Summary</h3>
          </div>
          <div className="inv-view__side-row">
            <span>Supplier</span>
            <strong>{p.supplier?.name || "—"}</strong>
          </div>
          <div className="inv-view__side-row">
            <span>Warehouse</span>
            <strong>{p.warehouse?.name || "—"}</strong>
          </div>
          <div className="inv-view__side-row">
            <span>Total Amount</span>
            <strong>{inr(p.grandTotal)}</strong>
          </div>
          <div className="inv-view__side-row">
            <span>Amount Paid</span>
            <strong style={{ color: "#16a34a" }}>{inr(p.amountPaid)}</strong>
          </div>
          <div className="inv-view__side-total">
            <span>Balance Amount</span>
            <strong style={{ color: balance > 0 ? "#dc2626" : "#16a34a" }}>{inr(balance)}</strong>
          </div>
        </aside>
      </div>
    </div>
  );
}
