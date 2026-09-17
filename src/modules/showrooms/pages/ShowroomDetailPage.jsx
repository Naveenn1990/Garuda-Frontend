// Showroom detail page. Shows the showroom as the parent context with tabs for
// related operations (Overview / Users / Inventory / Sales / Leads / Targets /
// Settings), per spec section 11. Related tabs are placeholders until their modules
// are built in later sprints.
import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { FiArrowRight, FiPackage, FiTrendingDown, FiAlertTriangle, FiClock, FiTruck } from "react-icons/fi";
import { PageHeader, Card, Tabs, Spinner, Button, DataTable, FormField } from "../../../components";
import { usePermissions } from "../../../app/store/permissionStore";
import { useShowroom, useShowroomTargets, useSetTarget, useUpdateShowroom } from "../hooks/useShowrooms";
import { useInventory, useStockLedger } from "../../inventory/hooks/useInventory";
import { useTransfers } from "../../transfers/hooks/useTransfers";
import CoordinatePicker from "../components/CoordinatePicker";

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
  const { data: stockRows = [] } = useInventory({ showroom: id });
  const setTarget = useSetTarget(id);
  const [targetForm, setTargetForm] = useState({ period: "", amount: "" });

  // Derived overview metrics from live stock.
  const productsInStock = stockRows.length;
  const totalUnits = stockRows.reduce((s, r) => s + (r.available || 0), 0);
  const soldUnits = stockRows.reduce((s, r) => s + (r.sold || 0), 0);

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
              <div className="detail-stat__label">Type</div>
              <div className="detail-stat__value" style={{ textTransform: "capitalize" }}>
                {showroom.type === "warehouse" ? "🏭 Warehouse" : "🏪 Showroom"}
              </div>
            </div>
            <div className="detail-stat">
              <div className="detail-stat__label">Products in Stock</div>
              <div className="detail-stat__value">{productsInStock}</div>
            </div>
            <div className="detail-stat">
              <div className="detail-stat__label">Units Available</div>
              <div className="detail-stat__value">{totalUnits}</div>
            </div>
            <div className="detail-stat">
              <div className="detail-stat__label">Units Sold</div>
              <div className="detail-stat__value">{soldUnits}</div>
            </div>
          </div>
        )}

        {tab === "settings" && (
          <ShowroomSettingsTab showroom={showroom} id={id} />
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

        {tab === "inventory" && (
          <ShowroomInventoryTab showroomId={id} />
        )}

        {tab === "sales" && (
          <div>
            <p className="tab-empty">See the Reports → Sales tab for showroom-wise sales, and the Targets tab for target vs achieved.</p>
          </div>
        )}

        {["users", "leads"].includes(tab) && (
          <p className="tab-empty">
            {TABS.find((t) => t.key === tab)?.label}: filter the {tab === "users" ? "Users" : "Leads"} page by this showroom to see these records.
          </p>
        )}
      </Card>
    </div>
  );
}

// ── Settings tab ─────────────────────────────────────────────────────────────
// Lets admins/managers edit every showroom field, including the lat/lng
// coordinates that drive the customer-facing nearest-store map.
function ShowroomSettingsTab({ showroom, id }) {
  const { hasPermission } = usePermissions();
  const canEdit = hasPermission("showrooms.edit");
  const update = useUpdateShowroom(id);

  const [form, setForm] = useState(() => {
    // Guard against stale/bad coordinate values already in the DB
    // (e.g. a pincode that got saved as lat/lng by mistake).
    const rawLat = showroom.lat ?? "";
    const rawLng = showroom.lng ?? "";
    const latNum = Number(rawLat);
    const lngNum = Number(rawLng);
    const validLat = rawLat !== "" && !isNaN(latNum) && latNum >= -90  && latNum <= 90;
    const validLng = rawLng !== "" && !isNaN(lngNum) && lngNum >= -180 && lngNum <= 180;
    return {
      name:        showroom.name        || "",
      code:        showroom.code        || "",
      type:        showroom.type        || "showroom",
      address:     showroom.address     || "",
      city:        showroom.city        || "",
      state:       showroom.state       || "",
      pincode:     showroom.pincode     || "",
      lat:         validLat ? String(rawLat) : "",
      lng:         validLng ? String(rawLng) : "",
      phone:       showroom.phone       || "",
      email:       showroom.email       || "",
      gstin:       showroom.gstin       || "",
      openingTime: showroom.openingTime || "",
      closingTime: showroom.closingTime || "",
      status:      showroom.status      || "active",
    };
  });
  const [saved, setSaved] = useState(false);
  const [err, setErr]     = useState("");

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    setErr(""); setSaved(false);
    try {
      await update.mutateAsync(form);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      setErr(error.response?.data?.message || "Failed to save changes.");
    }
  }

  const isWarehouse = form.type === "warehouse";

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-section__title">Location Type</div>
      <div className="form-grid">
        <FormField label="Type *" htmlFor="s-type">
          <select id="s-type" value={form.type} onChange={set("type")} disabled={!canEdit}>
            <option value="showroom">🏪 Showroom (retail — sells to customers)</option>
            <option value="warehouse">🏭 Warehouse (godown — holds & supplies stock)</option>
          </select>
        </FormField>
      </div>
      <p style={{ fontSize: "0.82rem", color: "var(--color-text-muted)", margin: "-4px 0 4px" }}>
        {isWarehouse
          ? "Stock is received (inward) into warehouses, then transferred to showrooms."
          : "Showrooms receive stock via transfers from warehouses and sell to customers."}
      </p>

      <div className="form-section__title">Basic Information</div>
      <div className="form-grid">
        <FormField label={`${isWarehouse ? "Warehouse" : "Showroom"} Name *`} htmlFor="s-name">
          <input id="s-name" value={form.name} onChange={set("name")} required disabled={!canEdit} />
        </FormField>
        <FormField label="Code *" htmlFor="s-code">
          <input id="s-code" value={form.code} onChange={set("code")} required disabled={!canEdit} />
        </FormField>
      </div>

      <FormField label="Address" htmlFor="s-address">
        <input id="s-address" value={form.address} onChange={set("address")} disabled={!canEdit} />
      </FormField>
      <div className="form-grid">
        <FormField label="City *" htmlFor="s-city">
          <input id="s-city" value={form.city} onChange={set("city")} required disabled={!canEdit} />
        </FormField>
        <FormField label="State *" htmlFor="s-state">
          <input id="s-state" value={form.state} onChange={set("state")} required disabled={!canEdit} />
        </FormField>
        <FormField label="Pincode" htmlFor="s-pincode">
          <input id="s-pincode" value={form.pincode} onChange={set("pincode")} disabled={!canEdit} />
        </FormField>
      </div>

      {!isWarehouse && (
        <>
          <div className="form-section__title">Map Coordinates</div>
          <p style={{ fontSize: "0.85rem", color: "var(--color-text-muted)", margin: "0 0 12px" }}>
            Set the map pin for this showroom — customers use this to find the nearest store.
          </p>
          <CoordinatePicker
            lat={form.lat}
            lng={form.lng}
            onChange={({ lat, lng }) => setForm((f) => ({ ...f, lat, lng }))}
            disabled={!canEdit}
          />
        </>
      )}

      <div className="form-section__title">Contact Information</div>
      <div className="form-grid">
        <FormField label="Phone" htmlFor="s-phone">
          <input id="s-phone" value={form.phone} onChange={set("phone")} disabled={!canEdit} />
        </FormField>
        <FormField label="Email" htmlFor="s-email">
          <input id="s-email" type="email" value={form.email} onChange={set("email")} disabled={!canEdit} />
        </FormField>
      </div>

      <div className="form-section__title">Business Information</div>
      <div className="form-grid">
        <FormField label="GSTIN" htmlFor="s-gstin">
          <input id="s-gstin" value={form.gstin} onChange={set("gstin")} disabled={!canEdit} />
        </FormField>
      </div>

      <div className="form-section__title">Operating Details</div>
      <div className="form-grid">
        <FormField label="Opening Time" htmlFor="s-open">
          <input id="s-open" value={form.openingTime} onChange={set("openingTime")}
            placeholder="10:00 AM" disabled={!canEdit} />
        </FormField>
        <FormField label="Closing Time" htmlFor="s-close">
          <input id="s-close" value={form.closingTime} onChange={set("closingTime")}
            placeholder="08:00 PM" disabled={!canEdit} />
        </FormField>
        <FormField label="Status" htmlFor="s-status">
          <select id="s-status" value={form.status} onChange={set("status")} disabled={!canEdit}>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </FormField>
      </div>

      {err  && <p style={{ color: "var(--color-danger)", marginTop: 8 }}>{err}</p>}
      {saved && <p style={{ color: "var(--color-success, #2e7d32)", marginTop: 8 }}>Changes saved.</p>}

      {canEdit && (
        <div className="form-actions">
          <Button type="submit" disabled={update.isPending}>
            {update.isPending ? "Saving…" : "Save Changes"}
          </Button>
        </div>
      )}
    </form>
  );
}

// ── Inventory tab ─────────────────────────────────────────────────────────────
// Live stock levels + movement history (where/when stock came from) + incoming
// and outgoing transfers for this showroom.
const LEDGER_TYPE_LABEL = {
  inward: "Inward",
  outward: "Sold / Out",
  adjustment: "Adjustment",
  transfer_in: "Transfer In",
  transfer_out: "Transfer Out",
  damaged: "Damaged",
};

const LEDGER_TYPE_COLOR = {
  inward: "#155724",
  transfer_in: "#155724",
  outward: "#721c24",
  transfer_out: "#856404",
  adjustment: "#004085",
  damaged: "#721c24",
};

function fmtDateTime(d) {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

function ShowroomInventoryTab({ showroomId }) {
  const [subtab, setSubtab] = useState("stock"); // stock | history | transfers
  const { data: stock = [], isLoading: stockLoading } = useInventory({ showroom: showroomId });
  const { data: ledger = [], isLoading: ledgerLoading } = useStockLedger({ showroom: showroomId });
  const { data: transfers = [], isLoading: transfersLoading } = useTransfers();

  // Transfers touching this showroom (incoming or outgoing).
  const related = transfers.filter(
    (t) => String(t.fromShowroom?._id) === String(showroomId) ||
           String(t.toShowroom?._id) === String(showroomId)
  );

  const totalUnits = stock.reduce((s, r) => s + (r.available || 0), 0);
  const lowCount   = stock.filter((r) => r.available <= (r.minStock || 0)).length;

  return (
    <div>
      {/* Summary chips */}
      <div style={{ display: "flex", gap: 12, marginBottom: 18, flexWrap: "wrap" }}>
        <StatChip icon={FiPackage} label="Products in stock" value={stock.length} />
        <StatChip icon={FiTrendingDown} label="Total units available" value={totalUnits} />
        <StatChip icon={FiAlertTriangle} label="Low stock items" value={lowCount} danger={lowCount > 0} />
      </div>

      {/* Sub-tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, borderBottom: "1px solid var(--color-line, #eee)" }}>
        {[
          { key: "stock", label: "Current Stock" },
          { key: "history", label: "Stock History" },
          { key: "transfers", label: `Transfers${related.length ? ` (${related.length})` : ""}` },
        ].map((s) => (
          <button
            key={s.key}
            onClick={() => setSubtab(s.key)}
            style={{
              background: "none",
              border: "none",
              borderBottom: subtab === s.key ? "2px solid var(--brand-gold, #b58a2e)" : "2px solid transparent",
              padding: "8px 12px",
              cursor: "pointer",
              fontWeight: subtab === s.key ? 700 : 500,
              color: subtab === s.key ? "var(--brand-gold, #b58a2e)" : "var(--color-text-muted)",
            }}>
            {s.label}
          </button>
        ))}
      </div>

      {/* Current stock */}
      {subtab === "stock" && (
        stockLoading ? <Spinner /> : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Product</th><th>SKU</th>
                <th style={{ textAlign: "right" }}>Available</th>
                <th style={{ textAlign: "right" }}>Reserved</th>
                <th style={{ textAlign: "right" }}>Sold</th>
                <th style={{ textAlign: "right" }}>Damaged</th>
              </tr>
            </thead>
            <tbody>
              {stock.length === 0 ? (
                <tr><td className="data-table__empty" colSpan={6}>No stock at this showroom yet.</td></tr>
              ) : (
                stock.map((r) => {
                  const low = r.available <= (r.minStock || 0);
                  return (
                    <tr key={r._id}>
                      <td>{r.product?.name || "—"}</td>
                      <td style={{ fontFamily: "monospace", color: "var(--color-text-muted)" }}>{r.product?.sku || "—"}</td>
                      <td style={{ textAlign: "right", fontWeight: 700 }}>
                        {r.available}
                        {low && <span style={{ marginLeft: 6, fontSize: "0.7rem", background: "#f8d7da", color: "#721c24", padding: "1px 6px", borderRadius: 999 }}>low</span>}
                      </td>
                      <td style={{ textAlign: "right" }}>{r.reserved}</td>
                      <td style={{ textAlign: "right" }}>{r.sold}</td>
                      <td style={{ textAlign: "right" }}>{r.damaged}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        )
      )}

      {/* Stock history — where/when stock came from */}
      {subtab === "history" && (
        ledgerLoading ? <Spinner /> : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th><th>Product</th><th>Type</th>
                <th style={{ textAlign: "right" }}>Qty</th>
                <th style={{ textAlign: "right" }}>Balance</th>
                <th>Note</th><th>By</th>
              </tr>
            </thead>
            <tbody>
              {ledger.length === 0 ? (
                <tr><td className="data-table__empty" colSpan={7}>No stock movements recorded.</td></tr>
              ) : (
                ledger.map((l) => (
                  <tr key={l._id}>
                    <td style={{ whiteSpace: "nowrap", fontSize: "0.82rem", color: "var(--color-text-muted)" }}>{fmtDateTime(l.createdAt)}</td>
                    <td>{l.product?.name || l.product?.sku || "—"}</td>
                    <td>
                      <span style={{ color: LEDGER_TYPE_COLOR[l.type] || "inherit", fontWeight: 600, fontSize: "0.85rem" }}>
                        {LEDGER_TYPE_LABEL[l.type] || l.type}
                      </span>
                    </td>
                    <td style={{ textAlign: "right", fontWeight: 700, color: l.quantity >= 0 ? "#155724" : "#721c24" }}>
                      {l.quantity >= 0 ? `+${l.quantity}` : l.quantity}
                    </td>
                    <td style={{ textAlign: "right" }}>{l.balance}</td>
                    <td style={{ fontSize: "0.82rem", color: "var(--color-text-muted)" }}>{l.note || "—"}</td>
                    <td style={{ fontSize: "0.82rem", color: "var(--color-text-muted)" }}>{l.createdBy?.name || "—"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )
      )}

      {/* Transfers touching this showroom */}
      {subtab === "transfers" && (
        transfersLoading ? <Spinner /> : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th><th>Direction</th><th>Other Location</th>
                <th>Products</th><th>Status</th><th></th>
              </tr>
            </thead>
            <tbody>
              {related.length === 0 ? (
                <tr><td className="data-table__empty" colSpan={6}>No transfers involving this showroom.</td></tr>
              ) : (
                related.map((t) => {
                  const incoming = String(t.toShowroom?._id) === String(showroomId);
                  const other = incoming ? t.fromShowroom : t.toShowroom;
                  return (
                    <tr key={t._id}>
                      <td style={{ whiteSpace: "nowrap", fontSize: "0.82rem", color: "var(--color-text-muted)" }}>
                        {new Date(t.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                      </td>
                      <td>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontWeight: 600, color: incoming ? "#155724" : "#856404" }}>
                          {incoming ? "⬇ Incoming" : "⬆ Outgoing"}
                        </span>
                      </td>
                      <td>{other?.name || "—"} <span style={{ color: "var(--color-text-muted)", fontSize: "0.8rem" }}>({other?.code})</span></td>
                      <td style={{ fontSize: "0.85rem" }}>
                        {(t.items || []).map((i) => `${i.product?.sku || "?"}×${i.quantity}`).join(", ")}
                      </td>
                      <td style={{ textTransform: "capitalize", fontSize: "0.85rem", fontWeight: 600 }}>{t.status}</td>
                      <td>
                        <Link to={`/transfers/${t._id}`} style={{ color: "var(--brand-gold, #b58a2e)", fontWeight: 600, fontSize: "0.85rem" }}>
                          View →
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        )
      )}
    </div>
  );
}

function StatChip({ icon: Icon, label, value, danger }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10,
      padding: "12px 16px",
      background: danger ? "#fff5f5" : "var(--color-surface, #fafafa)",
      border: `1px solid ${danger ? "#ffc9c9" : "var(--color-line, #eee)"}`,
      borderRadius: 10, minWidth: 160,
    }}>
      <Icon size={20} color={danger ? "#c0392b" : "var(--brand-gold, #b58a2e)"} />
      <div>
        <div style={{ fontSize: "1.3rem", fontWeight: 800, lineHeight: 1, color: danger ? "#c0392b" : "inherit" }}>{value}</div>
        <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginTop: 2 }}>{label}</div>
      </div>
    </div>
  );
}

export default ShowroomDetailPage;
