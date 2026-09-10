// Customer 360 detail page. Tabs: Profile / Addresses / Leads / Follow-ups /
// Quotations / Orders / Payments / Deliveries / Activity Timeline. Uses the related
// data returned by GET /customers/:id.
import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { PageHeader, Card, Tabs, DataTable, Spinner, Button } from "../../../components";
import { useCustomer } from "../hooks/useCustomers";

const TABS = [
  { key: "profile", label: "Profile" },
  { key: "addresses", label: "Addresses" },
  { key: "leads", label: "Leads" },
  { key: "followups", label: "Follow-ups" },
  { key: "quotations", label: "Quotations" },
  { key: "orders", label: "Orders" },
  { key: "payments", label: "Payments" },
  { key: "deliveries", label: "Deliveries" },
  { key: "timeline", label: "Activity" },
];

const inr = (n) => (typeof n === "number" ? `₹${n.toLocaleString("en-IN")}` : "—");

export function CustomerDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tab, setTab] = useState("profile");
  const { data, isLoading, isError } = useCustomer(id);

  if (isLoading) return <Spinner />;
  if (isError || !data?.item) {
    return (
      <div>
        <p style={{ color: "var(--color-danger)" }}>Customer not found.</p>
        <Button variant="secondary" onClick={() => navigate("/customers")}>Back</Button>
      </div>
    );
  }

  const c = data.item;
  const { leads = [], quotations = [], orders = [], payments = [], deliveries = [] } = data.related || {};

  // Build a simple activity timeline by merging dated events across relations.
  const timeline = [
    { at: c.createdAt, label: "Customer created" },
    ...leads.map((l) => ({ at: l.createdAt, label: `Lead raised (${l.stage})` })),
    ...quotations.map((q) => ({ at: q.createdAt, label: `Quotation ${q.number} (${q.status})` })),
    ...orders.map((o) => ({ at: o.createdAt, label: `Order ${o.number} (${o.status})` })),
    ...payments.map((p) => ({ at: p.createdAt, label: `Payment ${inr(p.amount)} (${p.mode})` })),
  ]
    .filter((e) => e.at)
    .sort((a, b) => new Date(b.at) - new Date(a.at));

  return (
    <div>
      <PageHeader
        title={<span className="detail-header__meta">{c.name}<span className={`badge badge--${c.status}`}>{c.status}</span></span>}
        subtitle={`${c.mobile}${c.email ? " · " + c.email : ""}`}
        actions={<Button variant="secondary" onClick={() => navigate("/customers")}>Back</Button>}
      />

      <Tabs tabs={TABS} active={tab} onChange={setTab} />

      <Card>
        {tab === "profile" && (
          <div className="detail-stats">
            <div className="detail-stat"><div className="detail-stat__label">Segment</div><div className="detail-stat__value" style={{ textTransform: "capitalize" }}>{c.segment}</div></div>
            <div className="detail-stat"><div className="detail-stat__label">Source</div><div className="detail-stat__value" style={{ textTransform: "capitalize" }}>{c.source}</div></div>
            <div className="detail-stat"><div className="detail-stat__label">Showroom</div><div className="detail-stat__value">{c.assignedShowroom?.code || "—"}</div></div>
            <div className="detail-stat"><div className="detail-stat__label">Salesperson</div><div className="detail-stat__value">{c.assignedSalesperson?.name || "—"}</div></div>
            <div className="detail-stat"><div className="detail-stat__label">Orders</div><div className="detail-stat__value">{orders.length}</div></div>
            <div className="detail-stat"><div className="detail-stat__label">Leads</div><div className="detail-stat__value">{leads.length}</div></div>
          </div>
        )}

        {tab === "addresses" && (
          <div>
            <p><strong>Address:</strong> {c.address || "—"}</p>
            <p><strong>City:</strong> {c.city || "—"} &nbsp; <strong>State:</strong> {c.state || "—"} &nbsp; <strong>Pincode:</strong> {c.pincode || "—"}</p>
          </div>
        )}

        {tab === "leads" && (
          <DataTable
            columns={[
              { key: "product", header: "Product", render: (r) => r.product?.name || "—" },
              { key: "stage", header: "Stage" },
              { key: "source", header: "Source" },
              { key: "budget", header: "Budget", render: (r) => inr(r.budget) },
            ]}
            rows={leads}
            emptyText="No leads."
          />
        )}

        {tab === "followups" && (
          <div className="timeline">
            {leads.flatMap((l) => (l.notes || []).map((n, i) => (
              <div key={`${l._id}-${i}`} className="timeline__item">
                <strong>{n.text}</strong>
                <span>{n.at ? new Date(n.at).toLocaleString() : ""}</span>
              </div>
            )))}
            {leads.every((l) => !(l.notes || []).length) && <p className="tab-empty">No follow-ups logged.</p>}
          </div>
        )}

        {tab === "quotations" && (
          <DataTable
            columns={[
              { key: "number", header: "Quote #" },
              { key: "status", header: "Status" },
              { key: "grandTotal", header: "Total", render: (r) => inr(r.grandTotal) },
            ]}
            rows={quotations}
            emptyText="No quotations."
          />
        )}

        {tab === "orders" && (
          <DataTable
            columns={[
              { key: "number", header: "Order #", render: (r) => (
                <a onClick={() => navigate(`/orders/${r._id}`)} style={{ color: "var(--brand-gold-dark)", cursor: "pointer", fontWeight: 600 }}>{r.number}</a>
              ) },
              { key: "grandTotal", header: "Total", render: (r) => inr(r.grandTotal) },
              { key: "paymentStatus", header: "Payment" },
              { key: "status", header: "Status" },
            ]}
            rows={orders}
            emptyText="No orders."
          />
        )}

        {tab === "payments" && (
          <DataTable
            columns={[
              { key: "createdAt", header: "Date", render: (r) => new Date(r.createdAt).toLocaleDateString() },
              { key: "order", header: "Order", render: (r) => r.order?.number || "—" },
              { key: "amount", header: "Amount", render: (r) => inr(r.amount) },
              { key: "mode", header: "Mode" },
            ]}
            rows={payments}
            emptyText="No payments."
          />
        )}

        {tab === "deliveries" && (
          <DataTable
            columns={[
              { key: "order", header: "Order", render: (r) => r.order?.number || "—" },
              { key: "scheduledDate", header: "Scheduled", render: (r) => r.scheduledDate ? new Date(r.scheduledDate).toLocaleDateString() : "—" },
              { key: "status", header: "Status" },
            ]}
            rows={deliveries}
            emptyText="No deliveries."
          />
        )}

        {tab === "timeline" && (
          <div className="timeline">
            {timeline.length === 0 ? (
              <p className="tab-empty">No activity yet.</p>
            ) : (
              timeline.map((e, i) => (
                <div key={i} className="timeline__item">
                  <strong>{e.label}</strong>
                  <span>{new Date(e.at).toLocaleString()}</span>
                </div>
              ))
            )}
          </div>
        )}
      </Card>
    </div>
  );
}

export default CustomerDetailPage;
