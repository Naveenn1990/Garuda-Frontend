// Brands page. Cards with logo + name + description, full CRUD (add/edit/delete)
// and logo image upload. Reuses the category card styles.
import { useState } from "react";
import { FiEdit2, FiTrash2 } from "react-icons/fi";
import { PageHeader, Card, Button, Spinner, Modal, FormField } from "../../../components";
import { usePermissions } from "../../../app/store/permissionStore";
import {
  useBrands,
  useCreateBrand,
  useUpdateBrand,
  useDeleteBrand,
  useUploadBrandImage,
} from "../hooks/useBrands";
import config from "../../../config";
import "../../categories/pages/CategoriesPage.css";

// Resolve a stored image path (relative /uploads/... or absolute URL) to a loadable URL.
const apiOrigin = config.apiBaseUrl.replace(/\/api\/v1\/?$/, "");
function imageUrl(src) {
  if (!src) return "";
  if (/^https?:\/\//i.test(src)) return src;
  return `${apiOrigin}${src.startsWith("/") ? "" : "/"}${src}`;
}

const emptyForm = { name: "", description: "", logo: "", status: "active" };

export function BrandsPage() {
  const { hasPermission } = usePermissions();
  const { data: rows = [], isLoading, isError } = useBrands();
  const createBrand = useCreateBrand();
  const updateBrand = useUpdateBrand();
  const deleteBrand = useDeleteBrand();
  const uploadImage = useUploadBrandImage();

  const canCreate = hasPermission("brands.create");
  const canEdit = hasPermission("brands.edit");
  const canDelete = hasPermission("brands.delete");

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setError("");
    setOpen(true);
  }

  function openEdit(brand) {
    setEditingId(brand._id);
    setForm({
      name: brand.name || "",
      description: brand.description || "",
      logo: brand.logo || "",
      status: brand.status || "active",
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
      setForm((f) => ({ ...f, logo: url }));
    } catch (err) {
      setError(err.response?.data?.message || "Image upload failed.");
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    const payload = {
      name: form.name,
      description: form.description || undefined,
      logo: form.logo || undefined,
      status: form.status,
    };
    try {
      if (editingId) {
        await updateBrand.mutateAsync({ id: editingId, payload });
      } else {
        await createBrand.mutateAsync(payload);
      }
      setForm(emptyForm);
      setEditingId(null);
      setOpen(false);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save brand.");
    }
  }

  async function handleDelete(brand) {
    if (!window.confirm(`Delete brand "${brand.name}"? This cannot be undone.`)) return;
    try {
      await deleteBrand.mutateAsync(brand._id);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete brand.");
    }
  }

  const saving = createBrand.isPending || updateBrand.isPending;

  return (
    <div>
      <PageHeader
        title="Brands"
        subtitle="Manage product brands"
        actions={canCreate && <Button onClick={openCreate}>+ Add Brand</Button>}
      />

      {isLoading ? (
        <Spinner />
      ) : isError ? (
        <p style={{ color: "var(--color-danger)" }}>Failed to load brands. Is the API running?</p>
      ) : rows.length === 0 ? (
        <Card>
          <p className="tab-empty">No brands yet. Click Add Brand to create one.</p>
        </Card>
      ) : (
        <div className="cat-cards">
          {rows.map((brand) => (
            <div className="cat-card" key={brand._id}>
              <div className="cat-card__media cat-card__media--contain">
                {brand.logo ? (
                  <img src={imageUrl(brand.logo)} alt={brand.name} />
                ) : (
                  <div className="cat-card__noimg">{brand.name.charAt(0)}</div>
                )}
              </div>
              <div className="cat-card__body">
                <h3 className="cat-card__name">{brand.name}</h3>
                {brand.description ? (
                  <span className="cat-card__empty">{brand.description}</span>
                ) : (
                  <span className="cat-card__empty">No description</span>
                )}
                <div style={{ marginTop: 8 }}>
                  <span className={`badge badge--${brand.status}`}>{brand.status}</span>
                </div>
              </div>
              <div className="cat-card__actions">
                {canEdit && (
                  <button className="cat-card__btn" onClick={() => openEdit(brand)}>
                    <FiEdit2 /> Edit
                  </button>
                )}
                {canDelete && (
                  <button className="cat-card__btn cat-card__btn--danger" onClick={() => handleDelete(brand)}>
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
        title={editingId ? "Edit Brand" : "Add Brand"}
        onClose={() => setOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={saving}>
              {saving ? "Saving..." : editingId ? "Save Changes" : "Create"}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit}>
          <FormField label="Brand Name *" htmlFor="brand-name">
            <input
              id="brand-name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </FormField>
          <FormField label="Description" htmlFor="brand-desc">
            <input
              id="brand-desc"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </FormField>
          <FormField label="Status" htmlFor="brand-status">
            <select
              id="brand-status"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </FormField>
          <FormField label="Brand Logo (optional)" htmlFor="brand-image">
            <input id="brand-image" type="file" accept="image/*" onChange={handleImageChange} />
            {uploadImage.isPending && (
              <p style={{ fontSize: "0.85rem", color: "var(--color-text-muted)" }}>Uploading...</p>
            )}
            {form.logo && (
              <img
                src={imageUrl(form.logo)}
                alt="Logo preview"
                style={{ marginTop: 8, width: 80, height: 80, objectFit: "cover", borderRadius: 8 }}
              />
            )}
          </FormField>
          {error && <p style={{ color: "var(--color-danger)" }}>{error}</p>}
        </form>
      </Modal>
    </div>
  );
}

export default BrandsPage;
