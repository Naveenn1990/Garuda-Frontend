// Categories page. Shows categories as cards (image + name + sub-count) with full
// CRUD: add, edit and delete. Sub-categories are shown as chips on the parent card.
import { useMemo, useState } from "react";
import { FiEdit2, FiTrash2 } from "react-icons/fi";
import { PageHeader, Card, Button, Spinner, Modal, FormField } from "../../../components";
import { usePermissions } from "../../../app/store/permissionStore";
import {
  useCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
  useUploadCategoryImage,
} from "../hooks/useCategories";
import config from "../../../config";
import "./CategoriesPage.css";

// Resolve a stored image path (relative /uploads/... or absolute URL) to a loadable URL.
const apiOrigin = config.apiBaseUrl.replace(/\/api\/v1\/?$/, "");
function imageUrl(src) {
  if (!src) return "";
  if (/^https?:\/\//i.test(src)) return src;
  return `${apiOrigin}${src.startsWith("/") ? "" : "/"}${src}`;
}

const emptyForm = { name: "", parent: "", image: "" };

export function CategoriesPage() {
  const { hasPermission } = usePermissions();
  const { data: categories = [], isLoading, isError } = useCategories();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();
  const uploadImage = useUploadCategoryImage();

  const canCreate = hasPermission("categories.create");
  const canEdit = hasPermission("categories.edit");
  const canDelete = hasPermission("categories.delete");

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState(null); // null = create mode
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");

  // Build a parent -> children tree from the flat list.
  const tree = useMemo(() => {
    const roots = categories.filter((c) => !c.parent);
    return roots.map((root) => ({
      ...root,
      children: categories.filter((c) => c.parent && c.parent._id === root._id),
    }));
  }, [categories]);

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setError("");
    setOpen(true);
  }

  function openEdit(cat) {
    setEditingId(cat._id);
    setForm({
      name: cat.name || "",
      parent: cat.parent?._id || "",
      image: cat.image || "",
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
    const payload = {
      name: form.name,
      parent: form.parent || null,
      image: form.image || undefined,
    };
    try {
      if (editingId) {
        await updateCategory.mutateAsync({ id: editingId, payload });
      } else {
        await createCategory.mutateAsync(payload);
      }
      setForm(emptyForm);
      setEditingId(null);
      setOpen(false);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save category.");
    }
  }

  async function handleDelete(cat) {
    if (!window.confirm(`Delete category "${cat.name}"? This cannot be undone.`)) return;
    try {
      await deleteCategory.mutateAsync(cat._id);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete category.");
    }
  }

  const saving = createCategory.isPending || updateCategory.isPending;

  return (
    <div>
      <PageHeader
        title="Categories"
        subtitle="Organize products into categories and sub-categories"
        actions={canCreate && <Button onClick={openCreate}>+ Add Category</Button>}
      />

      {isLoading ? (
        <Spinner />
      ) : isError ? (
        <p style={{ color: "var(--color-danger)" }}>Failed to load categories. Is the API running?</p>
      ) : tree.length === 0 ? (
        <Card>
          <p className="tab-empty">No categories yet. Click Add Category to create one.</p>
        </Card>
      ) : (
        <div className="cat-cards">
          {tree.map((root) => (
            <div className="cat-card" key={root._id}>
              <div className="cat-card__media cat-card__media--contain">
                {root.image ? (
                  <img src={imageUrl(root.image)} alt={root.name} />
                ) : (
                  <div className="cat-card__noimg">{root.name.charAt(0)}</div>
                )}
              </div>
              <div className="cat-card__body">
                <h3 className="cat-card__name">{root.name}</h3>
                {root.children.length > 0 && (
                  <div className="cat-card__subs">
                    {root.children.map((child) => (
                      <span key={child._id} className="cat-card__sub">
                        {child.name}
                        {(canEdit || canDelete) && (
                          <span className="cat-card__sub-actions">
                            {canEdit && (
                              <button title="Edit" onClick={() => openEdit(child)}>
                                <FiEdit2 />
                              </button>
                            )}
                            {canDelete && (
                              <button title="Delete" onClick={() => handleDelete(child)}>
                                <FiTrash2 />
                              </button>
                            )}
                          </span>
                        )}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="cat-card__actions">
                {canEdit && (
                  <button className="cat-card__btn" onClick={() => openEdit(root)}>
                    <FiEdit2 /> Edit
                  </button>
                )}
                {canDelete && (
                  <button className="cat-card__btn cat-card__btn--danger" onClick={() => handleDelete(root)}>
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
        title={editingId ? "Edit Category" : "Add Category"}
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
          <FormField label="Category Name *" htmlFor="cat-name">
            <input
              id="cat-name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </FormField>
          <FormField label="Parent Category (optional)" htmlFor="cat-parent">
            <select
              id="cat-parent"
              value={form.parent}
              onChange={(e) => setForm({ ...form, parent: e.target.value })}
            >
              <option value="">None (top-level)</option>
              {categories
                .filter((c) => !c.parent && c._id !== editingId)
                .map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
            </select>
          </FormField>
          <FormField label="Category Image (optional)" htmlFor="cat-image">
            <input id="cat-image" type="file" accept="image/*" onChange={handleImageChange} />
            {uploadImage.isPending && (
              <p style={{ fontSize: "0.85rem", color: "var(--color-text-muted)" }}>Uploading...</p>
            )}
            {form.image && (
              <img
                src={imageUrl(form.image)}
                alt="Category preview"
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

export default CategoriesPage;
