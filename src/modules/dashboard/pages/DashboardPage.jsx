// Executive Dashboard landing page.
// KPI stat cards, quick action shortcuts, recent transactions, lead pipeline overview, and low-stock alerts.
import { useNavigate } from "react-router-dom";
import { PageHeader, Card, Spinner, DataTable, Button } from "../../../components";
import { useAuth } from "../../../app/store/authStore";
import { useDashboard } from "../hooks/useDashboard";
import "./DashboardPage.css";

const inr = (n) => `₹${(Number(n) || 0).toLocaleString("en-IN")}`;

const STAGE_COLORS = {
  new: "#3b82f6",
  contacted: "#8b5cf6",
  qualified: "#06b6d4",
  quotation: "#f59e0b",
  negotiation: "#ec4899",
  won: "#10b981",
  lost: "#64748b",
};

export function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data, isLoading, isError } = useDashboard();

  if (isLoading) return <Spinner />;
  if (isError) {
    return (
      <div>
        <PageHeader title="Dashboard" />
        <p style={{ color: "var(--color-danger)" }}>Failed to load dashboard. Is the API running?</p>
      </div>
    );
  }

  const s = data?.stats || {};
  const cards = [
    { label: "Total Revenue", value: inr(s.totalSales), icon: "💰", color: "#16a34a" },
    { label: "Pending Collection", value: inr(s.pendingPayments), icon: "⏳", color: "#d97706" },
    { label: "Total Orders", value: s.orders ?? 0, icon: "📦", color: "#2563eb" },
    { label: "Active Leads", value: s.leads ?? 0, icon: "🎯", color: "#7c3aed" },
    { label: "Registered Customers", value: s.customers ?? 0, icon: "👥", color: "#0891b2" },
    { label: "Low Stock Alerts", value: s.lowStockCount ?? 0, icon: "⚠️", color: "#dc2626" },
  ];

  return (
    <div>
      <PageHeader
        title={`Welcome, ${user?.name || "Admin"}`}
        subtitle={`Business performance overview · ${user?.showroom?.name ? `Assigned to ${user.showroom.name}` : "All Showrooms & Warehouses"}`}
        actions={
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Button onClick={() => navigate("/orders/create")}>+ New POS Order</Button>
            <Button variant="secondary" onClick={() => navigate("/leads")}>+ New Lead</Button>
          </div>
        }
      />

      {/* Quick Action Bar */}
      <div
        style={{
          display: "flex",
          gap: 12,
          overflowX: "auto",
          padding: "12px 16px",
          backgroundColor: "#ffffff",
          border: "1px solid var(--color-border)",
          borderRadius: 10,
          marginBottom: 20,
        }}
      >
        <button
          type="button"
          onClick={() => navigate("/orders/create")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 14px",
            backgroundColor: "var(--brand-gold-dark, #b45309)",
            color: "#ffffff",
            border: "none",
            borderRadius: 6,
            fontWeight: 600,
            fontSize: "0.85rem",
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
        >
          🛒 Quick Counter Billing (POS)
        </button>
        <button
          type="button"
          onClick={() => navigate("/quotations/create")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 14px",
            backgroundColor: "#f8fafc",
            border: "1px solid #cbd5e1",
            borderRadius: 6,
            fontWeight: 600,
            fontSize: "0.85rem",
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
        >
          📝 Create Quotation
        </button>
        <button
          type="button"
          onClick={() => navigate("/inventory")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 14px",
            backgroundColor: "#f8fafc",
            border: "1px solid #cbd5e1",
            borderRadius: 6,
            fontWeight: 600,
            fontSize: "0.85rem",
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
        >
          🏭 Stock Inward / Audits
        </button>
        <button
          type="button"
          onClick={() => navigate("/transfers")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 14px",
            backgroundColor: "#f8fafc",
            border: "1px solid #cbd5e1",
            borderRadius: 6,
            fontWeight: 600,
            fontSize: "0.85rem",
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
        >
          🚚 Inter-Store Transfers
        </button>
        <button
          type="button"
          onClick={() => navigate("/reports")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 14px",
            backgroundColor: "#f8fafc",
            border: "1px solid #cbd5e1",
            borderRadius: 6,
            fontWeight: 600,
            fontSize: "0.85rem",
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
        >
          📊 Reports & Analytics
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="dashboard__grid">
        {cards.map((c) => (
          <Card key={c.label}>
            <div className="dashboard__stat">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span className="dashboard__stat-label">{c.label}</span>
                <span style={{ fontSize: "1.3rem" }}>{c.icon}</span>
              </div>
              <span className="dashboard__stat-value" style={{ color: c.color }}>
                {c.value}
              </span>
            </div>
          </Card>
        ))}
      </div>

      {/* Recent Orders & Recent Leads */}
      <div className="dashboard__row">
        <Card
          title="Recent Orders"
          actions={
            <Button variant="secondary" onClick={() => navigate("/orders")}>
              View All
            </Button>
          }
        >
          <DataTable
            columns={[
              {
                key: "number",
                header: "Order #",
                render: (r) => (
                  <a
                    onClick={() => navigate(`/orders/${r._id}`)}
                    style={{ color: "var(--brand-gold-dark)", fontWeight: 700, cursor: "pointer" }}
                  >
                    {r.number}
                  </a>
                ),
              },
              { key: "customer", header: "Customer", render: (r) => r.customer?.name || "—" },
              { key: "grandTotal", header: "Total", render: (r) => inr(r.grandTotal) },
              {
                key: "status",
                header: "Status",
                render: (r) => (
                  <span className={`transfer-status transfer-status--${r.status === "delivered" ? "received" : r.status === "cancelled" ? "cancelled" : "approved"}`}>
                    {r.status}
                  </span>
                ),
              },
            ]}
            rows={data?.recentOrders || []}
            emptyText="No orders yet."
          />
        </Card>

        <Card
          title="Recent Leads & Pipeline"
          actions={
            <Button variant="secondary" onClick={() => navigate("/leads")}>
              Kanban Board
            </Button>
          }
        >
          <DataTable
            columns={[
              { key: "customer", header: "Customer", render: (r) => r.customer?.name || "—" },
              {
                key: "stage",
                header: "Stage",
                render: (r) => (
                  <span
                    style={{
                      padding: "2px 8px",
                      borderRadius: 12,
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      backgroundColor: "#f1f5f9",
                      color: STAGE_COLORS[r.stage] || "#475569",
                      border: `1px solid ${STAGE_COLORS[r.stage] || "#cbd5e1"}`,
                      textTransform: "capitalize",
                    }}
                  >
                    {r.stage}
                  </span>
                ),
              },
              { key: "source", header: "Source", render: (r) => <span style={{ textTransform: "capitalize" }}>{r.source}</span> },
            ]}
            rows={data?.recentLeads || []}
            emptyText="No leads yet."
          />
        </Card>
      </div>

      {/* Critical Low Stock Alert Card */}
      <Card
        title="Inventory Reorder Warnings"
        actions={
          <Button variant="secondary" onClick={() => navigate("/inventory")}>
            Manage Stock
          </Button>
        }
      >
        <DataTable
          columns={[
            { key: "product", header: "Product", render: (r) => <strong>{r.product?.name || "—"}</strong> },
            { key: "sku", header: "SKU", render: (r) => <span style={{ fontFamily: "monospace" }}>{r.product?.sku || "—"}</span> },
            { key: "showroom", header: "Location", render: (r) => r.showroom?.name ? `${r.showroom.name} (${r.showroom.code})` : "—" },
            {
              key: "available",
              header: "Available Stock",
              render: (r) => (
                <span style={{ color: "#dc2626", fontWeight: 800 }}>
                  {r.available} units (Safety Min: {r.minStock || 0})
                </span>
              ),
            },
          ]}
          rows={data?.lowStock || []}
          emptyText="All products are well above minimum safety thresholds."
        />
      </Card>
    </div>
  );
}

export default DashboardPage;
