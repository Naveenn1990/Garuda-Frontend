// Products list page as cards: image, name, brand/category, price, status, and
// Edit/Delete actions. Keeps search, CSV export and bulk upload.
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiEdit2, FiTrash2 } from "react-icons/fi";
import { PageHeader, Card, Button, Spinner, BulkUpload, ExportButton } from "../../../components";
import { usePermissions } from "../../../app/store/permissionStore";
import { useProducts, useBulkProducts, useDeleteProduct } from "../hooks/useProducts";
import config from "../../../config";
import "../../categories/pages/CategoriesPage.css";

const PRODUCT_HEADERS = ["name", "sku", "model", "category", "brand", "mrp", "sellingPrice", "discount", "gst", "hsn"];
const PRODUCT_SAMPLE = ["LG Refrigerator 260L", "FRIDGE-LG-260", "GL-B261", "Appliances", "LG", "30000", "27000", "3000", "18", "8418"];

const EXPORT_COLUMNS = [
  { header: "Name", value: (r) => r.name },
  { header: "SKU", value: (r) => r.sku },
  { header: "Category", value: (r) => r.category?.name || "" },
  { header: "Brand", value: (r) => r.brand?.name || "" },
  { header: "MRP", value: (r) => r.mrp },
  { header: "Selling Price", value: (r) => r.sellingPrice },
  { header: "GST", value: (r) => r.gst },
  { header: "Status", value: (r) => r.status },
];

const apiOrigin = config.apiBaseUrl.replace(/\/api\/v1\/?$/, "");
function imageUrl(src) {
  if (!src) return "";
  if (/^https?:\/\//i.test(src)) return src;
  return `${apiOrigin}${src.startsWith("/") ? "" : "/"}${src}`;
}
const inr = (n) => (typeof n === "number" ? `₹${n.toLocaleString("en-IN")}` : "—");

export function ProductsPage() {
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const [q, setQ] = useState("");
  const [bulkOpen, setBulkOpen] = useState(false);
  const bulkProducts = useBulkProducts();
  const deleteProduct = useDeleteProduct();
  const { data: rows = [], isLoading, isError } = useProducts(q ? { q } : {});

  const canCreate = hasPermission("products.create");
  const canEdit = hasPermission("products.edit");
  const canDelete = hasPermission("products.delete");

  async function handleDelete(product) {
    if (!window.confirm(`Delete product "${product.name}"? This cannot be undone.`)) return;
    try {
      await deleteProduct.mutateAsync(product._id);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete product.");
    }
  }

  return (
    <div>
      <PageHeader
        title="Products"
        subtitle="Manage the product catalogue"
        actions={
          <div style={{ display: "flex", gap: 8 }}>
            <ExportButton rows={rows} columns={EXPORT_COLUMNS} filename="products.csv" />
            {canCreate && (
              <>
                <Button variant="secondary" onClick={() => setBulkOpen(true)}>Bulk Upload</Button>
                <Button onClick={() => navigate("/products/create")}>+ Add Product</Button>
              </>
            )}
          </div>
        }
      />
      <div style={{ marginBottom: 16 }}>
        <input
          className="search-input"
          placeholder="Search by name, SKU, model or code..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {isLoading ? (
        <Spinner />
      ) : isError ? (
        <p style={{ color: "var(--color-danger)" }}>Failed to load products. Is the API running?</p>
      ) : rows.length === 0 ? (
        <Card>
          <p className="tab-empty">No products yet. Click Add Product to create one.</p>
        </Card>
      ) : (
        <div className="cat-cards">
          {rows.map((p) => (
            <div className="cat-card" key={p._id}>
              <div className="cat-card__media cat-card__media--contain">
                {p.images?.[0] ? (
                  <img src={imageUrl(p.images[0])} alt={p.name} />
                ) : (
                  <div className="cat-card__noimg">{p.name.charAt(0)}</div>
                )}
              </div>
              <div className="cat-card__body">
                {p.brand?.name && (
                  <span style={{ fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--brand-gold, #b58a2e)" }}>
                    {p.brand.name}
                  </span>
                )}
                <h3 className="cat-card__name">{p.name}</h3>
                <div style={{ color: "var(--color-text-muted)", fontSize: "0.82rem" }}>
                  {p.sku}
                  {p.category?.name ? ` · ${p.category.name}` : ""}
                </div>
                <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 8 }}>
                  <strong>{inr(p.sellingPrice)}</strong>
                  <span className={`badge badge--${p.status}`}>{p.status}</span>
                </div>
              </div>
              <div className="cat-card__actions">
                {canEdit && (
                  <button className="cat-card__btn" onClick={() => navigate(`/products/${p._id}/edit`)}>
                    <FiEdit2 /> Edit
                  </button>
                )}
                {canDelete && (
                  <button className="cat-card__btn cat-card__btn--danger" onClick={() => handleDelete(p)}>
                    <FiTrash2 /> Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <BulkUpload
        open={bulkOpen}
        onClose={() => setBulkOpen(false)}
        title="Bulk Upload Products"
        headers={PRODUCT_HEADERS}
        sampleRow={PRODUCT_SAMPLE}
        templateName="products-template.csv"
        onUpload={(rows) => bulkProducts.mutateAsync(rows)}
      />
    </div>
  );
}

export default ProductsPage;
