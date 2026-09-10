// Showroom detail page. Shows the showroom as the parent context with tabs for
// related operations (Overview / Users / Inventory / Sales / Leads / Targets /
// Settings), per spec section 11. Related tabs are placeholders until their modules
// are built in later sprints.
import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { PageHeader, Card, Tabs, Spinner, Button, DataTable, FormField } from "../../../components";
import { usePermissions } from "../../../app/store/permissionStore";
import { useShowroom, useShowroomTargets, useSetTarget } from "../hooks/useShowrooms";

const inr = (n) => `₹${(Number(n) || 0).toLocaleString("en-IN")}`;

const TABS = [
  { key: "overview", label: "Overview" },
  { key: "users", label: "Users" },
  { key: "inventory", label: "Inventory" },
  { key: "sales", label: "Sales" },
  { key: "leads", label: "Leads" },
  { key: "targets", label: "Targets" },
  { key: "settings", label: "Settings" },
];

export function ShowroomDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const [tab, setTab] = useState("overview");
  const { data: showroom, isLoading, isError } = useShowroom(id);
  const { data: targets = [] } = useShowroomTargets(id);
  const setTarget = useSetTarget(id);
  const [targetForm, setTargetForm] = useState({ period: "", amount: "" });

  async function submitTarget(e) {
    e.preventDefault();
    try {
      await setTarget.mutateAsync({ period: targetForm.period, amount: Number(targetForm.amount) });
      setTargetForm({ period: "", amount: "" });
    } catch (err) {
      alert(err.response?.data?.message || "Failed to set target.");
    }
  }

  if (isLoading) return <Spinner />;
  if (isError || !showroom) {
    return (
      <div>
        <p style={{ color: "var(--color-danger)" }}>Showroom not found.</p>
        <Button variant="secondary" onClick={() => navigate("/showrooms")}>
          Back to Showrooms
        </Button>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={
          <span className="detail-header__meta">
            {showroom.name}
            <span className={`badge badge--${showroom.status}`}>{showroom.status}</span>
          </span>
        }
        subtitle={`${showroom.code}${showroom.city ? " · " + showroom.city : ""}`}
        actions={
          <Button variant="secondary" onClick={() => navigate("/showrooms")}>
            Back
          </Button>
        }
      />

      <Tabs tabs={TABS} active={tab} onChange={setTab} />

      <Card>
        {tab === "overview" && (
          <div className="detail-stats">
            <div className="detail-stat">
              <div className="detail-stat__label">Manager</div>
              <div className="detail-stat__value">{showroom.manager?.name || "Not Assigned"}</div>
            </div>
            <div className="detail-stat">
              <div className="detail-stat__label">Sales Executives</div>
              <div className="detail-stat__value">0</div>
            </div>
            <div className="detail-stat">
              <div className="detail-stat__label">Inventory</div>
              <div className="detail-stat__value">0</div>
            </div>
            <div className="detail-stat">
              <div className="detail-stat__label">Sales</div>
              <div className="detail-stat__value">₹0</div>
            </div>
            <div className="detail-stat">
              <div className="detail-stat__label">Leads</div>
              <div className="detail-stat__value">0</div>
            </div>
          </div>
        )}

        {tab === "settings" && (
          <div>
            <p><strong>Address:</strong> {showroom.address || "—"}</p>
            <p><strong>State:</strong> {showroom.state || "—"} &nbsp; <strong>Pincode:</strong> {showroom.pincode || "—"}</p>
            <p><strong>Phone:</strong> {showroom.phone || "—"} &nbsp; <strong>Email:</strong> {showroom.email || "—"}</p>
            <p><strong>GSTIN:</strong> {showroom.gstin || "—"}</p>
            <p><strong>Hours:</strong> {showroom.openingTime || "—"} - {showroom.closingTime || "—"}</p>
          </div>
        )}

        {tab === "targets" && (
          <div>
            {hasPermission("showrooms.edit") && (
              <form onSubmit={submitTarget} style={{ display: "flex", gap: 12, alignItems: "flex-end", marginBottom: 18, flexWrap: "wrap" }}>
                <FormField label="Period (YYYY-MM or YYYY)" htmlFor="t-period">
                  <input id="t-period" value={targetForm.period} onChange={(e) => setTargetForm({ ...targetForm, period: e.target.value })} placeholder="2026-09" required />
                </FormField>
                <FormField label="Target Amount (₹)" htmlFor="t-amount">
                  <input id="t-amount" type="number" min="0" value={targetForm.amount} onChange={(e) => setTargetForm({ ...targetForm, amount: e.target.value })} required />
                </FormField>
                <Button type="submit" disabled={setTarget.isPending}>{setTarget.isPending ? "Saving..." : "Set Target"}</Button>
              </form>
            )}
            <DataTable
              columns={[
                { key: "period", header: "Period" },
                { key: "amount", header: "Target", render: (r) => inr(r.amount) },
                { key: "achieved", header: "Achieved", render: (r) => inr(r.achieved) },
                { key: "percent", header: "Progress", render: (r) => (
                  <div className="target-progress">
                    <div className="target-progress__bar"><div className="target-progress__fill" style={{ width: `${Math.min(r.percent, 100)}%` }} /></div>
                    <span>{r.percent}%</span>
                  </div>
                ) },
              ]}
              rows={targets}
              emptyText="No targets set."
            />
          </div>
        )}

        {tab === "sales" && (
          <div>
            <p className="tab-empty">See the Reports → Sales tab for showroom-wise sales, and the Targets tab for target vs achieved.</p>
          </div>
        )}

        {["users", "inventory", "leads"].includes(tab) && (
          <p className="tab-empty">
            {TABS.find((t) => t.key === tab)?.label}: filter the {tab === "users" ? "Users" : tab === "inventory" ? "Inventory" : "Leads"} page by this showroom to see these records.
          </p>
        )}
      </Card>
    </div>
  );
}

export default ShowroomDetailPage;
