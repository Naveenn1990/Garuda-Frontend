// Dashboard landing page. KPI stat cards + recent orders / leads / low-stock, all
// wired to the /dashboard/stats aggregation endpoint.
import { PageHeader, Card, Spinner, DataTable } from "../../../components";
import { useAuth } from "../../../app/store/authStore";
import { useDashboard } from "../hooks/useDashboard";
import "./DashboardPage.css";

const inr = (n) => `₹${(Number(n) || 0).toLocaleString("en-IN")}`;

export function DashboardPage() {
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
    { label: "Customers", value: s.customers ?? 0 },
    { label: "Active Leads", value: s.leads ?? 0 },
    { label: "Orders", value: s.orders ?? 0 },
    { label: "Total Sales", value: inr(s.totalSales) },
    { label: "Pending Payments", value: inr(s.pendingPayments) },
    { label: "Low Stock Items", value: s.lowStockCount ?? 0 },
  ];

  return (
    <div>
      <PageHeader
        title={`Good day, ${user?.name || "there"}`}
        subtitle="Business overview across all showrooms"
      />

      <div className="dashboard__grid">
        {cards.map((c) => (
          <Card key={c.label}>
            <div className="dashboard__stat">
              <span className="dashboard__stat-value">{c.value}</span>
              <span className="dashboard__stat-label">{c.label}</span>
            </div>
          </Card>
        ))}
      </div>

      <div className="dashboard__row">
        <Card title="Recent Orders">
          <DataTable
            columns={[
              { key: "number", header: "Order #" },
              { key: "customer", header: "Customer", render: (r) => r.customer?.name || "—" },
              { key: "grandTotal", header: "Total", render: (r) => inr(r.grandTotal) },
              { key: "status", header: "Status", render: (r) => r.status },
            ]}
            rows={data?.recentOrders || []}
            emptyText="No orders yet."
          />
        </Card>

        <Card title="Recent Leads">
          <DataTable
            columns={[
              { key: "customer", header: "Customer", render: (r) => r.customer?.name || "—" },
              { key: "stage", header: "Stage", render: (r) => r.stage },
              { key: "source", header: "Source", render: (r) => r.source },
            ]}
            rows={data?.recentLeads || []}
            emptyText="No leads yet."
          />
        </Card>
      </div>

      <Card title="Low Stock">
        <DataTable
          columns={[
            { key: "product", header: "Product", render: (r) => r.product?.name || "—" },
            { key: "sku", header: "SKU", render: (r) => r.product?.sku || "—" },
            { key: "showroom", header: "Showroom", render: (r) => r.showroom?.code || "—" },
            { key: "available", header: "Available" },
            { key: "minStock", header: "Min" },
          ]}
          rows={data?.lowStock || []}
          emptyText="No low-stock items."
        />
      </Card>
    </div>
  );
}

export default DashboardPage;
