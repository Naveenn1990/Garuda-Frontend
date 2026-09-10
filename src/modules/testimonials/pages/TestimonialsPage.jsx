// Admin Testimonials: manage the "What our customers say" section on the storefront
// home. Fields: name, role (optional), message, rating, photo (optional). Full CRUD.
import { useState } from "react";
import { FiEdit2, FiTrash2 } from "react-icons/fi";
import { PageHeader, Card, Button, Spinner, Modal, FormField } from "../../../components";
import { usePermissions } from "../../../app/store/permissionStore";
import {
  useTestimonials,
  useCreateTestimonial,
  useUpdateTestimonial,
  useDeleteTestimonial,
  useUploadTestimonialImage,
} from "../hooks/useTestimonials";
import config from "../../../config";
import "../../categories/pages/CategoriesPage.css";

const apiOrigin = config.apiBaseUrl.replace(/\/api\/v1\/?$/, "");
function imageUrl(src) {
  if (!src) return "";
  if (/^https?:\/\//i.test(src)) return src;
  return `${apiOrigin}${src.startsWith("/") ? "" : "/"}${src}`;
}

const emptyForm = { name: "", role: "", message: "", photo: "", rating: 5, order: 0, status: "active" };

export function TestimonialsPage() {
  const { hasPermission } = usePermissions();
  const { data: items = [], isLoading, isError } = useTestimonials();
  const createT = useCreateTestimonial();
  const updateT = useUpdateTestimonial();
  const deleteT = useDeleteTestimonial();
  const uploadImage = useUploadTestimonialImage();

  const canCreate = hasPermission("testimonials.create");
  const canEdit = hasPermission("testimonials.edit");
  const canDelete = hasPermission("testimonials.delete");

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setError("");
    setOpen(true);
  }
  function openEdit(t) {
    setEditingId(t._id);
    setForm({
      name: t.name || "",
      role: t.role || "",
      message: t.message || "",
      photo: t.photo || "",
      rating: t.rating ?? 5,
      order: t.order ?? 0,
      status: t.status || "active",
    });
    setError("");
    setOpen(true);
  }

  async function handleImageChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    try {
      const url = await uploadImage.mutateAsync(file);
      setForm((f) => ({ ...f, photo: url }));
    } catch (err) {
      setError(err.response?.data?.message || "Image upload failed.");
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!form.name.trim()) return setError("Name is required.");
    if (!form.message.trim()) return setError("Message is required.");
    const payload = {
      ...form,
      role: form.role || undefined,
      photo: form.photo || undefined,
      rating: Number(form.rating) || 5,
      order: Number(form.order) || 0,
    };
    try {
      if (editingId) await updateT.mutateAsync({ id: editingId, payload });
      else await createT.mutateAsync(payload);
      setForm(emptyForm);
      setEditingId(null);
      setOpen(false);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save testimonial.");
    }
  }

  async function handleDelete(t) {
    if (!window.confirm(`Delete testimonial from "${t.name}"?`)) return;
    try {
      await deleteT.mutateAsync(t._id);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete.");
    }
  }

  const saving = createT.isPending || updateT.isPending;

  return (
    <div>
      <PageHeader
        title="Testimonials"
        subtitle='Manage the "What our customers say" section on the home page'
        actions={canCreate && <Button onClick={openCreate}>+ Add Testimonial</Button>}
      />

      {isLoading ? (
        <Spinner />
      ) : isError ? (
        <p style={{ color: "var(--color-danger)" }}>Failed to load testimonials. Is the API running?</p>
      ) : items.length === 0 ? (
        <Card><p className="tab-empty">No testimonials yet. Click Add Testimonial to create one.</p></Card>
      ) : (
        <div className="cat-cards">
          {items.map((t) => (
            <div className="cat-card" key={t._id}>
              <div className="cat-card__body" style={{ paddingTop: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  {t.photo ? (
                    <img src={imageUrl(t.photo)} alt={t.name} style={{ width: 44, height: 44, borderRadius: "50%", objectFit: "cover" }} />
                  ) : (
                    <div style={{ width: 44, height: 44, borderRadius: "50%", background: "var(--brand-gold-soft,#f7f3e7)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "var(--brand-gold,#b58a2e)" }}>
                      {t.name.charAt(0)}
                    </div>
                  )}
                  <div>
                    <div style={{ fontWeight: 700 }}>{t.name}</div>
                    {t.role && <div style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>{t.role}</div>}
                  </div>
                </div>
                <div style={{ color: "#f0a500", margin: "8px 0" }}>{"★".repeat(t.rating || 5)}</div>
                <p style={{ margin: 0, color: "var(--color-text)", fontSize: "0.9rem", lineHeight: 1.5 }}>"{t.message}"</p>
                <div style={{ marginTop: 8, display: "flex", gap: 8, alignItems: "center" }}>
                  <span className={`badge badge--${t.status}`}>{t.status}</span>
                  <span style={{ fontSize: "0.78rem", color: "var(--color-text-muted)" }}>Order: {t.order}</span>
                </div>
              </div>
              <div className="cat-card__actions">
                {canEdit && <button className="cat-card__btn" onClick={() => openEdit(t)}><FiEdit2 /> Edit</button>}
                {canDelete && <button className="cat-card__btn cat-card__btn--danger" onClick={() => handleDelete(t)}><FiTrash2 /> Delete</button>}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={open}
        title={editingId ? "Edit Testimonial" : "Add Testimonial"}
        onClose={() => setOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={saving}>
              {saving ? "Saving..." : editingId ? "Save Changes" : "Create"}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit}>
          <FormField label="Customer Name *" htmlFor="t-name">
            <input id="t-name" value={form.name} onChange={set("name")} required />
          </FormField>
          <FormField label="Role / Location (optional)" htmlFor="t-role">
            <input id="t-role" value={form.role} onChange={set("role")} placeholder="e.g. Bengaluru" />
          </FormField>
          <FormField label="Message *" htmlFor="t-msg">
            <textarea id="t-msg" rows={3} value={form.message} onChange={set("message")} required
              style={{ width: "100%", padding: "10px 12px", border: "1px solid var(--color-border)", borderRadius: 8, fontFamily: "inherit" }} />
          </FormField>
          <FormField label="Rating" htmlFor="t-rating">
            <select id="t-rating" value={form.rating} onChange={set("rating")}>
              {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} Star{n > 1 ? "s" : ""}</option>)}
            </select>
          </FormField>
          <FormField label="Display Order" htmlFor="t-order">
            <input id="t-order" type="number" value={form.order} onChange={set("order")} />
          </FormField>
          <FormField label="Status" htmlFor="t-status">
            <select id="t-status" value={form.status} onChange={set("status")}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </FormField>
          <FormField label="Photo (optional)" htmlFor="t-photo">
            <input id="t-photo" type="file" accept="image/*" onChange={handleImageChange} />
            {uploadImage.isPending && <p style={{ fontSize: "0.85rem", color: "var(--color-text-muted)" }}>Uploading...</p>}
            {form.photo && <img src={imageUrl(form.photo)} alt="preview" style={{ marginTop: 8, width: 60, height: 60, objectFit: "cover", borderRadius: "50%" }} />}
          </FormField>
          {error && <p style={{ color: "var(--color-danger)" }}>{error}</p>}
        </form>
      </Modal>
    </div>
  );
}

export default TestimonialsPage;
