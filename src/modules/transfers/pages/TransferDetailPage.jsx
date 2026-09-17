// Transfer Detail — shows full timeline, product list, and workflow action buttons.
import { useParams, useNavigate } from "react-router-dom";
import { FiArrowRight, FiCheck, FiClock, FiTruck, FiPackage, FiXCircle } from "react-icons/fi";
import { PageHeader, Card, Button, Spinner } from "../../../components";
import { usePermissions } from "../../../app/store/permissionStore";
import { useTransfer, useTransferAction } from "../hooks/useTransfers";

// ── Timeline step config ────────────────────────────────────────────────────
const STEPS = [
  { key: "requested",  label: "Requested",  icon: FiClock },
  { key: "approved",   label: "Approved",   icon: FiCheck },
  { key: "dispatched", label: "Dispatched", icon: FiTruck },
  { key: "received",   label: "Received",   icon: FiPackage },
];

const STEP_ORDER = ["requested", "approved", "dispatched", "received"];

const STATUS_STYLE = {
  requested:  { bg: "#fff3cd", color: "#856404" },
  approved:   { bg: "#cce5ff", color: "#004085" },
  dispatched: { bg: "#d1ecf1", color: "#0c5460" },
  received:   { bg: "#d4edda", color: "#155724" },
  cancelled:  { bg: "#f8d7da", color: "#721c24" },
  rejected:   { bg: "#f8d7da", color: "#721c24" },
};

const NEXT_ACTIONS = {
  requested:  [{ action: "approve",  label: "Approve Transfer",  variant: "primary" },
               { action: "reject",   label: "Reject",            variant: "danger"  }],
  approved:   [{ action: "dispatch", label: "Mark Dispatched",   variant: "primary" },
               { action: "cancel",   label: "Cancel",            variant: "secondary" }],
  dispatched: [{ action: "receive",  label: "Confirm Received",  variant: "primary"  }],
  received:   [],
  cancelled:  [],
  rejected:   [],
};

function fmt(date) {
  if (!date) return "—";
  return new Date(date).toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export function TransferDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const { data: transfer, isLoading, isError } = useTransfer(id);
  const transferAction = useTransferAction();
  const canTransfer = hasPermission("inventory.transfer");

  async function doAction(action) {
    if (!window.confirm(`${action.charAt(0).toUpperCase() + action.slice(1)} this transfer?`))
      return;
    try {
      await transferAction.mutateAsync({ id, action });
    } catch (err) {
      alert(err.response?.data?.message || "Action failed.");
    }
  }

  if (isLoading) return <Spinner />;
  if (isError || !transfer) {
    return (
      <div>
        <p style={{ color: "var(--color-danger)" }}>Transfer not found.</p>
        <Button variant="secondary" onClick={() => navigate("/transfers")}>Back</Button>
      </div>
    );
  }

  const isCancelledOrRejected = ["cancelled", "rejected"].includes(transfer.status);
  const currentStepIndex = STEP_ORDER.indexOf(transfer.status);
  const actions = NEXT_ACTIONS[transfer.status] || [];

  return (
    <div>
      <PageHeader
        title={
          <span style={{ display: "flex", alignItems: "center", gap: 12 }}>
            Stock Transfer
            <span style={{
              ...STATUS_STYLE[transfer.status],
              background: STATUS_STYLE[transfer.status]?.bg,
              padding: "3px 12px",
              borderRadius: 999,
              fontSize: "0.8rem",
              fontWeight: 700,
              textTransform: "capitalize",
            }}>
              {transfer.status}
            </span>
          </span>
        }
        subtitle={`Created ${fmt(transfer.createdAt)}${transfer.requestedBy?.name ? " by " + transfer.requestedBy.name : ""}`}
        actions={
          <Button variant="secondary" onClick={() => navigate("/transfers")}>
            ← Back to Transfers
          </Button>
        }
      />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 20, alignItems: "start" }}>

        {/* ── Left column ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Route card */}
          <Card>
            <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.06em" }}>From</div>
                <div style={{ fontWeight: 800, fontSize: "1.1rem" }}>{transfer.fromShowroom?.name || "—"}</div>
                <div style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>
                  {transfer.fromShowroom?.type === "warehouse" ? "🏭 Warehouse" : "🏪 Showroom"} · {transfer.fromShowroom?.code}
                </div>
              </div>

              <FiArrowRight size={28} color="var(--color-text-muted)" style={{ flexShrink: 0 }} />

              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.06em" }}>To</div>
                <div style={{ fontWeight: 800, fontSize: "1.1rem" }}>{transfer.toShowroom?.name || "—"}</div>
                <div style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>
                  🏪 Showroom · {transfer.toShowroom?.code}
                </div>
              </div>
            </div>
            {transfer.note && (
              <p style={{ marginTop: 14, padding: "10px 14px", background: "var(--color-surface, #fafafa)", borderRadius: 8, fontSize: "0.9rem", color: "var(--color-text-muted)" }}>
                📝 {transfer.note}
              </p>
            )}
          </Card>

          {/* Products */}
          <Card>
            <div style={{ fontWeight: 700, marginBottom: 12, fontSize: "0.9rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--color-text-muted)" }}>
              Products ({transfer.items?.length || 0})
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th style={{ textAlign: "right" }}>Qty</th>
                </tr>
              </thead>
              <tbody>
                {(transfer.items || []).map((it, i) => (
                  <tr key={i}>
                    <td>{it.product?.name || "—"}</td>
                    <td style={{ color: "var(--color-text-muted)", fontFamily: "monospace" }}>{it.product?.sku || "—"}</td>
                    <td style={{ textAlign: "right", fontWeight: 700 }}>{it.quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          {/* Action buttons */}
          {canTransfer && actions.length > 0 && (
            <Card>
              <div style={{ fontWeight: 700, marginBottom: 12, fontSize: "0.9rem" }}>Actions</div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {actions.map((a) => (
                  <Button
                    key={a.action}
                    variant={a.variant}
                    onClick={() => doAction(a.action)}
                    disabled={transferAction.isPending}>
                    {transferAction.isPending ? "Processing…" : a.label}
                  </Button>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* ── Right column: Timeline ── */}
        <Card>
          <div style={{ fontWeight: 700, marginBottom: 16, fontSize: "0.9rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--color-text-muted)" }}>
            Timeline
          </div>

          {isCancelledOrRejected ? (
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", background: "#fff5f5", borderRadius: 10, border: "1px solid #ffc9c9" }}>
              <FiXCircle size={20} color="#c0392b" />
              <div>
                <div style={{ fontWeight: 700, color: "#c0392b", textTransform: "capitalize" }}>{transfer.status}</div>
                <div style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>{fmt(transfer.updatedAt)}</div>
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {STEPS.map((step, i) => {
                const done    = i <= currentStepIndex;
                const current = i === currentStepIndex;
                const Icon    = step.icon;

                return (
                  <div key={step.key} style={{ display: "flex", gap: 14 }}>
                    {/* Dot + line */}
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: "50%",
                        background: done ? (current ? "var(--brand-gold, #b58a2e)" : "#198754") : "var(--color-line, #eee)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        flexShrink: 0,
                        boxShadow: current ? "0 0 0 4px rgba(181,138,46,0.18)" : "none",
                        transition: "all 0.2s",
                      }}>
                        <Icon size={16} color={done ? "#fff" : "var(--color-text-muted)"} />
                      </div>
                      {i < STEPS.length - 1 && (
                        <div style={{
                          width: 2, flex: 1, minHeight: 28,
                          background: i < currentStepIndex ? "#198754" : "var(--color-line, #eee)",
                          margin: "2px 0",
                        }} />
                      )}
                    </div>

                    {/* Content */}
                    <div style={{ paddingBottom: i < STEPS.length - 1 ? 16 : 0, paddingTop: 6 }}>
                      <div style={{ fontWeight: current ? 700 : 500, color: done ? "var(--color-ink, #16130e)" : "var(--color-text-muted)" }}>
                        {step.label}
                        {current && (
                          <span style={{ marginLeft: 8, fontSize: "0.75rem", background: "var(--brand-gold-bg, #fff6dc)", color: "var(--brand-gold, #b58a2e)", padding: "2px 8px", borderRadius: 999, fontWeight: 600 }}>
                            Current
                          </span>
                        )}
                      </div>
                      {done && (
                        <div style={{ fontSize: "0.78rem", color: "var(--color-text-muted)", marginTop: 2 }}>
                          {i === 0 ? fmt(transfer.createdAt) : fmt(transfer.updatedAt)}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

export default TransferDetailPage;
