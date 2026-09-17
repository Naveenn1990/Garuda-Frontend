// Sales Invoices page — server-side paginated, filtered, and aggregated so it stays
// fast with thousands of orders. Stat cards + date range + debounced search + status
// filter + pagination all hit the backend.
import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { FiFileText, FiCheckCircle, FiAlertCircle, FiXCircle, FiSearch, FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { PageHeader, Card, Button, Spinner } from "../../../components";
import { usePermissions } from "../../../app/store/permissionStore";
import { useOrders, useOrderStats } from "../hooks/useOrders";
import "./OrdersPage.css";

const inr = (n) => `₹${(Number(n) || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// Date range presets → ISO `from` value.
const RANGES = [
  { label: "Last 30 Days", days: 30 },
  { label: "Last 90 Days", days: 90 },
  { label: "Last 365 Days", days: 365 },
  { label: "All Time", days: null },
];

const STATUSES = [
  { label: "All Statuses", value: "" },
  { label: "New", value: "new" },
  { label: "Confirmed", value: "confirmed" },
  { label: "Processing", value: "processing" },
  { label: "Dispatched", value: "dispatched" },
  { label: "Delivered", value: "delivered" },
  { label: "Cancelled", value: "cancelled" },
];

function payInfo(o) {
  if (o.status === "cancelled") return { label: "Cancelled", tone: "cancelled" };
  const bal = Math.max((o.grandTotal || 0) - (o.amountPaid || 0), 0);
  if (bal <= 0) return { label: "Paid", tone: "paid" };
  if ((o.amountPaid || 0) > 0) return { label: "Partial", tone: "partial" };
  return { label: "Unpaid", tone: "unpaid" };
}

function fromDate(days) {
  if (!days) return undefined;
  // Round to start-of-day so the value is stable within a day (not per-millisecond).
  const d = new Date(Date.now() - days * 86400000);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

export function OrdersPage() {
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();

  const [rangeDays, setRangeDays] = useState(365);
  const [statusFilter, setStatusFilter] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [q, setQ] = useState("");        // debounced search term sent to backend
  const [page, setPage] = useState(1);
  const limit = 20;

  // Debounce the search box.
  useEffect(() => {
    const t = setTimeout(() => { setQ(searchInput.trim()); setPage(1); }, 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  // Reset to page 1 when filters change.
  useEffect(() => { setPage(1); }, [rangeDays, statusFilter]);

  // Shared filter params for both list + stats. MEMOIZED so the `from` timestamp
  // is stable across renders — otherwise the query key changes every render and
  // React Query refetches forever ("Loading..." never ends).
  const filterParams = useMemo(() => ({
    from: fromDate(rangeDays),
    status: statusFilter || undefined,
    q: q || undefined,
  }), [rangeDays, statusFilter, q]);

  const listParams = useMemo(() => ({ ...filterParams, page, limit }), [filterParams, page]);

  const { data: listData, isLoading, isError } = useOrders(listParams);
  const { data: stats } = useOrderStats(filterParams);

  const orders = listData?.items || [];
  const total = listData?.total || 0;
  const pages = listData?.pages || 1;

  const s = stats || { totalSales: 0, paid: 0, unpaid: 0, cancelled: 0 };

  return (
    <div>
      <PageHeader
        title="Sales Invoices"
        subtitle="All sales orders and their payment status"
        actions={
          hasPermission("orders.create") && (
            <Button onClick={() => navigate("/orders/create")}>+ Create Sales Invoice</Button>
          )
        }
      />

      {/* Stat cards (server-aggregated) */}
      <div className="sales-stats">
        <div className="sales-stat sales-stat--total">
          <div className="sales-stat__head"><FiFileText /> Total Sales</div>
          <div className="sales-stat__value">{inr(s.totalSales)}</div>
        </div>
        <div className="sales-stat sales-stat--paid">
          <div className="sales-stat__head"><FiCheckCircle /> Paid</div>
          <div className="sales-stat__value">{inr(s.paid)}</div>
        </div>
        <div className="sales-stat sales-stat--unpaid">
          <div className="sales-stat__head"><FiAlertCircle /> Unpaid</div>
          <div className="sales-stat__value">{inr(s.unpaid)}</div>
        </div>
        <div className="sales-stat sales-stat--cancelled">
          <div className="sales-stat__head"><FiXCircle /> Cancelled</div>
          <div className="sales-stat__value">{s.cancelled > 0 ? inr(s.cancelled) : "—"}</div>
        </div>
      </div>

      {/* Filter bar */}
      <div className="sales-filterbar">
        <div className="sales-search">
          <FiSearch />
          <input
            placeholder="Search by invoice # or party name..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>
        <select
          className="sales-range"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          {STATUSES.map((st) => <option key={st.value} value={st.value}>{st.label}</option>)}
        </select>
        <select
          className="sales-range"
          value={rangeDays ?? "all"}
          onChange={(e) => setRangeDays(e.target.value === "all" ? null : Number(e.target.value))}
        >
          {RANGES.map((r) => <option key={r.label} value={r.days ?? "all"}>{r.label}</option>)}
        </select>
      </div>

      {isLoading ? (
        <Spinner />
      ) : isError ? (
        <p style={{ color: "var(--color-danger)" }}>Failed to load invoices. Is the API running?</p>
      ) : (
        <Card>
          <div className="data-table__wrap" style={{ border: "none" }}>
            <table className="data-table sales-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Invoice Number</th>
                  <th>Party Name</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 ? (
                  <tr><td className="data-table__empty" colSpan={6}>No invoices found.</td></tr>
                ) : (
                  orders.map((o) => {
                    const pi = payInfo(o);
                    const bal = Math.max((o.grandTotal || 0) - (o.amountPaid || 0), 0);
                    return (
                      <tr key={o._id} className="sales-row" onClick={() => navigate(`/orders/${o._id}/invoice`)}>
                        <td style={{ whiteSpace: "nowrap", color: "var(--color-text-muted)" }}>
                          {new Date(o.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                        </td>
                        <td style={{ fontWeight: 600 }}>{o.number}</td>
                        <td style={{ textTransform: "uppercase", fontSize: "0.85rem" }}>{o.customer?.name || "—"}</td>
                        <td>
                          <div style={{ fontWeight: 700 }}>{inr(o.grandTotal)}</div>
                          {o.status !== "cancelled" && bal > 0 && (
                            <div style={{ fontSize: "0.75rem", color: "#dc2626" }}>({inr(bal)} unpaid)</div>
                          )}
                        </td>
                        <td><span className={`sales-status sales-status--${pi.tone}`}>{pi.label}</span></td>
                        <td style={{ textAlign: "right", color: "var(--color-text-muted)" }}>›</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {total > 0 && (
            <div className="sales-pagination">
              <span className="sales-pagination__info">
                Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}
              </span>
              <div className="sales-pagination__controls">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}>
                  <FiChevronLeft /> Prev
                </button>
                <span className="sales-pagination__page">Page {page} of {pages}</span>
                <button
                  disabled={page >= pages}
                  onClick={() => setPage((p) => Math.min(pages, p + 1))}>
                  Next <FiChevronRight />
                </button>
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}

export default OrdersPage;
