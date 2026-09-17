// Create Quotation / Estimate. myBillBook-style full form with an Edit / Preview
// toggle. Preview reuses the shared TaxInvoice component (labelled QUOTATION) so it
// looks 1:1 with the printed document and is dynamic from company settings.
import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiArrowLeft,
  FiEdit3,
  FiEye,
  FiPlus,
  FiTrash2,
  FiUserPlus,
  FiSettings,
} from "react-icons/fi";
import { useCustomers } from "../../customers/hooks/useCustomers";
import { useProducts } from "../../products/hooks/useProducts";
import { useShowrooms } from "../../showrooms/hooks/useShowrooms";
import { useCreateQuotation } from "../hooks/useQuotations";
import { useUI } from "../../../app/store/uiStore";
import { useCompany } from "../../../app/store/companyStore";
import { Spinner } from "../../../components";
import TaxInvoice from "../../orders/components/TaxInvoice";
import "../../orders/pages/SalesInvoiceCreate.css";

const inr = (n) => `₹${(Number(n) || 0).toLocaleString("en-IN")}`;
const GST_RATES = [0, 5, 12, 18, 28];

function emptyLine() {
  return {
    product: "",
    name: "",
    sku: "",
    hsn: "",
    quantity: 1,
    unit: "PCS",
    price: 0,
    discount: 0,
    gst: 0,
  };
}

export function QuotationCreatePage() {
  const navigate = useNavigate();
  const { openPartyModal } = useUI();
  const { company } = useCompany();

  const { data: customers = [], isLoading: cLoading } = useCustomers();
  const { data: products = [], isLoading: pLoading } = useProducts();
  const { data: showrooms = [] } = useShowrooms({ type: "showroom" });
  const createQuotation = useCreateQuotation();

  const [viewMode, setViewMode] = useState("edit"); // 'edit' | 'preview'

  // Bill To
  const [customerId, setCustomerId] = useState("");
  const selectedParty = useMemo(
    () => customers.find((c) => c._id === customerId) || null,
    [customers, customerId]
  );

  // Quotation meta
  const [quotationNo] = useState(`QT-${Math.floor(100 + Math.random() * 900)}`);
  const [quotationDate, setQuotationDate] = useState(new Date().toISOString().split("T")[0]);
  const [showroom, setShowroom] = useState("");

  // Line items
  const [lines, setLines] = useState([emptyLine()]);

  // Notes & Terms
  const [notes, setNotes] = useState("");
  const [terms, setTerms] = useState(
    "1. Goods once sold will not be taken back or exchanged.\n2. This quotation is valid for 15 days from the date of issue."
  );

  const [error, setError] = useState("");

  function updateLine(i, patch) {
    setLines((prev) => prev.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  }

  function onPickProduct(i, productId) {
    const p = products.find((x) => x._id === productId);
    updateLine(i, {
      product: productId,
      name: p?.name || "",
      sku: p?.sku || "",
      hsn: p?.hsn || "",
      unit: p?.unit || "PCS",
      price: p?.sellingPrice || p?.mrp || 0,
      discount: p?.discount || 0,
      gst: p?.gst || 0,
    });
  }

  function removeLine(i) {
    setLines((prev) => prev.filter((_, idx) => idx !== i));
  }

  // Live totals (mirrors the backend formula: GST is added on top of the taxable).
  const totals = useMemo(() => {
    let subtotal = 0;
    let discount = 0;
    let tax = 0;
    let qty = 0;
    lines.forEach((l) => {
      const base = (Number(l.price) || 0) * (Number(l.quantity) || 0);
      const disc = Number(l.discount) || 0;
      const taxable = Math.max(base - disc, 0);
      subtotal += base;
      discount += disc;
      tax += (taxable * (Number(l.gst) || 0)) / 100;
      qty += Number(l.quantity) || 0;
    });
    const grandTotal = Math.max(subtotal - discount, 0) + tax;
    return { subtotal, discount, tax, qty, grandTotal };
  }, [lines]);

  // Order-shaped object for the shared TaxInvoice preview.
  const previewOrder = useMemo(
    () => ({
      number: quotationNo,
      createdAt: quotationDate ? new Date(quotationDate).toISOString() : new Date().toISOString(),
      grandTotal: totals.grandTotal,
      amountPaid: 0,
      showroom: showrooms.find((s) => s._id === showroom) || undefined,
      customer: selectedParty
        ? {
            name: selectedParty.name,
            mobile: selectedParty.mobile,
            gstin: selectedParty.gstin,
            pan: selectedParty.pan,
            address: selectedParty.address,
            city: selectedParty.city,
            state: selectedParty.state,
            pincode: selectedParty.pincode,
            shippingAddress: selectedParty.shippingAddress,
          }
        : { name: "Customer" },
      items: lines
        .filter((l) => l.product || (l.name && l.name.trim()))
        .map((l) => ({
          name: l.name,
          quantity: Number(l.quantity) || 1,
          price: Number(l.price) || 0,
          discount: Number(l.discount) || 0,
          gst: Number(l.gst) || 0,
          product: { hsn: l.hsn || "-", unit: l.unit || "PCS" },
        })),
    }),
    [quotationNo, quotationDate, totals.grandTotal, showrooms, showroom, selectedParty, lines]
  );

  async function handleSave() {
    setError("");
    if (!customerId) {
      setError("Please select a party / customer.");
      setViewMode("edit");
      return;
    }
    const validLines = lines.filter((l) => l.product || (l.name && l.name.trim()));
    if (validLines.length === 0) {
      setError("Please add at least one line item.");
      setViewMode("edit");
      return;
    }
    try {
      await createQuotation.mutateAsync({
        customer: customerId,
        showroom: showroom || undefined,
        items: validLines.map((l) => ({
          product: l.product || undefined,
          name: l.name,
          quantity: Number(l.quantity) || 1,
          price: Number(l.price) || 0,
          discount: Number(l.discount) || 0,
          gst: Number(l.gst) || 0,
        })),
      });
      navigate("/quotations");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create quotation.");
    }
  }

  if (cLoading || pLoading) return <Spinner />;

  return (
    <div className="invoice-create-container">
      {/* Top bar */}
      <div className="invoice-top-bar">
        <div className="invoice-top-left">
          <button type="button" className="invoice-btn-exit" onClick={() => navigate("/quotations")}>
            <FiArrowLeft />
            <span>Exit</span>
          </button>
          <h1 className="invoice-title">Create Quotation / Estimate</h1>
        </div>

        <div className="invoice-mode-toggle">
          <button
            type="button"
            className={`invoice-mode-btn ${viewMode === "edit" ? "active" : ""}`}
            onClick={() => setViewMode("edit")}
          >
            <FiEdit3 />
            <span>Edit Mode</span>
          </button>
          <button
            type="button"
            className={`invoice-mode-btn ${viewMode === "preview" ? "active" : ""}`}
            onClick={() => setViewMode("preview")}
          >
            <FiEye />
            <span>Preview Mode</span>
          </button>
        </div>

        <div className="invoice-top-right">
          <button
            type="button"
            className="invoice-btn-save-primary"
            onClick={handleSave}
            disabled={createQuotation.isPending}
          >
            {createQuotation.isPending ? "Saving..." : "Save Quotation"}
          </button>
        </div>
      </div>

      <main className="invoice-sheet">
        {error && (
          <div style={{ background: "#fef2f2", color: "#b91c1c", padding: "10px 16px", borderRadius: 8, marginBottom: 12, fontWeight: 600 }}>
            {error}
          </div>
        )}

        {viewMode === "edit" ? (
          <>
            {/* Bill To + Meta */}
            <div className="invoice-meta-grid">
              <div className="invoice-bill-to-box">
                <div className="invoice-box-label">Bill To</div>
                {selectedParty ? (
                  <div className="invoice-party-selected-card">
                    <div className="invoice-party-info-name">{selectedParty.name}</div>
                    <div className="invoice-party-info-sub">
                      {selectedParty.mobile || "—"} | GSTIN: {selectedParty.gstin || "Unregistered"}
                    </div>
                    <button
                      type="button"
                      className="invoice-expandable-btn"
                      style={{ marginTop: 6 }}
                      onClick={() => setCustomerId("")}
                    >
                      Change Party
                    </button>
                  </div>
                ) : (
                  <>
                    <select
                      className="invoice-meta-select"
                      value={customerId}
                      onChange={(e) => setCustomerId(e.target.value)}
                      style={{ marginBottom: 10 }}
                    >
                      <option value="">Select a party / customer</option>
                      {customers.map((c) => (
                        <option key={c._id} value={c._id}>
                          {c.name} ({c.mobile})
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      className="invoice-party-dashed-btn"
                      onClick={() => openPartyModal && openPartyModal()}
                    >
                      <FiUserPlus />
                      <span>+ Add Party</span>
                    </button>
                  </>
                )}
              </div>

              <div className="invoice-details-box">
                <div className="invoice-details-header">
                  <FiSettings />
                  <span style={{ fontWeight: 700 }}>Quotation Details</span>
                </div>
                <div className="invoice-details-grid">
                  <div className="invoice-meta-field">
                    <label className="invoice-meta-label">Quotation No.</label>
                    <input className="invoice-meta-input" value={quotationNo} readOnly />
                  </div>
                  <div className="invoice-meta-field">
                    <label className="invoice-meta-label">Quotation Date</label>
                    <input
                      type="date"
                      className="invoice-meta-input"
                      value={quotationDate}
                      onChange={(e) => setQuotationDate(e.target.value)}
                    />
                  </div>
                  <div className="invoice-meta-field" style={{ gridColumn: "1 / -1" }}>
                    <label className="invoice-meta-label">Showroom / Branch</label>
                    <select
                      className="invoice-meta-select"
                      value={showroom}
                      onChange={(e) => setShowroom(e.target.value)}
                    >
                      <option value="">Select showroom</option>
                      {showrooms.map((s) => (
                        <option key={s._id} value={s._id}>
                          {s.name}{s.code ? ` (${s.code})` : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Items table */}
            <div className="invoice-table-wrap">
              <table className="invoice-table">
                <thead>
                  <tr>
                    <th style={{ width: 40 }}>#</th>
                    <th>Items</th>
                    <th style={{ width: 90 }}>HSN</th>
                    <th style={{ width: 80 }}>Qty</th>
                    <th style={{ width: 110 }}>Price/Item (₹)</th>
                    <th style={{ width: 100 }}>Discount</th>
                    <th style={{ width: 90 }}>GST %</th>
                    <th style={{ width: 120, textAlign: "right" }}>Amount (₹)</th>
                    <th style={{ width: 40 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {lines.map((l, i) => {
                    const base = (Number(l.price) || 0) * (Number(l.quantity) || 0);
                    const taxable = Math.max(base - (Number(l.discount) || 0), 0);
                    const lineTax = (taxable * (Number(l.gst) || 0)) / 100;
                    const amount = taxable + lineTax;
                    return (
                      <tr key={i}>
                        <td>{i + 1}</td>
                        <td>
                          <select
                            className="invoice-item-input"
                            value={l.product}
                            onChange={(e) => onPickProduct(i, e.target.value)}
                          >
                            <option value="">Select product</option>
                            {products.map((p) => (
                              <option key={p._id} value={p._id}>{p.name}</option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <input
                            className="invoice-item-input"
                            value={l.hsn}
                            onChange={(e) => updateLine(i, { hsn: e.target.value })}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            min="1"
                            className="invoice-item-input"
                            value={l.quantity}
                            onChange={(e) => updateLine(i, { quantity: e.target.value })}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            min="0"
                            className="invoice-item-input"
                            value={l.price}
                            onChange={(e) => updateLine(i, { price: e.target.value })}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            min="0"
                            className="invoice-item-input"
                            value={l.discount}
                            onChange={(e) => updateLine(i, { discount: e.target.value })}
                          />
                        </td>
                        <td>
                          <select
                            className="invoice-item-input"
                            value={l.gst}
                            onChange={(e) => updateLine(i, { gst: e.target.value })}
                          >
                            {GST_RATES.map((g) => (
                              <option key={g} value={g}>{g}%</option>
                            ))}
                          </select>
                        </td>
                        <td style={{ textAlign: "right", fontWeight: 700 }}>{inr(amount)}</td>
                        <td>
                          {lines.length > 1 && (
                            <button type="button" className="invoice-btn-add-item" onClick={() => removeLine(i)} title="Remove">
                              <FiTrash2 />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  <tr className="invoice-table-subtotal-row">
                    <td colSpan={3}>Subtotal</td>
                    <td>{totals.qty}</td>
                    <td></td>
                    <td>{inr(totals.discount)}</td>
                    <td></td>
                    <td style={{ textAlign: "right" }}>{inr(totals.grandTotal)}</td>
                    <td></td>
                  </tr>
                </tbody>
              </table>

              <div className="invoice-add-item-row">
                <button type="button" className="invoice-btn-add-item" onClick={() => setLines([...lines, emptyLine()])}>
                  <FiPlus />
                  <span>+ Add Item</span>
                </button>
              </div>
            </div>

            {/* Bottom: Notes/Terms + Totals */}
            <div className="invoice-bottom-grid">
              <div className="invoice-bottom-left">
                <div className="invoice-meta-field">
                  <label className="invoice-meta-label">Add Notes</label>
                  <textarea
                    rows={2}
                    className="invoice-meta-input"
                    placeholder="Notes visible to the customer..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
                <div className="invoice-meta-field">
                  <label className="invoice-meta-label">Terms &amp; Conditions</label>
                  <textarea
                    rows={3}
                    className="invoice-meta-input"
                    value={terms}
                    onChange={(e) => setTerms(e.target.value)}
                  />
                </div>
              </div>

              <div className="invoice-financials-card">
                <div className="invoice-calc-row">
                  <span>Taxable Amount</span>
                  <strong>{inr(Math.max(totals.subtotal - totals.discount, 0))}</strong>
                </div>
                <div className="invoice-calc-row">
                  <span>Total Discount</span>
                  <strong>- {inr(totals.discount)}</strong>
                </div>
                <div className="invoice-calc-row">
                  <span>Total GST Tax</span>
                  <strong>{inr(totals.tax)}</strong>
                </div>
                <div className="invoice-calc-row invoice-calc-grand-total">
                  <span>Total Amount</span>
                  <span>{inr(totals.grandTotal)}</span>
                </div>
              </div>
            </div>
          </>
        ) : (
          /* PREVIEW — reuses the shared TaxInvoice, dynamic from company settings. */
          <div className="inv-view__sheet" style={{ padding: 24, background: "#fff", border: "1px solid #e5dcc4", borderRadius: 10, maxWidth: 820, margin: "0 auto" }}>
            <TaxInvoice o={previewOrder} company={company} balance={totals.grandTotal} docTitle="QUOTATION" />
          </div>
        )}
      </main>
    </div>
  );
}

export default QuotationCreatePage;
