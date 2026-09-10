// Admin Banners page. Manage the storefront home hero banners: image, badge, title,
// optional subtitle, and a "Shop Now" button (text + link). Full CRUD. Admins can add
// as many banners as they want; they show in the storefront hero slider by order.
import { useState } from "react";
import { FiEdit2, FiTrash2 } from "react-icons/fi";
import { PageHeader, Card, Button, Spinner, Modal, FormField } from "../../../components";
import { usePermissions } from "../../../app/store/permissionStore";
import {
  useBanners,
  useCreateBanner,
  useUpdateBanner,
  useDeleteBanner,
  useUploadBannerImage,
} from "../hooks/useBanners";
import config from "../../../config";
import "../../categories/pages/CategoriesPage.css";

const apiOrigin = config.apiBaseUrl.replace(/\/api\/v1\/?$/, "");
function imageUrl(src) {
  if (!src) return "";
  if (/^https?:\/\//i.test(src)) return src;
  return `${apiOrigin}${src.startsWith("/") ? "" : "/"}${src}`;
}

const emptyForm = {
  image: "",
  badge: "",
  title: "",
  subtitle: "",
  buttonText: "Shop Now",
  buttonLink: "/shop",
  order: 0,
  status: "active",
};

export function BannersPage() {
  const { hasPermission } = usePermissions();
  const { data: banners = [], isLoading, isError } = useBanners();
  const createBanner = useCreateBanner();
  const updateBanner = useUpdateBanner();
  const deleteBanner = useDeleteBanner();
  const uploadImage = useUploadBannerImage();

  const canCreate = hasPermission("banners.create");
  const canEdit = hasPermission("banners.edit");
  const canDelete = hasPermission("banners.delete");

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

  function openEdit(b) {
    setEditingId(b._id);
    setForm({
      image: b.image || "",
      badge: b.badge || "",
      title: b.title || "",
      subtitle: b.subtitle || "",
      buttonText: b.buttonText || "Shop Now",
      buttonLink: b.buttonLink || "/shop",
      order: b.order ?? 0,
      status: b.status || "active",
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
      setForm((f) => ({ ...f, image: url }));
    } catch (err) {
      setError(err.response?.data?.message || "Image upload failed.");
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!form.image) return setError("Please upload a banner image.");
    // Send empty strings (not undefined) so cleared fields actually get removed on
    // save. `undefined` values get dropped from the JSON, leaving the old value.
    const payload = {
      ...form,
      title: form.title || "",
      subtitle: form.subtitle || "",
      badge: form.badge || "",
      buttonText: form.buttonText || "",
      buttonLink: form.buttonLink || "",
      order: Number(form.order) || 0,
    };
    try {
      if (editingId) await updateBanner.mutateAsync({ id: editingId, payload });
      else await createBanner.mutateAsync(payload);
      setForm(emptyForm);
      setEditingId(null);
      setOpen(false);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save banner.");
    }
  }

  async function handleDelete(b) {
    if (!window.confirm(`Delete this banner "${b.title}"?`)) return;
    try {
      await deleteBanner.mutateAsync(b._id);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete banner.");
    }
  }

  const saving = createBanner.isPending || updateBanner.isPending;

  return (
    <div>
      <PageHeader
        title="Home Banners"
        subtitle="Promotional banners shown on the storefront home page"
        actions={canCreate && <Button onClick={openCreate}>+ Add Banner</Button>}
      />

      {isLoading ? (
        <Spinner />
      ) : isError ? (
        <p style={{ color: "var(--color-danger)" }}>Failed to load banners. Is the API running?</p>
      ) : banners.length === 0 ? (
        <Card>
          <p className="tab-empty">No banners yet. Click Add Banner to create one.</p>
        </Card>
      ) : (
        <div className="cat-cards">
          {banners.map((b) => (
            <div className="cat-card" key={b._id}>
              <div className="cat-card__media">
                {b.image ? (
                  <img src={imageUrl(b.image)} alt={b.title || "Banner"} />
                ) : (
                  <div className="cat-card__noimg">{(b.title || "B").charAt(0)}</div>
                )}
              </div>
              <div className="cat-card__body">
                {b.badge && (
                  <span style={{ fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--brand-gold, #b58a2e)" }}>
                    {b.badge}
                  </span>
                )}
                <h3 className="cat-card__name">{b.title || "Image banner"}</h3>
                {b.subtitle && (
                  <span style={{ color: "var(--color-text-muted)", fontSize: "0.85rem" }}>{b.subtitle}</span>
                )}
                <div style={{ marginTop: 6, display: "flex", gap: 8, alignItems: "center" }}>
                  <span className={`badge badge--${b.status}`}>{b.status}</span>
                  <span style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>Order: {b.order}</span>
                </div>
              </div>
              <div className="cat-card__actions">
                {canEdit && (
                  <button className="cat-card__btn" onClick={() => openEdit(b)}>
                    <FiEdit2 /> Edit
                  </button>
                )}
                {canDelete && (
                  <button className="cat-card__btn cat-card__btn--danger" onClick={() => handleDelete(b)}>
                    <FiTrash2 /> Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={open}
        title={editingId ? "Edit Banner" : "Add Banner"}
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
          <FormField label="Banner Image *" htmlFor="b-image">
            <input id="b-image" type="file" accept="image/*" onChange={handleImageChange} />
            {uploadImage.isPending && (
              <p style={{ fontSize: "0.85rem", color: "var(--color-text-muted)" }}>Uploading...</p>
            )}
            {form.image && (
              <img
                src={imageUrl(form.image)}
                alt="Banner preview"
                style={{ marginTop: 8, width: "100%", maxHeight: 140, objectFit: "cover", borderRadius: 8 }}
              />
            )}
          </FormField>
          <FormField label="Badge (optional)" htmlFor="b-badge">
            <input id="b-badge" value={form.badge} onChange={set("badge")} placeholder="New Arrival" />
          </FormField>
          <FormField label="Title (optional)" htmlFor="b-title">
            <input id="b-title" value={form.title} onChange={set("title")} placeholder="Buy the best appliances" />
          </FormField>
          <FormField label="Subtitle (optional)" htmlFor="b-subtitle">
            <input id="b-subtitle" value={form.subtitle} onChange={set("subtitle")} />
          </FormField>
          <FormField label="Button Text (optional)" htmlFor="b-btn">
            <input id="b-btn" value={form.buttonText} onChange={set("buttonText")} placeholder="Shop Now" />
          </FormField>
          <FormField label="Button Link (optional)" htmlFor="b-link">
            <input id="b-link" value={form.buttonLink} onChange={set("buttonLink")} placeholder="/shop" />
          </FormField>
          <FormField label="Display Order" htmlFor="b-order">
            <input id="b-order" type="number" value={form.order} onChange={set("order")} />
          </FormField>
          <FormField label="Status" htmlFor="b-status">
            <select id="b-status" value={form.status} onChange={set("status")}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </FormField>
          {error && <p style={{ color: "var(--color-danger)" }}>{error}</p>}
        </form>
      </Modal>
    </div>
  );
}

export default BannersPage;
