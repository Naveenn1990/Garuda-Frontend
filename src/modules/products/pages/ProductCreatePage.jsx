// Create Product form. Covers the SOW fields: info (name/SKU/model/code), category &
// brand, pricing (MRP/selling/discount), tax (GST/HSN), featured flags and status.
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { PageHeader, Card, FormField, Button, Spinner } from "../../../components";
import { config } from "../../../config";
import { useCategories } from "../../categories/hooks/useCategories";
import { useBrands } from "../../brands/hooks/useBrands";
import {
  useCreateProduct,
  useUpdateProduct,
  useProduct,
  useUploadImages,
} from "../hooks/useProducts";

const initial = {
  name: "",
  sku: "",
  model: "",
  productCode: "",
  description: "",
  brand: "",
  mrp: "",
  sellingPrice: "",
  discount: "",
  gst: "",
  hsn: "",
  isBestseller: false,
  isNewArrival: false,
  isFeatured: false,
  status: "active",
};

// Common specification labels the admin can quick-add (they can also type any custom
// label). Mirrors the sample spec sheet: product type, model, colour, capacity, etc.
const COMMON_SPECS = [
  "Product Type",
  "Model Number",
  "Colour",
  "Capacity",
  "Cooling Technology",
  "Refrigerator Type",
  "Star Rating",
  "Defrost System",
  "Door Type",
  "Model Code",
  "Installation Type",
  "Suitable For",
  "Key Features",
  "Country of Origin",
  "Warranty",
  "Power Consumption",
  "Dimensions",
  "Weight",
];

export function ProductCreatePage() {
  const navigate = useNavigate();
  const { id } = useParams(); // present => edit mode
  const isEdit = Boolean(id);

  const { data: categories = [], isLoading: catLoading } = useCategories();
  const { data: brands = [], isLoading: brandLoading } = useBrands();
  const { data: existing, isLoading: prodLoading } = useProduct(id);
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const uploadImages = useUploadImages();

  const [form, setForm] = useState(initial);
  const [images, setImages] = useState([]); // uploaded image URLs
  const [variants, setVariants] = useState([]); // [{name,value,sku,price}]
  const [specs, setSpecs] = useState([]); // [{key, value}]
  const [error, setError] = useState("");

  // Guided category selection: pick a top-level category (required), then optionally
  // a sub-category of it. The product's stored category is the deepest one chosen.
  const [topCategory, setTopCategory] = useState(""); // top-level category id
  const [subCategory, setSubCategory] = useState(""); // optional sub-category id

  // When editing, prefill the form once the product and categories have loaded.
  useEffect(() => {
    if (!isEdit || !existing || categories.length === 0) return;
    setForm({
      name: existing.name || "",
      sku: existing.sku || "",
      model: existing.model || "",
      productCode: existing.productCode || "",
      description: existing.description || "",
      brand: existing.brand?._id || existing.brand || "",
      mrp: existing.mrp ?? "",
      sellingPrice: existing.sellingPrice ?? "",
      discount: existing.discount ?? "",
      gst: existing.gst ?? "",
      hsn: existing.hsn || "",
      isBestseller: !!existing.isBestseller,
      isNewArrival: !!existing.isNewArrival,
      isFeatured: !!existing.isFeatured,
      status: existing.status || "active",
    });
    setImages(existing.images || []);
    setVariants(existing.variants || []);
    setSpecs(existing.specifications || []);

    // Resolve stored category into top/sub selects. The stored category may be a
    // sub-category (has a parent) or a top-level category.
    const storedCatId = existing.category?._id || existing.category;
    const storedCat = categories.find((c) => c._id === storedCatId);
    if (storedCat) {
      const parentId = storedCat.parent && (storedCat.parent._id || storedCat.parent);
      if (parentId) {
        setTopCategory(parentId);
        setSubCategory(storedCat._id);
      } else {
        setTopCategory(storedCat._id);
        setSubCategory("");
      }
    }
  }, [isEdit, existing, categories]);

  // Top-level categories = those without a parent.
  const topCategories = categories.filter((c) => !c.parent);
  // Sub-categories of the chosen top category. `parent` may be populated (object) or an id.
  const subCategories = topCategory
    ? categories.filter((c) => {
        const parentId = c.parent && (c.parent._id || c.parent);
        return parentId === topCategory;
      })
    : [];

  function handleTopCategoryChange(e) {
    setTopCategory(e.target.value);
    setSubCategory(""); // reset sub when top changes
  }

  // Server origin (strip the /api/v1 suffix) to render uploaded image URLs.
  const serverOrigin = config.apiBaseUrl.replace(/\/api\/v1\/?$/, "");

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });
  const toggle = (key) => (e) => setForm({ ...form, [key]: e.target.checked });

  async function handleImagePick(e) {
    const files = e.target.files;
    if (!files || !files.length) return;
    try {
      const urls = await uploadImages.mutateAsync(files);
      setImages((prev) => [...prev, ...urls]);
    } catch (err) {
      setError(err.response?.data?.message || "Image upload failed.");
    }
    e.target.value = "";
  }

  function addVariant() {
    setVariants((prev) => [...prev, { name: "", value: "", sku: "", price: "" }]);
  }
  function updateVariant(i, patch) {
    setVariants((prev) => prev.map((v, idx) => (idx === i ? { ...v, ...patch } : v)));
  }
  function removeVariant(i) {
    setVariants((prev) => prev.filter((_, idx) => idx !== i));
  }

  // --- Specifications ---
  function addSpec(key = "") {
    setSpecs((prev) => [...prev, { key, value: "" }]);
  }
  function updateSpec(i, patch) {
    setSpecs((prev) => prev.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  }
  function removeSpec(i) {
    setSpecs((prev) => prev.filter((_, idx) => idx !== i));
  }
  // Add all the common labels that aren't already present, as blank rows to fill in.
  function addCommonSpecs() {
    setSpecs((prev) => {
      const existingKeys = new Set(prev.map((s) => s.key.toLowerCase()));
      const toAdd = COMMON_SPECS.filter((k) => !existingKeys.has(k.toLowerCase())).map((k) => ({ key: k, value: "" }));
      return [...prev, ...toAdd];
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    // Mandatory: brand + a top-level category. Sub-category is optional.
    if (!form.brand) return setError("Brand is required.");
    if (!topCategory) return setError("Category is required.");

    // Store the deepest category chosen: sub-category if picked, else the top.
    const finalCategory = subCategory || topCategory;

    const payload = {
      ...form,
      mrp: Number(form.mrp) || 0,
      sellingPrice: Number(form.sellingPrice) || 0,
      discount: Number(form.discount) || 0,
      gst: Number(form.gst) || 0,
      category: finalCategory,
      brand: form.brand,
      images,
      variants: variants
        .filter((v) => v.name || v.value)
        .map((v) => ({ ...v, price: Number(v.price) || 0 })),
      // Only keep spec rows that have a label.
      specifications: specs.filter((s) => s.key && s.key.trim()),
    };
    try {
      if (isEdit) {
        await updateProduct.mutateAsync({ id, payload });
      } else {
        await createProduct.mutateAsync(payload);
      }
      navigate("/products");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save product.");
    }
  }

  if (catLoading || brandLoading || (isEdit && prodLoading)) return <Spinner />;

  const saving = createProduct.isPending || updateProduct.isPending;

  return (
    <div>
      <PageHeader
        title={isEdit ? "Edit Product" : "Create Product"}
        subtitle={isEdit ? "Update product details" : "Add a product to the catalogue"}
      />
      <Card>
        <form onSubmit={handleSubmit}>
          <div className="form-section__title">Classification</div>
          <div className="form-grid">
            {/* Step 1: Brand (mandatory, chosen first) */}
            <FormField label="Brand *" htmlFor="brand">
              <select id="brand" value={form.brand} onChange={set("brand")} required>
                <option value="">Select brand</option>
                {brands.map((b) => (
                  <option key={b._id} value={b._id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </FormField>

            {/* Step 2: Category (mandatory) - top-level categories only */}
            <FormField label="Category *" htmlFor="category">
              <select id="category" value={topCategory} onChange={handleTopCategoryChange} required>
                <option value="">Select category</option>
                {topCategories.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </FormField>

            {/* Step 3: Sub-category (optional) - only when the chosen category has children */}
            {topCategory && subCategories.length > 0 && (
              <FormField label="Sub-category (optional)" htmlFor="subcategory">
                <select id="subcategory" value={subCategory} onChange={(e) => setSubCategory(e.target.value)}>
                  <option value="">None (add directly under category)</option>
                  {subCategories.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </FormField>
            )}
          </div>

          <div className="form-section__title">Product Information</div>
          <div className="form-grid">
            <FormField label="Product Name *" htmlFor="name">
              <input id="name" value={form.name} onChange={set("name")} required />
            </FormField>
            <FormField label="SKU *" htmlFor="sku">
              <input id="sku" value={form.sku} onChange={set("sku")} placeholder="SOFA-001" required />
            </FormField>
            <FormField label="Model" htmlFor="model">
              <input id="model" value={form.model} onChange={set("model")} />
            </FormField>
            <FormField label="Product Code" htmlFor="productCode">
              <input id="productCode" value={form.productCode} onChange={set("productCode")} />
            </FormField>
          </div>
          <FormField label="Description" htmlFor="description">
            <textarea
              id="description"
              rows={4}
              value={form.description}
              onChange={set("description")}
              placeholder="Describe the product, key highlights, what makes it great..."
              style={{ width: "100%", padding: "10px 12px", border: "1px solid var(--color-border)", borderRadius: 8, fontFamily: "inherit", fontSize: "0.95rem" }}
            />
          </FormField>

          <div className="form-section__title">Pricing</div>
          <div className="form-grid">
            <FormField label="MRP (₹)" htmlFor="mrp">
              <input id="mrp" type="number" min="0" value={form.mrp} onChange={set("mrp")} />
            </FormField>
            <FormField label="Selling Price (₹)" htmlFor="sellingPrice">
              <input id="sellingPrice" type="number" min="0" value={form.sellingPrice} onChange={set("sellingPrice")} />
            </FormField>
            <FormField label="Discount (₹)" htmlFor="discount">
              <input id="discount" type="number" min="0" value={form.discount} onChange={set("discount")} />
            </FormField>
          </div>

          <div className="form-section__title">Tax</div>
          <div className="form-grid">
            <FormField label="GST (%)" htmlFor="gst">
              <input id="gst" type="number" min="0" value={form.gst} onChange={set("gst")} />
            </FormField>
            <FormField label="HSN" htmlFor="hsn">
              <input id="hsn" value={form.hsn} onChange={set("hsn")} />
            </FormField>
          </div>

          <div className="form-section__title">Images</div>
          <div>
            <input type="file" accept="image/*" multiple onChange={handleImagePick} disabled={uploadImages.isPending} />
            {uploadImages.isPending && <span style={{ marginLeft: 8, color: "var(--color-text-muted)" }}>Uploading...</span>}
            <div className="product-images">
              {images.map((url) => (
                <div key={url} className="product-images__thumb">
                  <img src={`${serverOrigin}${url}`} alt="" />
                  <button type="button" onClick={() => setImages(images.filter((u) => u !== url))}>×</button>
                </div>
              ))}
            </div>
          </div>

          <div className="form-section__title">Specifications</div>
          <div>
            <p style={{ margin: "0 0 10px", color: "var(--color-text-muted)", fontSize: "0.88rem" }}>
              Add spec rows (e.g. Capacity, Colour, Star Rating). These show as a table on the product page.
            </p>
            {specs.length > 0 && (
              <div className="data-table__wrap" style={{ border: "1px solid var(--color-border)", marginBottom: 10 }}>
                <table className="data-table">
                  <thead>
                    <tr><th style={{ width: "40%" }}>Specification</th><th>Details</th><th></th></tr>
                  </thead>
                  <tbody>
                    {specs.map((s, i) => (
                      <tr key={i}>
                        <td>
                          <input
                            list="spec-suggestions"
                            value={s.key}
                            onChange={(e) => updateSpec(i, { key: e.target.value })}
                            placeholder="e.g. Capacity"
                            style={{ width: "100%" }}
                          />
                        </td>
                        <td>
                          <input
                            value={s.value}
                            onChange={(e) => updateSpec(i, { value: e.target.value })}
                            placeholder="e.g. 190 Litres"
                            style={{ width: "100%" }}
                          />
                        </td>
                        <td><Button variant="secondary" type="button" onClick={() => removeSpec(i)}>×</Button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {/* Datalist gives quick suggestions while still allowing custom labels. */}
            <datalist id="spec-suggestions">
              {COMMON_SPECS.map((k) => (
                <option key={k} value={k} />
              ))}
            </datalist>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <Button variant="secondary" type="button" onClick={() => addSpec()}>+ Add Specification</Button>
              <Button variant="secondary" type="button" onClick={addCommonSpecs}>+ Add Common Fields</Button>
            </div>
          </div>

          <div className="form-section__title">Variants</div>
          <div>
            {variants.length > 0 && (
              <div className="data-table__wrap" style={{ border: "1px solid var(--color-border)", marginBottom: 10 }}>
                <table className="data-table">
                  <thead>
                    <tr><th>Attribute</th><th>Value</th><th>SKU</th><th>Price</th><th></th></tr>
                  </thead>
                  <tbody>
                    {variants.map((v, i) => (
                      <tr key={i}>
                        <td><input value={v.name} onChange={(e) => updateVariant(i, { name: e.target.value })} placeholder="Color" style={{ width: 100 }} /></td>
                        <td><input value={v.value} onChange={(e) => updateVariant(i, { value: e.target.value })} placeholder="Red" style={{ width: 100 }} /></td>
                        <td><input value={v.sku} onChange={(e) => updateVariant(i, { sku: e.target.value })} style={{ width: 120 }} /></td>
                        <td><input type="number" min="0" value={v.price} onChange={(e) => updateVariant(i, { price: e.target.value })} style={{ width: 90 }} /></td>
                        <td><Button variant="secondary" type="button" onClick={() => removeVariant(i)}>×</Button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <Button variant="secondary" type="button" onClick={addVariant}>+ Add Variant</Button>
          </div>

          <div className="form-section__title">Featured</div>
          <div className="perm-group__actions" style={{ padding: 0 }}>
            <label className="perm-action">
              <input type="checkbox" checked={form.isBestseller} onChange={toggle("isBestseller")} />
              Bestseller
            </label>
            <label className="perm-action">
              <input type="checkbox" checked={form.isNewArrival} onChange={toggle("isNewArrival")} />
              New Arrival
            </label>
            <label className="perm-action">
              <input type="checkbox" checked={form.isFeatured} onChange={toggle("isFeatured")} />
              Featured
            </label>
          </div>

          <div className="form-section__title">Status</div>
          <div className="form-grid">
            <FormField label="Status" htmlFor="status">
              <select id="status" value={form.status} onChange={set("status")}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="discontinued">Discontinued</option>
              </select>
            </FormField>
          </div>

          {error && <p style={{ color: "var(--color-danger)" }}>{error}</p>}

          <div className="form-actions">
            <Button type="button" variant="secondary" onClick={() => navigate("/products")}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : isEdit ? "Save Changes" : "Save Product"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

export default ProductCreatePage;
