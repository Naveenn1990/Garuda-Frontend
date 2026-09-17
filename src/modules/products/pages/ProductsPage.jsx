// Items / Products catalogue page with myBillBook architecture & KPIs
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiEdit2, FiTrash2, FiBox, FiAlertTriangle, FiDollarSign, FiList, FiGrid } from "react-icons/fi";
import { PageHeader, Card, Button, Spinner, BulkUpload, ExportButton, DataTable } from "../../../components";
import { usePermissions } from "../../../app/store/permissionStore";
import { useProducts, useBulkProducts, useDeleteProduct } from "../hooks/useProducts";
import config from "../../../config";
import "../../categories/pages/CategoriesPage.css";

const PRODUCT_HEADERS = ["name", "sku", "model", "category", "brand", "mrp", "sellingPrice", "discount", "gst", "hsn"];
const PRODUCT_SAMPLE = ["LG Refrigerator 260L", "FRIDGE-LG-260", "GL-B261", "Appliances", "LG", "30000", "27000", "3000", "18", "8418"];

const EXPORT_COLUMNS = [
  { header: "Name", value: (r) => r.name },
  { header: "SKU / Code", value: (r) => r.sku },
  { header: "Category", value: (r) => r.category?.name || "" },
  { header: "Brand", value: (r) => r.brand?.name || "" },
  { header: "Sales Price", value: (r) => r.sellingPrice },
  { header: "Purchase Price", value: (r) => r.purchasePrice || 0 },
  { header: "GST", value: (r) => r.gst },
  { header: "Unit", value: (r) => r.unit || "PCS" },
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
  const [viewMode, setViewMode] = useState("table"); // 'table' or 'grid'
  const [bulkOpen, setBulkOpen] = useState(false);
  const bulkProducts = useBulkProducts();
  const deleteProduct = useDeleteProduct();
  const { data: rows = [], isLoading, isError } = useProducts(q ? { q } : {});

  const canCreate = hasPermission("products.create");
  const canEdit = hasPermission("products.edit");
  const canDelete = hasPermission("products.delete");

  // Calculate KPIs
  const totalStockValue = rows.reduce(
    (sum, p) => sum + (p.sellingPrice || 0) * (p.openingStock || 1),
    0
  );
  const lowStockCount = rows.filter((p) => (p.openingStock || 0) <= (p.lowStockAlert || 2)).length;

  async function handleDelete(product) {
    if (!window.confirm(`Delete product "${product.name}"? This cannot be undone.`)) return;
    try {
      await deleteProduct.mutateAsync(product._id);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete product.");
    }
  }

  const tableColumns = [
    {
      key: "name",
      header: "Item Name",
      render: (r) => (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {r.images?.[0] ? (
            <img
              src={imageUrl(r.images[0])}
              alt={r.name}
              style={{ width: 34, height: 34, objectFit: "cover", borderRadius: 6, border: "1px solid #e5dcc4" }}
            />
          ) : (
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 6,
                background: "#fff6dc",
                color: "#c68629",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 700,
                fontSize: "0.85rem",
              }}
            >
              {r.name?.charAt(0) || "I"}
            </div>
          )}
          <div>
            <div style={{ fontWeight: 700, color: "#1c1b17" }}>{r.name}</div>
            <div style={{ fontSize: "0.76rem", color: "#8c826c" }}>
              Code: {r.sku} {r.hsn ? `• HSN: ${r.hsn}` : ""}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "category",
      header: "Category & Brand",
      render: (r) => (
        <div>
          <div style={{ fontWeight: 600, color: "#3b372f" }}>{r.category?.name || "General"}</div>
          <div style={{ fontSize: "0.76rem", color: "#787163" }}>{r.brand?.name || "—"}</div>
        </div>
      ),
    },
    {
      key: "sellingPrice",
      header: "Sales Price",
      render: (r) => (
        <div style={{ fontWeight: 700, color: "#1c1b17" }}>
          ₹ {(r.sellingPrice || 0).toLocaleString("en-IN")}
          <span style={{ fontSize: "0.75rem", color: "#787163", fontWeight: 500, marginLeft: 4 }}>
            ({r.taxInclusive ? "With Tax" : "Excl. Tax"})
          </span>
        </div>
      ),
    },
    {
      key: "purchasePrice",
      header: "Purchase Price",
      render: (r) => (
        <div style={{ color: "#4b5563" }}>
          ₹ {(r.purchasePrice || 0).toLocaleString("en-IN")}
        </div>
      ),
    },
    {
      key: "stock",
      header: "Opening Stock",
      render: (r) => (
        <div style={{ fontWeight: 700, color: (r.openingStock || 0) <= 2 ? "#dc2626" : "#16a34a" }}>
          {r.openingStock || 0} {r.unit || "PCS"}
        </div>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (p) => (
        <div style={{ display: "flex", gap: 6 }} onClick={(e) => e.stopPropagation()}>
          {canEdit && (
            <button
              className="cat-card__btn"
              onClick={() => navigate(`/products/${p._id}/edit`)}
              title="Edit Product"
              style={{ padding: "4px 8px", borderRadius: 6, border: "1px solid #dcd3be", background: "#fff", cursor: "pointer" }}
            >
              <FiEdit2 />
            </button>
          )}
          {canDelete && (
            <button
              className="cat-card__btn cat-card__btn--danger"
              onClick={() => handleDelete(p)}
              title="Delete Product"
              style={{ padding: "4px 8px", borderRadius: 6, border: "1px solid #fee2e2", background: "#fff", color: "#dc2626", cursor: "pointer" }}
            >
              <FiTrash2 />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      {/* Top KPI Cards (Screenshots 3-5 Architecture) */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 20 }}>
        <div
          style={{
            background: "#fff6dc",
            border: "1px solid #c68629",
            borderRadius: 12,
            padding: "16px 20px",
            boxShadow: "0 2px 6px rgba(0,0,0,0.03)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#8a6016", fontSize: "0.85rem", fontWeight: 700 }}>
            <FiDollarSign />
            <span>Estimated Stock Value</span>
          </div>
          <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "#1c1b17", marginTop: 6 }}>
            ₹ {totalStockValue.toLocaleString("en-IN")}
          </div>
        </div>

        <div
          style={{
            background: lowStockCount > 0 ? "#fff1f2" : "#ffffff",
            border: `1px solid ${lowStockCount > 0 ? "#f43f5e" : "#e8dfc7"}`,
            borderRadius: 12,
            padding: "16px 20px",
            boxShadow: "0 2px 6px rgba(0,0,0,0.03)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: lowStockCount > 0 ? "#be123c" : "#787163", fontSize: "0.85rem", fontWeight: 700 }}>
            <FiAlertTriangle />
            <span>Low Stock Items</span>
          </div>
          <div style={{ fontSize: "1.6rem", fontWeight: 800, color: lowStockCount > 0 ? "#e11d48" : "#1c1b17", marginTop: 6 }}>
            {lowStockCount}
          </div>
        </div>

        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e8dfc7",
            borderRadius: 12,
            padding: "16px 20px",
            boxShadow: "0 2px 6px rgba(0,0,0,0.03)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#787163", fontSize: "0.85rem", fontWeight: 700 }}>
            <FiBox style={{ color: "#c68629" }} />
            <span>Total Active Items</span>
          </div>
          <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "#1c1b17", marginTop: 6 }}>
            {rows.length}
          </div>
        </div>
      </div>

      <PageHeader
        title="Items & Products"
        subtitle="Manage inventory items, pricing tiers and stock rules"
        actions={
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <div style={{ display: "flex", background: "#f5efe1", borderRadius: 8, padding: 3, border: "1px solid #e5dcc4" }}>
              <button
                type="button"
                onClick={() => setViewMode("table")}
                style={{
                  background: viewMode === "table" ? "#ffffff" : "transparent",
                  border: "none",
                  padding: "6px 10px",
                  borderRadius: 6,
                  cursor: "pointer",
                  color: viewMode === "table" ? "#8a6016" : "#787163",
                  display: "flex",
                  alignItems: "center",
                }}
                title="Table View"
              >
                <FiList />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                style={{
                  background: viewMode === "grid" ? "#ffffff" : "transparent",
                  border: "none",
                  padding: "6px 10px",
                  borderRadius: 6,
                  cursor: "pointer",
                  color: viewMode === "grid" ? "#8a6016" : "#787163",
                  display: "flex",
                  alignItems: "center",
                }}
                title="Cards Grid View"
              >
                <FiGrid />
              </button>
            </div>

            <ExportButton rows={rows} columns={EXPORT_COLUMNS} filename="items.csv" />
            {canCreate && (
              <>
                <Button variant="secondary" onClick={() => setBulkOpen(true)}>
                  Bulk Upload
                </Button>
                <Button onClick={() => navigate("/products/create")}>+ Create Item</Button>
              </>
            )}
          </div>
        }
      />

      <div style={{ marginBottom: 16 }}>
        <input
          className="search-input"
          placeholder="Search items by name, SKU, barcode, model or HSN..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {isLoading ? (
        <Spinner />
      ) : isError ? (
        <p style={{ color: "var(--color-danger)" }}>Failed to load items. Is the API running?</p>
      ) : rows.length === 0 ? (
        <Card>
          <p className="tab-empty">No items yet. Click "+ Create Item" to add your first product.</p>
        </Card>
      ) : viewMode === "table" ? (
        <DataTable
          columns={tableColumns}
          rows={rows}
          emptyText="No items found."
          onRowClick={(row) => navigate(`/products/${row._id}/edit`)}
        />
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
                <div className="cat-card__title" title={p.name}>
                  {p.name}
                </div>
                <div className="cat-card__meta">
                  <span>{p.brand?.name || "Garuda"}</span>
                  <span>{p.category?.name || "Appliances"}</span>
                </div>
                <div className="cat-card__code">
                  SKU: <strong>{p.sku}</strong>
                  {p.hsn && ` | HSN: ${p.hsn}`}
                </div>
                <div className="cat-card__prices">
                  <span className="cat-card__selling">{inr(p.sellingPrice)}</span>
                  {p.mrp > p.sellingPrice && <span className="cat-card__mrp">{inr(p.mrp)}</span>}
                </div>
                <div style={{ fontSize: "0.78rem", fontWeight: 700, color: (p.openingStock || 0) <= 2 ? "#dc2626" : "#16a34a", marginTop: 4 }}>
                  Stock: {p.openingStock || 0} {p.unit || "PCS"}
                </div>
              </div>
              <div className="cat-card__footer">
                <span className={`badge badge--${p.status}`}>{p.status}</span>
                <div className="cat-card__actions">
                  {canEdit && (
                    <button
                      className="cat-card__btn"
                      onClick={() => navigate(`/products/${p._id}/edit`)}
                      title="Edit Product"
                    >
                      <FiEdit2 />
                    </button>
                  )}
                  {canDelete && (
                    <button
                      className="cat-card__btn cat-card__btn--danger"
                      onClick={() => handleDelete(p)}
                      title="Delete Product"
                    >
                      <FiTrash2 />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <BulkUpload
        open={bulkOpen}
        onClose={() => setBulkOpen(false)}
        title="Bulk Upload Items"
        headers={PRODUCT_HEADERS}
        sampleRow={PRODUCT_SAMPLE}
        templateName="items-template.csv"
        onUpload={(rows) => bulkProducts.mutateAsync(rows)}
      />
    </div>
  );
}

export default ProductsPage;
