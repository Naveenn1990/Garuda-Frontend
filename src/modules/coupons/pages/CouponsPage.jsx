// Admin Coupons page. Create and manage discount codes.
// Supports flat (₹) and percent (%) discounts, minimum order amounts,
// category restrictions, expiry dates, and usage limits.
import { useState } from "react";
import { FiEdit2, FiTrash2, FiTag, FiPlus } from "react-icons/fi";
import { PageHeader, Card, Button, Spinner, Modal, FormField } from "../../../components";
import { usePermissions } from "../../../app/store/permissionStore";
import { useShopCategories } from "../../storefront/hooks/useShop";
import { useCoupons, useCreateCoupon, useUpdateCoupon, useDeleteCoupon } from "../hooks/useCoupons";

const empty = {
  code: "",
  description: "",
  type: "flat",
  value: "",
  maxDiscount: "",
  minOrderAmount: "",
  categories: [],
  usageLimit: "",
  startDate: "",
  expiryDate: "",
  status: "active",
};

function fmt(n) {
  return n != null && n !== "" ? `₹${Number(n).toLocaleString("en-IN")}` : "—";
}

export function CouponsPage() {
  const { hasPermission } = usePermissions();
  const { data: coupons = [], isLoading, isError } = useCoupons();
  const { data: categories = [] } = useShopCategories();
  const createCoupon = useCreateCoupon();
  const updateCoupon = useUpdateCoupon();
  const deleteCoupon = useDeleteCoupon();

  const canCreate = hasPermission("coupons.create");
  const canEdit   = hasPermission("coupons.edit");
  const canDelete = hasPermission("coupons.delete");

  const [open, setOpen]       = useState(false);
  const [editingId, setEditId] = useState(null);
  const [form, setForm]        = useState(empty);
  const [error, setError]      = useState("");

  const set = (k) => (e) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  function toggleCat(id) {
    setForm((f) => ({
      ...f,
      categories: f.categories.includes(id)
        ? f.categories.filter((c) => c !== id)
        : [...f.categories, id],
    }));
  }

  function openCreate() {
    setEditId(null);
    setForm(empty);
    setError("");
    setOpen(true);
  }

  function openEdit(c) {
    setEditId(c._id);
    setForm({
      code:           c.code || "",
      description:    c.description || "",
      type:           c.type || "flat",
      value:          c.value ?? "",
      maxDiscount:    c.maxDiscount ?? "",
      minOrderAmount: c.minOrderAmount ?? "",
      categories:     (c.categories || []).map((x) => String(x._id || x)),
      usageLimit:     c.usageLimit ?? "",
      startDate:      c.startDate ? c.startDate.slice(0, 10) : "",
      expiryDate:     c.expiryDate ? c.expiryDate.slice(0, 10) : "",
      status:         c.status || "active",
    });
    setError("");
    setOpen(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!form.code.trim()) return setError("Coupon code is required.");
    if (!form.value)        return setError("Discount value is required.");

    const payload = {
      ...form,
      code:           form.code.toUpperCase().trim(),
      value:          Number(form.value),
      maxDiscount:    form.maxDiscount !== "" ? Number(form.maxDiscount) : null,
      minOrderAmount: form.minOrderAmount !== "" ? Number(form.minOrderAmount) : 0,
      usageLimit:     form.usageLimit !== "" ? Number(form.usageLimit) : null,
      startDate:      form.startDate || null,
      expiryDate:     form.expiryDate || null,
    };

    try {
      if (editingId) await updateCoupon.mutateAsync({ id: editingId, payload });
      else           await createCoupon.mutateAsync(payload);
      setOpen(false);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save coupon.");
    }
  }

  async function handleDelete(c) {
    if (!window.confirm(`Delete coupon "${c.code}"?`)) return;
    try {
      await deleteCoupon.mutateAsync(c._id);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete coupon.");
    }
  }

  const saving = createCoupon.isPending || updateCoupon.isPending;

  return (
    <div>
      <PageHeader
        title="Coupons"
        subtitle="Discount codes redeemable at checkout"
        actions={canCreate && (
          <Button onClick={openCreate}><FiPlus /> Add Coupon</Button>
        )}
      />

      {isLoading ? <Spinner /> : isError ? (
        <p style={{ color: "var(--color-danger)" }}>Failed to load coupons.</p>
      ) : coupons.length === 0 ? (
        <Card><p className="tab-empty">No coupons yet. Click Add Coupon to create one.</p></Card>
      ) : (
        <Card>
          <table className="data-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Type</th>
                <th>Discount</th>
                <th>Min Order</th>
                <th>Used / Limit</th>
                <th>Expiry</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((c) => (
                <tr key={c._id}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <FiTag size={14} color="var(--brand-gold, #b58a2e)" />
                      <strong style={{ letterSpacing: "0.05em" }}>{c.code}</strong>
                    </div>
                    {c.description && (
                      <div style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>
                        {c.description}
                      </div>
                    )}
                  </td>
                  <td style={{ textTransform: "capitalize" }}>{c.type}</td>
                  <td>
                    {c.type === "flat"
                      ? fmt(c.value)
                      : `${c.value}%${c.maxDiscount ? ` (max ${fmt(c.maxDiscount)})` : ""}`}
                  </td>
                  <td>{c.minOrderAmount > 0 ? fmt(c.minOrderAmount) : "—"}</td>
                  <td>{c.usedCount ?? 0} / {c.usageLimit ?? "∞"}</td>
                  <td>
                    {c.expiryDate
                      ? new Date(c.expiryDate).toLocaleDateString("en-IN")
                      : "No expiry"}
                  </td>
                  <td><span className={`badge badge--${c.status}`}>{c.status}</span></td>
                  <td>
                    <div style={{ display: "flex", gap: 8 }}>
                      {canEdit && (
                        <button className="cat-card__btn" onClick={() => openEdit(c)}>
                          <FiEdit2 /> Edit
                        </button>
                      )}
                      {canDelete && (
                        <button
                          className="cat-card__btn cat-card__btn--danger"
                          onClick={() => handleDelete(c)}>
                          <FiTrash2 /> Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {/* Create / Edit modal */}
      <Modal
        open={open}
        title={editingId ? "Edit Coupon" : "Create Coupon"}
        onClose={() => setOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={saving}>
              {saving ? "Saving…" : editingId ? "Save Changes" : "Create Coupon"}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit}>
          {/* Basic */}
          <div className="form-section__title">Basic</div>
          <div className="form-grid">
            <FormField label="Coupon Code *" htmlFor="cp-code">
              <input
                id="cp-code"
                value={form.code}
                onChange={set("code")}
                placeholder="e.g. SAVE200"
                style={{ textTransform: "uppercase" }}
                disabled={!!editingId}
              />
            </FormField>
            <FormField label="Status" htmlFor="cp-status">
              <select id="cp-status" value={form.status} onChange={set("status")}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </FormField>
          </div>
          <FormField label="Description (shown to customer)" htmlFor="cp-desc">
            <input
              id="cp-desc"
              value={form.description}
              onChange={set("description")}
              placeholder="e.g. ₹200 off on orders above ₹3,000"
            />
          </FormField>

          {/* Discount */}
          <div className="form-section__title">Discount</div>
          <div className="form-grid">
            <FormField label="Type *" htmlFor="cp-type">
              <select id="cp-type" value={form.type} onChange={set("type")}>
                <option value="flat">Flat (₹ amount off)</option>
                <option value="percent">Percent (% off)</option>
              </select>
            </FormField>
            <FormField
              label={form.type === "flat" ? "Discount Amount (₹) *" : "Discount % *"}
              htmlFor="cp-val">
              <input
                id="cp-val"
                type="number"
                min="0"
                value={form.value}
                onChange={set("value")}
                placeholder={form.type === "flat" ? "e.g. 200" : "e.g. 10"}
              />
            </FormField>
            {form.type === "percent" && (
              <FormField label="Max Discount (₹) — optional cap" htmlFor="cp-maxd">
                <input
                  id="cp-maxd"
                  type="number"
                  min="0"
                  value={form.maxDiscount}
                  onChange={set("maxDiscount")}
                  placeholder="e.g. 500"
                />
              </FormField>
            )}
          </div>

          {/* Conditions */}
          <div className="form-section__title">Conditions</div>
          <div className="form-grid">
            <FormField label="Minimum Order Amount (₹)" htmlFor="cp-min">
              <input
                id="cp-min"
                type="number"
                min="0"
                value={form.minOrderAmount}
                onChange={set("minOrderAmount")}
                placeholder="e.g. 3000"
              />
            </FormField>
            <FormField label="Usage Limit (blank = unlimited)" htmlFor="cp-limit">
              <input
                id="cp-limit"
                type="number"
                min="1"
                value={form.usageLimit}
                onChange={set("usageLimit")}
                placeholder="e.g. 100"
              />
            </FormField>
          </div>

          {/* Validity */}
          <div className="form-section__title">Validity</div>
          <div className="form-grid">
            <FormField label="Start Date (optional)" htmlFor="cp-start">
              <input
                id="cp-start"
                type="date"
                value={form.startDate}
                onChange={set("startDate")}
              />
            </FormField>
            <FormField label="Expiry Date (optional)" htmlFor="cp-expiry">
              <input
                id="cp-expiry"
                type="date"
                value={form.expiryDate}
                onChange={set("expiryDate")}
              />
            </FormField>
          </div>

          {/* Category restriction */}
          <div className="form-section__title">
            Category Restriction
            <span style={{ fontSize: "0.8rem", fontWeight: 400, color: "var(--color-text-muted)", marginLeft: 8 }}>
              (leave blank to apply to all categories)
            </span>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
            {categories.map((cat) => {
              const checked = form.categories.includes(String(cat._id));
              return (
                <label
                  key={cat._id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "5px 12px",
                    borderRadius: 999,
                    border: `1.5px solid ${checked ? "var(--brand-gold, #b58a2e)" : "#ddd"}`,
                    background: checked ? "#fff6dc" : "#fff",
                    cursor: "pointer",
                    fontSize: "0.85rem",
                    fontWeight: checked ? 600 : 400,
                    color: checked ? "#b58a2e" : "inherit",
                  }}
                >
                  <input
                    type="checkbox"
                    style={{ display: "none" }}
                    checked={checked}
                    onChange={() => toggleCat(String(cat._id))}
                  />
                  {cat.name}
                </label>
              );
            })}
          </div>

          {error && <p style={{ color: "var(--color-danger)" }}>{error}</p>}
        </form>
      </Modal>
    </div>
  );
}

export default CouponsPage;
