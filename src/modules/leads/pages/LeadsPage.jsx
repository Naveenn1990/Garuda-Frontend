// Leads page with Table View and Visual Kanban Pipeline.
// Tracks sales opportunities, stage progressions, follow-up logs, and conversion to Quotation.
import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader, Card, Button, Spinner, Modal, FormField, ExportButton } from "../../../components";
import { usePermissions } from "../../../app/store/permissionStore";
import { useCustomers } from "../../customers/hooks/useCustomers";
import { useProducts } from "../../products/hooks/useProducts";
import { useShowrooms } from "../../showrooms/hooks/useShowrooms";
import { useUsers } from "../../users/hooks/useUsers";
import {
  useLeads,
  useCreateLead,
  useLeadStage,
  useLeadFollowUp,
  useConvertLead,
} from "../hooks/useLeads";

const STAGES = [
  { key: "new", label: "New Leads", color: "#3b82f6" },
  { key: "contacted", label: "Contacted", color: "#8b5cf6" },
  { key: "qualified", label: "Qualified / Visit", color: "#06b6d4" },
  { key: "quotation", label: "Quotation Sent", color: "#f59e0b" },
  { key: "negotiation", label: "Negotiation", color: "#ec4899" },
  { key: "won", label: "Won / Closed", color: "#10b981" },
  { key: "lost", label: "Lost", color: "#64748b" },
];

const SOURCES = ["website", "app", "showroom", "phone", "whatsapp", "social", "referral"];
const inr = (n) => (typeof n === "number" ? `₹${n.toLocaleString("en-IN")}` : "—");

const EXPORT_COLUMNS = [
  { header: "Customer", value: (r) => r.customer?.name || "" },
  { header: "Product", value: (r) => r.product?.name || "" },
  { header: "Budget", value: (r) => r.budget },
  { header: "Source", value: (r) => r.source },
  { header: "Stage", value: (r) => r.stage },
  { header: "Requirement", value: (r) => r.requirement || "" },
];

export function LeadsPage() {
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const { data: leads = [], isLoading, isError } = useLeads();
  const { data: customers = [] } = useCustomers();
  const { data: products = [] } = useProducts();
  const { data: showrooms = [] } = useShowrooms({ type: "showroom" });
  const { data: users = [] } = useUsers();

  const createLead = useCreateLead();
  const leadStage = useLeadStage();
  const followUp = useLeadFollowUp();
  const convert = useConvertLead();

  const [viewMode, setViewMode] = useState("kanban"); // "kanban" | "table"
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    customer: "",
    product: "",
    budget: "",
    requirement: "",
    source: "showroom",
    showroom: "",
    assignedTo: "",
  });
  const [error, setError] = useState("");

  // Follow-up modal state
  const [fuLead, setFuLead] = useState(null);
  const [fuText, setFuText] = useState("");
  const [fuDate, setFuDate] = useState("");

  // Group leads by stage for Kanban
  const groupedLeads = useMemo(() => {
    const map = {};
    STAGES.forEach((s) => {
      map[s.key] = [];
    });
    leads.forEach((l) => {
      const st = l.stage || "new";
      if (map[st]) {
        map[st].push(l);
      } else {
        if (!map.new) map.new = [];
        map.new.push(l);
      }
    });
    return map;
  }, [leads]);

  async function handleCreate(e) {
    e.preventDefault();
    setError("");
    try {
      await createLead.mutateAsync({
        ...form,
        budget: Number(form.budget) || 0,
        product: form.product || undefined,
        showroom: form.showroom || undefined,
        assignedTo: form.assignedTo || undefined,
      });
      setForm({ customer: "", product: "", budget: "", requirement: "", source: "showroom", showroom: "", assignedTo: "" });
      setOpen(false);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create lead.");
    }
  }

  async function handleStage(id, stage) {
    try {
      await leadStage.mutateAsync({ id, stage });
    } catch (err) {
      alert(err.response?.data?.message || "Failed to change stage.");
    }
  }

  async function handleFollowUp(e) {
    e.preventDefault();
    try {
      await followUp.mutateAsync({ id: fuLead._id, text: fuText, followUpAt: fuDate || undefined });
      setFuLead(null);
      setFuText("");
      setFuDate("");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to add follow-up.");
    }
  }

  async function handleConvert(id) {
    try {
      const res = await convert.mutateAsync(id);
      const num = res?.data?.item?.number;
      alert(`Quotation ${num || ""} created from lead.`);
      navigate("/quotations");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to convert lead.");
    }
  }

  function getNextStage(current) {
    const idx = STAGES.findIndex((s) => s.key === current);
    if (idx >= 0 && idx < STAGES.length - 1) {
      return STAGES[idx + 1].key;
    }
    return null;
  }

  return (
    <div>
      <PageHeader
        title="Lead Pipeline"
        subtitle="Visual sales pipeline, stage tracking and conversion"
        actions={
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {/* View switcher */}
            <div style={{ display: "flex", backgroundColor: "var(--color-bg-secondary, #f1f5f9)", borderRadius: 8, padding: 3, border: "1px solid var(--color-border)" }}>
              <button
                type="button"
                onClick={() => setViewMode("kanban")}
                style={{
                  padding: "6px 12px",
                  borderRadius: 6,
                  border: "none",
                  backgroundColor: viewMode === "kanban" ? "#ffffff" : "transparent",
                  fontWeight: viewMode === "kanban" ? 700 : 500,
                  boxShadow: viewMode === "kanban" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                  cursor: "pointer",
                  fontSize: "0.85rem",
                }}
              >
                📊 Kanban Board
              </button>
              <button
                type="button"
                onClick={() => setViewMode("table")}
                style={{
                  padding: "6px 12px",
                  borderRadius: 6,
                  border: "none",
                  backgroundColor: viewMode === "table" ? "#ffffff" : "transparent",
                  fontWeight: viewMode === "table" ? 700 : 500,
                  boxShadow: viewMode === "table" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                  cursor: "pointer",
                  fontSize: "0.85rem",
                }}
              >
                📋 Table View
              </button>
            </div>

            <ExportButton rows={leads} columns={EXPORT_COLUMNS} filename="leads.csv" />
            {hasPermission("leads.create") && <Button onClick={() => setOpen(true)}>+ Add Lead</Button>}
          </div>
        }
      />

      {isLoading ? (
        <Spinner />
      ) : isError ? (
        <p style={{ color: "var(--color-danger)" }}>Failed to load leads. Is the API running?</p>
      ) : viewMode === "kanban" ? (
        /* Visual Kanban Pipeline Board */
        <div style={{ display: "flex", gap: 14, overflowX: "auto", paddingBottom: 16, alignItems: "flex-start", minHeight: "70vh" }}>
          {STAGES.map((stage) => {
            const list = groupedLeads[stage.key] || [];
            const stageTotalBudget = list.reduce((sum, l) => sum + (Number(l.budget) || 0), 0);
            return (
              <div
                key={stage.key}
                style={{
                  flex: "0 0 280px",
                  backgroundColor: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  borderRadius: 10,
                  display: "flex",
                  flexDirection: "column",
                  maxHeight: "80vh",
                }}
              >
                {/* Column Header */}
                <div
                  style={{
                    padding: "12px 14px",
                    borderTop: `4px solid ${stage.color}`,
                    borderBottom: "1px solid #e2e8f0",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    backgroundColor: "#ffffff",
                    borderTopLeftRadius: 10,
                    borderTopRightRadius: 10,
                  }}
                >
                  <div>
                    <span style={{ fontWeight: 700, fontSize: "0.92rem" }}>{stage.label}</span>
                    <span
                      style={{
                        marginLeft: 8,
                        backgroundColor: "#f1f5f9",
                        padding: "2px 6px",
                        borderRadius: 12,
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        color: "#475569",
                      }}
                    >
                      {list.length}
                    </span>
                  </div>
                  {stageTotalBudget > 0 && (
                    <span style={{ fontSize: "0.78rem", color: "#64748b", fontWeight: 600 }}>
                      {inr(stageTotalBudget)}
                    </span>
                  )}
                </div>

                {/* Column Cards */}
                <div style={{ padding: 10, overflowY: "auto", display: "flex", flexDirection: "column", gap: 10 }}>
                  {list.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "20px 10px", color: "#94a3b8", fontSize: "0.82rem" }}>
                      No leads in this stage
                    </div>
                  ) : (
                    list.map((l) => {
                      const nextSt = getNextStage(l.stage);
                      return (
                        <div
                          key={l._id}
                          style={{
                            backgroundColor: "#ffffff",
                            border: "1px solid #cbd5e1",
                            borderRadius: 8,
                            padding: 12,
                            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                            display: "flex",
                            flexDirection: "column",
                            gap: 8,
                          }}
                        >
                          {/* Card Header: Customer & Source */}
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                            <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "#1e293b" }}>
                              {l.customer?.name || "Lead"}
                              <div style={{ fontSize: "0.78rem", color: "#64748b", fontWeight: 500 }}>
                                {l.customer?.mobile || "—"}
                              </div>
                            </div>
                            <span
                              style={{
                                fontSize: "0.7rem",
                                padding: "2px 6px",
                                borderRadius: 4,
                                backgroundColor: "#f1f5f9",
                                color: "#475569",
                                textTransform: "uppercase",
                                fontWeight: 600,
                              }}
                            >
                              {l.source || "showroom"}
                            </span>
                          </div>

                          {/* Interested Product & Requirement */}
                          {(l.product?.name || l.requirement) && (
                            <div style={{ fontSize: "0.82rem", color: "#334155" }}>
                              {l.product?.name && (
                                <div style={{ fontWeight: 600, color: "var(--brand-gold-dark, #b45309)" }}>
                                  📦 {l.product.name}
                                </div>
                              )}
                              {l.requirement && (
                                <div style={{ color: "#64748b", fontSize: "0.78rem", marginTop: 2 }}>
                                  "{l.requirement}"
                                </div>
                              )}
                            </div>
                          )}

                          {/* Budget & Salesperson */}
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.8rem", borderTop: "1px dashed #e2e8f0", paddingTop: 6 }}>
                            <span style={{ fontWeight: 700, color: "#16a34a" }}>
                              {l.budget ? inr(l.budget) : "Budget unspec."}
                            </span>
                            <span style={{ color: "#64748b", fontSize: "0.75rem" }}>
                              👤 {l.assignedTo?.name || "Unassigned"}
                            </span>
                          </div>

                          {/* Card Actions */}
                          <div style={{ display: "flex", gap: 6, marginTop: 4, flexWrap: "wrap" }}>
                            {hasPermission("leads.edit") && (
                              <button
                                type="button"
                                onClick={() => setFuLead(l)}
                                style={{
                                  flex: 1,
                                  padding: "4px 8px",
                                  fontSize: "0.75rem",
                                  backgroundColor: "#f8fafc",
                                  border: "1px solid #cbd5e1",
                                  borderRadius: 4,
                                  cursor: "pointer",
                                  fontWeight: 600,
                                }}
                              >
                                📞 Follow-up
                              </button>
                            )}

                            {hasPermission("leads.edit") && nextSt && (
                              <button
                                type="button"
                                onClick={() => handleStage(l._id, nextSt)}
                                style={{
                                  padding: "4px 8px",
                                  fontSize: "0.75rem",
                                  backgroundColor: "var(--brand-gold-dark, #b45309)",
                                  color: "#ffffff",
                                  border: "none",
                                  borderRadius: 4,
                                  cursor: "pointer",
                                  fontWeight: 600,
                                }}
                                title="Move to next stage"
                              >
                                → Next
                              </button>
                            )}

                            {hasPermission("quotations.create") && l.stage !== "won" && (
                              <button
                                type="button"
                                onClick={() => handleConvert(l._id)}
                                style={{
                                  padding: "4px 8px",
                                  fontSize: "0.75rem",
                                  backgroundColor: "#10b981",
                                  color: "#ffffff",
                                  border: "none",
                                  borderRadius: 4,
                                  cursor: "pointer",
                                  fontWeight: 600,
                                }}
                                title="Convert to Quotation"
                              >
                                📝 Quote
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <Card>
          <div className="data-table__wrap" style={{ border: "none" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Product</th>
                  <th>Budget</th>
                  <th>Source</th>
                  <th>Assigned To</th>
                  <th>Stage</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {leads.length === 0 ? (
                  <tr>
                    <td className="data-table__empty" colSpan={7}>
                      No leads yet.
                    </td>
                  </tr>
                ) : (
                  leads.map((l) => (
                    <tr key={l._id}>
                      <td>{l.customer?.name || "—"}</td>
                      <td>{l.product?.name || "—"}</td>
                      <td>{inr(l.budget)}</td>
                      <td style={{ textTransform: "capitalize" }}>{l.source}</td>
                      <td>{l.assignedTo?.name || "—"}</td>
                      <td>
                        <select
                          className="lead-stage-select"
                          value={l.stage}
                          onChange={(e) => handleStage(l._id, e.target.value)}
                          disabled={!hasPermission("leads.edit")}
                        >
                          {STAGES.map((s) => (
                            <option key={s.key} value={s.key}>
                              {s.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: 6 }}>
                          {hasPermission("leads.edit") && (
                            <Button variant="secondary" onClick={() => setFuLead(l)}>
                              Follow-up
                            </Button>
                          )}
                          {hasPermission("quotations.create") && (
                            <Button onClick={() => handleConvert(l._id)}>Convert</Button>
                          )}
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

      {/* Create lead modal */}
      <Modal
        open={open}
        title="Add Lead"
        onClose={() => setOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={createLead.isPending}>
              {createLead.isPending ? "Saving..." : "Create Lead"}
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreate}>
          <FormField label="Customer *" htmlFor="l-customer">
            <select
              id="l-customer"
              value={form.customer}
              onChange={(e) => setForm({ ...form, customer: e.target.value })}
              required
            >
              <option value="">Select customer</option>
              {customers.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name} ({c.mobile})
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Interested Product" htmlFor="l-product">
            <select
              id="l-product"
              value={form.product}
              onChange={(e) => setForm({ ...form, product: e.target.value })}
            >
              <option value="">None</option>
              {products.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name} ({p.sku})
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Budget (₹)" htmlFor="l-budget">
            <input
              id="l-budget"
              type="number"
              min="0"
              value={form.budget}
              onChange={(e) => setForm({ ...form, budget: e.target.value })}
            />
          </FormField>
          <FormField label="Requirement" htmlFor="l-req">
            <input
              id="l-req"
              value={form.requirement}
              onChange={(e) => setForm({ ...form, requirement: e.target.value })}
            />
          </FormField>
          <FormField label="Source" htmlFor="l-source">
            <select
              id="l-source"
              value={form.source}
              onChange={(e) => setForm({ ...form, source: e.target.value })}
            >
              {SOURCES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Assign Showroom" htmlFor="l-showroom">
            <select
              id="l-showroom"
              value={form.showroom}
              onChange={(e) => setForm({ ...form, showroom: e.target.value })}
            >
              <option value="">None</option>
              {showrooms.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name} ({s.code})
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Assign To (Salesperson)" htmlFor="l-assignee">
            <select
              id="l-assignee"
              value={form.assignedTo}
              onChange={(e) => setForm({ ...form, assignedTo: e.target.value })}
            >
              <option value="">Unassigned</option>
              {users.map((u) => (
                <option key={u._id} value={u._id}>
                  {u.name}
                </option>
              ))}
            </select>
          </FormField>
          {error && <p style={{ color: "var(--color-danger)" }}>{error}</p>}
        </form>
      </Modal>

      {/* Follow-up modal */}
      <Modal
        open={Boolean(fuLead)}
        title="Add Follow-up"
        onClose={() => setFuLead(null)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setFuLead(null)}>
              Cancel
            </Button>
            <Button onClick={handleFollowUp} disabled={followUp.isPending}>
              {followUp.isPending ? "Saving..." : "Save"}
            </Button>
          </>
        }
      >
        <form onSubmit={handleFollowUp}>
          <FormField label="Note" htmlFor="fu-text">
            <input
              id="fu-text"
              value={fuText}
              onChange={(e) => setFuText(e.target.value)}
              placeholder="Called customer, requested callback tomorrow..."
            />
          </FormField>
          <FormField label="Next follow-up date" htmlFor="fu-date">
            <input
              id="fu-date"
              type="datetime-local"
              value={fuDate}
              onChange={(e) => setFuDate(e.target.value)}
            />
          </FormField>
        </form>
      </Modal>
    </div>
  );
}

export default LeadsPage;
