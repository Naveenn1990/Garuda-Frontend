// Leads page. List with inline stage change, a follow-up modal, and convert-to-quotation.
// Create leads via a modal (customer + product + budget + source).
import { useState } from "react";
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

const STAGES = ["new", "contacted", "qualified", "quotation", "negotiation", "won", "lost"];
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

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ customer: "", product: "", budget: "", requirement: "", source: "showroom", showroom: "", assignedTo: "" });
  const [error, setError] = useState("");

  // Follow-up modal state.
  const [fuLead, setFuLead] = useState(null);
  const [fuText, setFuText] = useState("");
  const [fuDate, setFuDate] = useState("");

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

  return (
    <div>
      <PageHeader
        title="Leads"
        subtitle="Track and progress sales opportunities"
        actions={
          <div style={{ display: "flex", gap: 8 }}>
            <ExportButton rows={leads} columns={EXPORT_COLUMNS} filename="leads.csv" />
            {hasPermission("leads.create") && <Button onClick={() => setOpen(true)}>+ Add Lead</Button>}
          </div>
        }
      />

      {isLoading ? (
        <Spinner />
      ) : isError ? (
        <p style={{ color: "var(--color-danger)" }}>Failed to load leads. Is the API running?</p>
      ) : (
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
                  <tr><td className="data-table__empty" colSpan={7}>No leads yet.</td></tr>
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
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: 6 }}>
                          {hasPermission("leads.edit") && (
                            <Button variant="secondary" onClick={() => setFuLead(l)}>Follow-up</Button>
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
            <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={createLead.isPending}>
              {createLead.isPending ? "Saving..." : "Create Lead"}
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreate}>
          <FormField label="Customer *" htmlFor="l-customer">
            <select id="l-customer" value={form.customer} onChange={(e) => setForm({ ...form, customer: e.target.value })} required>
              <option value="">Select customer</option>
              {customers.map((c) => (
                <option key={c._id} value={c._id}>{c.name} ({c.mobile})</option>
              ))}
            </select>
          </FormField>
          <FormField label="Interested Product" htmlFor="l-product">
            <select id="l-product" value={form.product} onChange={(e) => setForm({ ...form, product: e.target.value })}>
              <option value="">None</option>
              {products.map((p) => (
                <option key={p._id} value={p._id}>{p.name} ({p.sku})</option>
              ))}
            </select>
          </FormField>
          <FormField label="Budget (₹)" htmlFor="l-budget">
            <input id="l-budget" type="number" min="0" value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} />
          </FormField>
          <FormField label="Requirement" htmlFor="l-req">
            <input id="l-req" value={form.requirement} onChange={(e) => setForm({ ...form, requirement: e.target.value })} />
          </FormField>
          <FormField label="Source" htmlFor="l-source">
            <select id="l-source" value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })}>
              {SOURCES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </FormField>
          <FormField label="Assign Showroom" htmlFor="l-showroom">
            <select id="l-showroom" value={form.showroom} onChange={(e) => setForm({ ...form, showroom: e.target.value })}>
              <option value="">None</option>
              {showrooms.map((s) => (
                <option key={s._id} value={s._id}>{s.name} ({s.code})</option>
              ))}
            </select>
          </FormField>
          <FormField label="Assign To (Salesperson)" htmlFor="l-assignee">
            <select id="l-assignee" value={form.assignedTo} onChange={(e) => setForm({ ...form, assignedTo: e.target.value })}>
              <option value="">Unassigned</option>
              {users.map((u) => (
                <option key={u._id} value={u._id}>{u.name}</option>
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
            <Button variant="secondary" onClick={() => setFuLead(null)}>Cancel</Button>
            <Button onClick={handleFollowUp} disabled={followUp.isPending}>
              {followUp.isPending ? "Saving..." : "Save"}
            </Button>
          </>
        }
      >
        <form onSubmit={handleFollowUp}>
          <FormField label="Note" htmlFor="fu-text">
            <input id="fu-text" value={fuText} onChange={(e) => setFuText(e.target.value)} placeholder="Called customer, interested..." />
          </FormField>
          <FormField label="Next follow-up date" htmlFor="fu-date">
            <input id="fu-date" type="datetime-local" value={fuDate} onChange={(e) => setFuDate(e.target.value)} />
          </FormField>
        </form>
      </Modal>
    </div>
  );
}

export default LeadsPage;
