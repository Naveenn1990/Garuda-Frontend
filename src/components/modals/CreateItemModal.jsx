import { useState } from "react";
import {
  FiX,
  FiBox,
  FiLayers,
  FiTag,
  FiDollarSign,
  FiSliders,
  FiCheck,
  FiRefreshCw,
} from "react-icons/fi";
import { useCreateProduct } from "../../modules/products/hooks/useProducts";
import { useCategories } from "../../modules/categories/hooks/useCategories";
import { useBrands } from "../../modules/brands/hooks/useBrands";
import { useShowrooms } from "../../modules/showrooms/hooks/useShowrooms";
import { useUI } from "../../app/store/uiStore";
import "./CreateItemModal.css";

const UNITS = [
  { label: "Pieces (PCS)", value: "PCS" },
  { label: "Units (UNT)", value: "UNT" },
  { label: "Sets (SET)", value: "SET" },
  { label: "Boxes (BOX)", value: "BOX" },
  { label: "Kilograms (KG)", value: "KG" },
  { label: "Meters (MTR)", value: "MTR" },
];

const GST_RATES = [
  { label: "None (0%)", value: 0 },
  { label: "GST @ 5%", value: 5 },
  { label: "GST @ 12%", value: 12 },
  { label: "GST @ 18%", value: 18 },
  { label: "GST @ 28%", value: 28 },
];

const INITIAL_FORM = {
  itemType: "product",
  name: "",
  category: "",
  brand: "",
  sku: "",
  hsn: "8418",
  unit: "PCS",
  showOnline: true,
  salesPrice: "",
  purchasePrice: "",
  taxInclusive: true,
  gst: 18,
  discount: 0,
  openingStock: "",
  serialTracking: false,
  godown: "",
  asOfDate: new Date().toISOString().split("T")[0],
  lowStockAlert: 2,
  description: "",
  wholesalePrice: "",
  minSellingPrice: "",
  model: "",
  color: "",
  warranty: "12 Months",
  partyWisePrices: [
    { partyType: "Wholesale", price: "" },
    { partyType: "Dealer", price: "" },
    { partyType: "Corporate", price: "" },
  ],
};

export function CreateItemModal({ isOpen, onClose, onSuccess }) {
  const { closeItemModal, itemModalCallback } = useUI();
  const { data: categories = [] } = useCategories();
  const { data: brands = [] } = useBrands();
  const { data: showrooms = [] } = useShowrooms();
  const createMutation = useCreateProduct();

  const [activeTab, setActiveTab] = useState("basic");
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [errorMsg, setErrorMsg] = useState("");
  const [savedToast, setSavedToast] = useState(false);

  const handleClose = () => {
    if (onClose) onClose();
    else closeItemModal();
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    if (errorMsg) setErrorMsg("");
  };

  const generateBarcode = () => {
    const cleanName = (formData.name || "ITM").replace(/[^a-zA-Z0-9]/g, "").slice(0, 4).toUpperCase();
    const randomNum = Math.floor(100000 + Math.random() * 900000);
    setFormData((prev) => ({ ...prev, sku: `${cleanName}-${randomNum}` }));
  };

  const handlePartyPriceChange = (index, value) => {
    setFormData((prev) => {
      const updated = [...prev.partyWisePrices];
      updated[index] = { ...updated[index], price: value };
      return { ...prev, partyWisePrices: updated };
    });
  };

  const handleSave = async (saveAndNew = false) => {
    if (!formData.name.trim()) {
      setErrorMsg("Item name is required.");
      setActiveTab("basic");
      return;
    }

    try {
      // Auto SKU if empty
      let finalSku = formData.sku.trim();
      if (!finalSku) {
        const cleanName = formData.name.replace(/[^a-zA-Z0-9]/g, "").slice(0, 4).toUpperCase();
        finalSku = `${cleanName || "ITM"}-${Date.now().toString().slice(-6)}`;
      }

      // Default category and brand if not chosen
      let finalCategory = formData.category;
      if (!finalCategory && categories.length > 0) finalCategory = categories[0]._id;
      let finalBrand = formData.brand;
      if (!finalBrand && brands.length > 0) finalBrand = brands[0]._id;

      const payload = {
        name: formData.name.trim(),
        sku: finalSku,
        itemType: formData.itemType,
        category: finalCategory || undefined,
        brand: finalBrand || undefined,
        hsn: formData.hsn.trim() || undefined,
        unit: formData.unit,
        showOnline: Boolean(formData.showOnline),
        sellingPrice: Number(formData.salesPrice) || 0,
        mrp: Number(formData.salesPrice) || 0,
        purchasePrice: Number(formData.purchasePrice) || 0,
        taxInclusive: Boolean(formData.taxInclusive),
        gst: Number(formData.gst) || 0,
        discount: Number(formData.discount) || 0,
        openingStock: Number(formData.openingStock) || 0,
        serialTracking: Boolean(formData.serialTracking),
        showroom: formData.godown || (showrooms.length > 0 ? showrooms[0]._id : undefined),
        lowStockAlert: Number(formData.lowStockAlert) || 0,
        description: formData.description.trim() || undefined,
        wholesalePrice: Number(formData.wholesalePrice) || 0,
        minSellingPrice: Number(formData.minSellingPrice) || 0,
        model: formData.model.trim() || undefined,
        color: formData.color.trim() || undefined,
        warranty: formData.warranty.trim() || undefined,
        partyWisePrices: formData.partyWisePrices
          .filter((p) => p.price && Number(p.price) > 0)
          .map((p) => ({ partyType: p.partyType, price: Number(p.price) })),
      };

      const result = await createMutation.mutateAsync(payload);
      const createdItem = result?.item || result;

      if (onSuccess) onSuccess(createdItem);
      if (itemModalCallback) itemModalCallback(createdItem);

      if (saveAndNew) {
        setFormData(INITIAL_FORM);
        setActiveTab("basic");
        setSavedToast(true);
        setTimeout(() => setSavedToast(false), 2500);
      } else {
        handleClose();
      }
    } catch (err) {
      setErrorMsg(err?.response?.data?.message || err.message || "Failed to create item");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="item-modal-backdrop" onClick={handleClose}>
      <div className="item-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="item-modal-header">
          <h2 className="item-modal-title">
            <span>Create New Item</span>
            {savedToast && (
              <span style={{ fontSize: "0.82rem", color: "#16a34a", fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
                <FiCheck /> Item saved! Ready for next.
              </span>
            )}
          </h2>
          <button
            type="button"
            className="item-modal-close-btn"
            onClick={handleClose}
            aria-label="Close"
          >
            <FiX />
          </button>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div style={{ background: "#fef2f2", color: "#b91c1c", padding: "8px 24px", fontSize: "0.85rem", fontWeight: 600, borderBottom: "1px solid #fecaca" }}>
            ⚠️ {errorMsg}
          </div>
        )}

        {/* Body */}
        <div className="item-modal-body">
          {/* Left Tabs Sidebar */}
          <div className="item-tabs-sidebar">
            <button
              type="button"
              className={`item-tab-btn ${activeTab === "basic" ? "active" : ""}`}
              onClick={() => setActiveTab("basic")}
            >
              <FiBox className="item-tab-btn__icon" />
              <span>Basic Details</span>
              <span className="item-tab-btn__req">*</span>
            </button>

            <div className="item-tab-group-title">Advance Details</div>

            <button
              type="button"
              className={`item-tab-btn ${activeTab === "stock" ? "active" : ""}`}
              onClick={() => setActiveTab("stock")}
            >
              <FiLayers className="item-tab-btn__icon" />
              <span>Stock Details</span>
            </button>

            <button
              type="button"
              className={`item-tab-btn ${activeTab === "pricing" ? "active" : ""}`}
              onClick={() => setActiveTab("pricing")}
            >
              <FiTag className="item-tab-btn__icon" />
              <span>Pricing Details</span>
            </button>

            <button
              type="button"
              className={`item-tab-btn ${activeTab === "partyPrices" ? "active" : ""}`}
              onClick={() => setActiveTab("partyPrices")}
            >
              <FiDollarSign className="item-tab-btn__icon" />
              <span>Party Wise Prices</span>
            </button>

            <button
              type="button"
              className={`item-tab-btn ${activeTab === "custom" ? "active" : ""}`}
              onClick={() => setActiveTab("custom")}
            >
              <FiSliders className="item-tab-btn__icon" />
              <span>Custom Fields</span>
            </button>
          </div>

          {/* Right Form Content */}
          <div className="item-content-area">
            {/* TAB 1: BASIC DETAILS */}
            {activeTab === "basic" && (
              <>
                <div className="item-form-row-2">
                  <div className="item-form-group">
                    <label className="item-form-label">
                      <span>Item Type</span>
                      <span className="item-form-label-req">*</span>
                    </label>
                    <div className="party-radio-pill-group">
                      <label className="party-radio-label">
                        <input
                          type="radio"
                          name="itemType"
                          value="product"
                          checked={formData.itemType === "product"}
                          onChange={handleChange}
                        />
                        <span>Product</span>
                      </label>
                      <label className="party-radio-label">
                        <input
                          type="radio"
                          name="itemType"
                          value="service"
                          checked={formData.itemType === "service"}
                          onChange={handleChange}
                        />
                        <span>Service</span>
                      </label>
                    </div>
                  </div>

                  <div className="item-form-group">
                    <label className="item-form-label">Category</label>
                    <select
                      className="item-select"
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                    >
                      <option value="">Search / Select Category</option>
                      {categories.map((c) => (
                        <option key={c._id} value={c._id}>
                          {c.name}
                        </option>
                      ))}
                      {categories.length === 0 && (
                        <>
                          <option value="Refrigerators">Refrigerators</option>
                          <option value="Washing Machines">Washing Machines</option>
                          <option value="Air Conditioners">Air Conditioners</option>
                          <option value="Televisions">Televisions</option>
                          <option value="Microwave & Ovens">Microwave & Ovens</option>
                        </>
                      )}
                    </select>
                  </div>
                </div>

                <div className="item-form-row-2">
                  <div className="item-form-group">
                    <label className="item-form-label">
                      <span>Item Name</span>
                      <span className="item-form-label-req">*</span>
                    </label>
                    <input
                      type="text"
                      className="item-input"
                      name="name"
                      placeholder="ex: Maggie 20gm or LG 260L Frost Free Refrigerator"
                      value={formData.name}
                      onChange={handleChange}
                      autoFocus
                    />
                  </div>

                  <div className="item-form-group" style={{ justifyContent: "center" }}>
                    <div className="item-toggle-wrap">
                      <span className="item-toggle-label">Show Item in Online Store</span>
                      <label className="item-switch">
                        <input
                          type="checkbox"
                          name="showOnline"
                          checked={formData.showOnline}
                          onChange={handleChange}
                        />
                        <span className="item-slider" />
                      </label>
                    </div>
                  </div>
                </div>

                <div className="item-form-row-2">
                  <div className="item-form-group">
                    <label className="item-form-label">Sales Price</label>
                    <div className="item-price-wrap">
                      <span className="item-price-prefix">₹</span>
                      <input
                        type="number"
                        className="item-price-input"
                        name="salesPrice"
                        placeholder="ex: 200"
                        value={formData.salesPrice}
                        onChange={handleChange}
                        min="0"
                      />
                      <select
                        className="item-price-select"
                        name="taxInclusive"
                        value={formData.taxInclusive ? "with_tax" : "without_tax"}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            taxInclusive: e.target.value === "with_tax",
                          }))
                        }
                      >
                        <option value="with_tax">With Tax</option>
                        <option value="without_tax">Without Tax</option>
                      </select>
                    </div>
                  </div>

                  <div className="item-form-group">
                    <label className="item-form-label">GST Tax Rate(%)</label>
                    <select
                      className="item-select"
                      name="gst"
                      value={formData.gst}
                      onChange={handleChange}
                    >
                      {GST_RATES.map((g) => (
                        <option key={g.value} value={g.value}>
                          {g.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="item-form-row-2">
                  <div className="item-form-group">
                    <label className="item-form-label">
                      <span>HSN / SAC Code</span>
                    </label>
                    <input
                      type="text"
                      className="item-input"
                      name="hsn"
                      placeholder="ex: 8418 (shown on the invoice)"
                      value={formData.hsn}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="item-form-group">
                    <label className="item-form-label">Measuring Unit</label>
                    <select
                      className="item-select"
                      name="unit"
                      value={formData.unit}
                      onChange={handleChange}
                    >
                      {UNITS.map((u) => (
                        <option key={u.value} value={u.value}>
                          {u.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="item-form-group">
                    <label className="item-form-label">Opening Stock</label>
                    <div className="item-price-wrap">
                      <input
                        type="number"
                        className="item-price-input"
                        name="openingStock"
                        placeholder="ex: 150 PCS"
                        value={formData.openingStock}
                        onChange={handleChange}
                        min="0"
                      />
                      <span className="item-price-prefix">{formData.unit}</span>
                    </div>
                  </div>
                </div>

                <div className="item-toggle-wrap" style={{ marginTop: 4 }}>
                  <span className="item-toggle-label">Enable Serialisation / IMEI Tracking</span>
                  <label className="item-switch">
                    <input
                      type="checkbox"
                      name="serialTracking"
                      checked={formData.serialTracking}
                      onChange={handleChange}
                    />
                    <span className="item-slider" />
                  </label>
                </div>
              </>
            )}

            {/* TAB 2: STOCK DETAILS */}
            {activeTab === "stock" && (
              <>
                <div className="item-form-row-2">
                  <div className="item-form-group">
                    <label className="item-form-label">Item Code / Barcode</label>
                    <div className="item-barcode-wrap">
                      <input
                        type="text"
                        className="item-input"
                        name="sku"
                        placeholder="ex: ITM12549"
                        value={formData.sku}
                        onChange={handleChange}
                      />
                      <button
                        type="button"
                        className="item-btn-barcode"
                        onClick={generateBarcode}
                        title="Auto-generate Barcode"
                      >
                        <FiRefreshCw style={{ marginRight: 4 }} />
                        Generate Barcode
                      </button>
                    </div>
                  </div>

                </div>

                <div className="item-form-row-3">
                  <div className="item-form-group">
                    <label className="item-form-label">Godowns / Showroom</label>
                    <select
                      className="item-select"
                      name="godown"
                      value={formData.godown}
                      onChange={handleChange}
                    >
                      <option value="">Select Godown / Showroom</option>
                      {showrooms.map((s) => (
                        <option key={s._id} value={s._id}>
                          {s.name} ({s.code})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="item-form-group">
                    <label className="item-form-label">Opening Stock</label>
                    <input
                      type="number"
                      className="item-input"
                      name="openingStock"
                      placeholder="ex: 150 PCS"
                      value={formData.openingStock}
                      onChange={handleChange}
                      min="0"
                    />
                  </div>

                  <div className="item-form-group">
                    <label className="item-form-label">As of Date</label>
                    <input
                      type="date"
                      className="item-input"
                      name="asOfDate"
                      value={formData.asOfDate}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="item-form-row-2">
                  <div className="item-form-group">
                    <label className="item-form-label">Low Stock Quantity Warning</label>
                    <input
                      type="number"
                      className="item-input"
                      name="lowStockAlert"
                      placeholder="e.g. 5"
                      value={formData.lowStockAlert}
                      onChange={handleChange}
                      min="0"
                    />
                  </div>

                  <div className="item-form-group">
                    <label className="item-form-label">Measuring Unit</label>
                    <select
                      className="item-select"
                      name="unit"
                      value={formData.unit}
                      onChange={handleChange}
                    >
                      {UNITS.map((u) => (
                        <option key={u.value} value={u.value}>
                          {u.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="item-form-group">
                  <label className="item-form-label">Item Description</label>
                  <textarea
                    rows={3}
                    className="item-textarea"
                    name="description"
                    placeholder="Enter product description, specifications, box contents..."
                    value={formData.description}
                    onChange={handleChange}
                  />
                </div>
              </>
            )}

            {/* TAB 3: PRICING DETAILS */}
            {activeTab === "pricing" && (
              <>
                <div className="item-form-row-2">
                  <div className="item-form-group">
                    <label className="item-form-label">Sales Price</label>
                    <div className="item-price-wrap">
                      <span className="item-price-prefix">₹</span>
                      <input
                        type="number"
                        className="item-price-input"
                        name="salesPrice"
                        placeholder="ex: 200"
                        value={formData.salesPrice}
                        onChange={handleChange}
                        min="0"
                      />
                      <select
                        className="item-price-select"
                        name="taxInclusive"
                        value={formData.taxInclusive ? "with_tax" : "without_tax"}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            taxInclusive: e.target.value === "with_tax",
                          }))
                        }
                      >
                        <option value="with_tax">With Tax</option>
                        <option value="without_tax">Without Tax</option>
                      </select>
                    </div>
                  </div>

                  <div className="item-form-group">
                    <label className="item-form-label">Purchase Price</label>
                    <div className="item-price-wrap">
                      <span className="item-price-prefix">₹</span>
                      <input
                        type="number"
                        className="item-price-input"
                        name="purchasePrice"
                        placeholder="ex: 150"
                        value={formData.purchasePrice}
                        onChange={handleChange}
                        min="0"
                      />
                      <select className="item-price-select" disabled>
                        <option>With Tax</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="item-form-row-2">
                  <div className="item-form-group">
                    <label className="item-form-label">GST Tax Rate(%)</label>
                    <select
                      className="item-select"
                      name="gst"
                      value={formData.gst}
                      onChange={handleChange}
                    >
                      {GST_RATES.map((g) => (
                        <option key={g.value} value={g.value}>
                          {g.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="item-form-group">
                    <label className="item-form-label">Discount on Sales Price (%)</label>
                    <input
                      type="number"
                      className="item-input"
                      name="discount"
                      placeholder="ex: 12"
                      value={formData.discount}
                      onChange={handleChange}
                      min="0"
                      max="100"
                    />
                  </div>
                </div>

                <div className="item-form-row-2">
                  <div className="item-form-group">
                    <label className="item-form-label">Wholesale Price (₹)</label>
                    <input
                      type="number"
                      className="item-input"
                      name="wholesalePrice"
                      placeholder="ex: 180"
                      value={formData.wholesalePrice}
                      onChange={handleChange}
                      min="0"
                    />
                  </div>

                  <div className="item-form-group">
                    <label className="item-form-label">Minimum Selling Price Floor (₹)</label>
                    <input
                      type="number"
                      className="item-input"
                      name="minSellingPrice"
                      placeholder="ex: 170"
                      value={formData.minSellingPrice}
                      onChange={handleChange}
                      min="0"
                    />
                  </div>
                </div>
              </>
            )}

            {/* TAB 4: PARTY WISE PRICES */}
            {activeTab === "partyPrices" && (
              <>
                <div style={{ fontSize: "0.86rem", color: "#6b6352", marginBottom: 8 }}>
                  Set custom pricing tiers for different party types:
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {formData.partyWisePrices.map((item, idx) => (
                    <div key={item.partyType} className="item-form-row-2" style={{ alignItems: "center" }}>
                      <div style={{ fontWeight: 700, color: "#1c1b17", fontSize: "0.9rem" }}>
                        {item.partyType} Price
                      </div>
                      <div className="item-price-wrap">
                        <span className="item-price-prefix">₹</span>
                        <input
                          type="number"
                          className="item-price-input"
                          placeholder="Custom Price"
                          value={item.price}
                          onChange={(e) => handlePartyPriceChange(idx, e.target.value)}
                          min="0"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* TAB 5: CUSTOM FIELDS */}
            {activeTab === "custom" && (
              <>
                <div className="item-form-row-2">
                  <div className="item-form-group">
                    <label className="item-form-label">Brand</label>
                    <select
                      className="item-select"
                      name="brand"
                      value={formData.brand}
                      onChange={handleChange}
                    >
                      <option value="">Select Brand</option>
                      {brands.map((b) => (
                        <option key={b._id} value={b._id}>
                          {b.name}
                        </option>
                      ))}
                      {brands.length === 0 && (
                        <>
                          <option value="LG">LG</option>
                          <option value="Samsung">Samsung</option>
                          <option value="Sony">Sony</option>
                          <option value="Whirlpool">Whirlpool</option>
                          <option value="Bosch">Bosch</option>
                        </>
                      )}
                    </select>
                  </div>

                  <div className="item-form-group">
                    <label className="item-form-label">Model Number</label>
                    <input
                      type="text"
                      className="item-input"
                      name="model"
                      placeholder="e.g. GL-T292RDSN"
                      value={formData.model}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="item-form-row-2">
                  <div className="item-form-group">
                    <label className="item-form-label">Color / Finish</label>
                    <input
                      type="text"
                      className="item-input"
                      name="color"
                      placeholder="e.g. Shiny Steel / Scarlet Dazzle"
                      value={formData.color}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="item-form-group">
                    <label className="item-form-label">Warranty Period</label>
                    <input
                      type="text"
                      className="item-input"
                      name="warranty"
                      placeholder="e.g. 1 Year Comprehensive + 10 Year Compressor"
                      value={formData.warranty}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="item-modal-footer">
          <button type="button" className="item-btn-cancel" onClick={handleClose}>
            Cancel
          </button>

          <div className="item-footer-right">
            <button
              type="button"
              className="item-btn-save-new"
              onClick={() => handleSave(true)}
              disabled={createMutation.isPending}
            >
              Save & New
            </button>
            <button
              type="button"
              className="item-btn-primary"
              onClick={() => handleSave(false)}
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? "Saving..." : "Save Item"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CreateItemModal;
