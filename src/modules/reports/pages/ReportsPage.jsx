// Reports & Analytics. Tabs for Sales / Leads / Payments / Inventory / Customers, each
// backed by an aggregation endpoint, with a date-range filter and CSV export.
import { useState } from "react";
import { PageHeader, Card, Tabs, DataTable, Spinner, ExportButton } from "../../../components";
import { useReport } from "../hooks/useReports";

const inr = (n) => `₹${(Number(n) || 0).toLocaleString("en-IN")}`;

const TABS = [
  { key: "sales", label: "Sales" },
  { key: "leads", label: "Leads" },
  { key: "payments", label: "Payments" },
  { key: "inventory", label: "Inventory" },
  { key: "customers", label: "Customers" },
];

export function ReportsPage() {
  const [tab, setTab] = useState("sales");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const params = {};
  if (from) params.from = from;
  if (to) params.to = to;
  const { data, isLoading, isError } = useReport(tab, params);

  return (
    <div>
      <PageHeader title="Reports & Analytics" subtitle="Business insights across modules" />

      <div className="report-filters">
        <label>From <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></label>
        <label>To <input type="date" value={to} onChange={(e) => setTo(e.target.value)} /></label>
      </div>

      <Tabs tabs={TABS} active={tab} onChange={setTab} />

      {isLoading ? (
        <Spinner />
      ) : isError ? (
        <p style={{ color: "var(--color-danger)" }}>Failed to load report. Is the API running?</p>
      ) : (
        <div>
          {tab === "sales" && <SalesReport data={data} />}
          {tab === "leads" && <LeadsReport data={data} />}
          {tab === "payments" && <PaymentsReport data={data} />}
          {tab === "inventory" && <InventoryReport data={data} />}
          {tab === "customers" && <CustomersReport data={data} />}
        </div>
      )}
    </div>
  );
}

function StatRow({ items }) {
  return (
    <div className="detail-stats" style={{ marginBottom: 16 }}>
      {items.map((s) => (
        <div key={s.label} className="detail-stat">
          <div className="detail-stat__label">{s.label}</div>
          <div className="detail-stat__value">{s.value}</div>
        </div>
      ))}
    </div>
  );
}

function SalesReport({ data }) {
  const t = data.totals || {};
  return (
    <Card
      title="Sales by Showroom"
      actions={<ExportButton rows={data.rows || []} columns={[
        { header: "Showroom", value: (r) => r.showroom || "" },
        { header: "Code", value: (r) => r.code || "" },
        { header: "Orders", value: (r) => r.orders },
        { header: "Revenue", value: (r) => r.revenue },
      ]} filename="sales-report.csv" />}
    >
      <StatRow items={[
        { label: "Orders", value: t.orders || 0 },
        { label: "Revenue", value: inr(t.revenue) },
        { label: "Collected", value: inr(t.collected) },
      ]} />
      <DataTable
        columns={[
          { key: "showroom", header: "Showroom", render: (r) => r.showroom || "—" },
          { key: "code", header: "Code", render: (r) => r.code || "—" },
          { key: "orders", header: "Orders" },
          { key: "revenue", header: "Revenue", render: (r) => inr(r.revenue) },
        ]}
        rows={data.rows || []}
        emptyText="No sales in this period."
      />
    </Card>
  );
}

function LeadsReport({ data }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
      <Card title="Leads by Stage">
        <DataTable columns={[{ key: "_id", header: "Stage" }, { key: "count", header: "Count" }]} rows={data.byStage || []} emptyText="No leads." />
      </Card>
      <Card title="Leads by Source">
        <DataTable columns={[{ key: "_id", header: "Source" }, { key: "count", header: "Count" }]} rows={data.bySource || []} emptyText="No leads." />
      </Card>
    </div>
  );
}

function PaymentsReport({ data }) {
  const t = data.totals || {};
  return (
    <Card
      title="Payments by Mode"
      actions={<ExportButton rows={data.byMode || []} columns={[
        { header: "Mode", value: (r) => r._id },
        { header: "Count", value: (r) => r.count },
        { header: "Amount", value: (r) => r.amount },
      ]} filename="payments-report.csv" />}
    >
      <StatRow items={[
        { label: "Total Collected", value: inr(t.amount) },
        { label: "Transactions", value: t.count || 0 },
      ]} />
      <DataTable
        columns={[
          { key: "_id", header: "Mode" },
          { key: "count", header: "Count" },
          { key: "amount", header: "Amount", render: (r) => inr(r.amount) },
        ]}
        rows={data.byMode || []}
        emptyText="No payments in this period."
      />
    </Card>
  );
}

function InventoryReport({ data }) {
  return (
    <Card
      title="Stock by Showroom"
      actions={<ExportButton rows={data.rows || []} columns={[
        { header: "Showroom", value: (r) => r.showroom || "" },
        { header: "Available", value: (r) => r.available },
        { header: "Reserved", value: (r) => r.reserved },
        { header: "Sold", value: (r) => r.sold },
        { header: "Damaged", value: (r) => r.damaged },
      ]} filename="inventory-report.csv" />}
    >
      <DataTable
        columns={[
          { key: "showroom", header: "Showroom", render: (r) => r.showroom || "—" },
          { key: "available", header: "Available" },
          { key: "reserved", header: "Reserved" },
          { key: "sold", header: "Sold" },
          { key: "damaged", header: "Damaged" },
        ]}
        rows={data.rows || []}
        emptyText="No stock records."
      />
    </Card>
  );
}

function CustomersReport({ data }) {
  return (
    <Card title="Customers by Segment">
      <StatRow items={[{ label: "Total Customers", value: data.total || 0 }]} />
      <DataTable
        columns={[{ key: "_id", header: "Segment" }, { key: "count", header: "Count" }]}
        rows={data.bySegment || []}
        emptyText="No customers."
      />
    </Card>
  );
}

export default ReportsPage;
