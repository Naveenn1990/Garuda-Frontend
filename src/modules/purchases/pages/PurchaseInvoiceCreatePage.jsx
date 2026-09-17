// Create Purchase Invoice — myBillBook-style. Select a supplier (Bill From), the
// warehouse the stock is received into, add line items, and save. On save the backend
// brings the purchased quantities INTO that warehouse's inventory.
import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiArrowLeft,
  FiPlus,
  FiTrash2,
  FiUserPlus,
  FiSettings,
} from "react-icons/fi";
import { useCustomers } from "../../customers/hooks/useCustomers";
import { useProducts } from "../../products/hooks/useProducts";
import { useShowrooms } from "../../showrooms/hooks/useShowrooms";
import { useCreatePurchase } from "../hooks/usePurchases";
import { useUI } from "../../../app/store/uiStore";
import { Spinner } from "../../../components";
import "../../orders/pages/SalesInvoiceCreate.css";

const inr = (n) => `₹${(Number(n) || 0).toLocaleString("en-IN")}`;
const GST_RATES = [0, 5, 12, 18, 28];

function emptyLine() {
  return { product: "", name: "", sku: "", hsn: "", quantity: 1, unit: "PCS", price: 0, discount: 0, gst: 0 };
}

export default function PurchaseInvoiceCreatePage() {
  const navigate = useNavigate();
  const { openPartyModal } = useUI();

  const { data: customers = [], isLoading: cLoading } = useCustomers();
  const { data: products = [], isLoading: pLoading } = useProducts();
  // Warehouses are showrooms of type "warehouse" — purchased stock lands here.
  const { data: warehouses = [] } = useShowrooms({ type: "warehouse" });
  const createPurchase = useCreatePurchase();

  // Prefer suppliers, but fall back to all parties if none are tagged as suppliers.
  const suppliers = useMemo(() => {
    const s = customers.filter((c) => c.partyType === "supplier");
    return s.length ? s : customers;
  }, [customers]);

  const [supplierId, setSupplierId] = useState("");
  const [warehouseId, setWarehouseId] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split("T")[0]);
  const [originalInvoiceNo, setOriginalInvoiceNo] = useState("");
  const [ewayBill, setEwayBill] = useState("");
  const [vehicleNo, setVehicleNo] = useState("");
  const [lines, setLines] = useState([emptyLine()]);
  const [notes, setNotes] = useState("");
  const [terms, setTerms] = useState("");
  const [amountPaid, setAmountPaid] = useState("");
  const [markFullyPaid, setMarkFullyPaid] = useState(false);
  const [error, setError] = useState("");

  const selectedSupplier = useMemo(
    () => suppliers.find((c) => c._id === supplierId) || null,
    [suppliers, supplierId]
  );

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
      // Default to the product's purchase price for a purchase invoice.
      price: p?.purchasePrice || p?.sellingPrice || 0,
      gst: p?.gst || 0,
    });
  }

  const totals = useMemo(() => {
    let subtotal = 0;
    let discount = 0;
    let tax = 0;
    let qty = 0;
    lines.forEach((l) => {
      const base = (Number(l.price) || 0) * (Number(l.quantity) || 0);
      const disc = Number(l.discount) || 0;
      const net = Math.max(base - disc, 0);
      const rate = Number(l.gst) || 0;
      const taxable = rate > 0 ? net / (1 + rate / 100) : net;
      subtotal += base;
      discount += disc;
      tax += net - taxable;
      qty += Number(l.quantity) || 0;
    });
    const grandTotal = Math.max(subtotal - discount, 0);
    return {
      subtotal,
      discount,
      tax: Math.round(tax * 100) / 100,
      qty,
      grandTotal: Math.round(grandTotal * 100) / 100,
    };
  }, [lines]);

  const paid = markFullyPaid ? totals.grandTotal : Number(amountPaid) || 0;
  const balance = Math.max(totals.grandTotal - paid, 0);

  async function handleSave() {
    setError("");
    if (!supplierId) return setError("Please select a supplier (Bill From).");
    if (!warehouseId) return setError("Please select the warehouse to receive stock into.");
    const validLines = lines.filter((l) => l.product || (l.name && l.name.trim()));
    if (validLines.length === 0) return setError("Add at least one line item.");

    try {
      await createPurchase.mutateAsync({
        supplier: supplierId,
        warehouse: warehouseId,
        invoiceDate,
        originalInvoiceNo: originalInvoiceNo || undefined,
        ewayBill: ewayBill || undefined,
        vehicleNo: vehicleNo || undefined,
        notes: notes || undefined,
        terms: terms || undefined,
        amountPaid: paid,
        items: validLines.map((l) => ({
          product: l.product || undefined,
          name: l.name,
          hsn: l.hsn || undefined,
          unit: l.unit || "PCS",
          quantity: Number(l.quantity) || 1,
          price: Number(l.price) || 0,
          discount: Number(l.discount) || 0,
          gst: Number(l.gst) || 0,
        })),
      });
      navigate("/purchases");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create purchase invoice.");
    }
  }

  if (cLoading || pLoading) return <Spinner />;

  return (
    <div className="invoice-create-container">
      <div className="invoice-top-bar">
        <div className="invoice-top-left">
          <button type="button" className="invoice-btn-exit" onClick={() => navigate("/purchases")}>
            <FiArrowLeft />
            <span>Exit</span>
          </button>
          <h1 className="invoice-title">Create Purchase Invoice</h1>
        </div>
        <div className="invoice-top-right">
          <button type="button" className="invoice-btn-save-new" onClick={() => navigate("/purchases")}>
            Cancel
          </button>
          <button
            type="button"
            className="invoice-btn-save-primary"
            onClick={handleSave}
            disabled={createPurchase.isPending}
          >
            {createPurchase.isPending ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      <main className="invoice-sheet">
        {error && (
          <div style={{ background: "#fef2f2", color: "#b91c1c", padding: "10px 16px", borderRadius: 8, marginBottom: 12, fontWeight: 600 }}>
            {error}
          </div>
        )}

        {/* Bill From + Invoice Details */}
        <div className="invoice-meta-grid">
          <div className="invoice-bill-to-box">
            <div className="invoice-box-label">Bill From (Supplier)</div>
            {selectedSupplier ? (
              <div className="invoice-party-selected-card">
                <div className="invoice-party-info-name">{selectedSupplier.name}</div>
                <div className="invoice-party-info-sub">
                  {selectedSupplier.mobile || "—"} | GSTIN: {selectedSupplier.gstin || "Unregistered"}
                </div>
                <button type="button" className="invoice-expandable-btn" style={{ marginTop: 6 }} onClick={() => setSupplierId("")}>
                  Change Supplier
                </button>
              </div>
            ) : (
              <>
                <select
                  className="invoice-meta-select"
                  value={supplierId}
                  onChange={(e) => setSupplierId(e.target.value)}
                  style={{ marginBottom: 10 }}
                >
                  <option value="">Select a supplier</option>
                  {suppliers.map((c) => (
                    <option key={c._id} value={c._id}>{c.name} ({c.mobile})</option>
                  ))}
                </select>
                <button type="button" className="invoice-party-dashed-btn" onClick={() => openPartyModal && openPartyModal()}>
                  <FiUserPlus />
                  <span>+ Add Party</span>
                </button>
              </>
            )}
          </div>

          <div className="invoice-details-box">
            <div className="invoice-details-header">
              <FiSettings />
              <span style={{ fontWeight: 700 }}>Invoice Details</span>
            </div>
            <div className="invoice-details-grid">
              <div className="invoice-meta-field">
                <label className="invoice-meta-label">Purchase Invoice No.</label>
                <input className="invoice-meta-input" value="Auto (assigned on save)" readOnly />
              </div>
              <div className="invoice-meta-field">
                <label className="invoice-meta-label">Purchase Invoice Date</label>
                <input type="date" className="invoice-meta-input" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} />
              </div>
              <div className="invoice-meta-field">
                <label className="invoice-meta-label">Original Invoice No.</label>
                <input className="invoice-meta-input" value={originalInvoiceNo} onChange={(e) => setOriginalInvoiceNo(e.target.value)} placeholder="Supplier's bill no" />
              </div>
              <div className="invoice-meta-field">
                <label className="invoice-meta-label">Receive Into Warehouse *</label>
                <select className="invoice-meta-select" value={warehouseId} onChange={(e) => setWarehouseId(e.target.value)}>
                  <option value="">Select warehouse / godown</option>
                  {warehouses.map((w) => (
                    <option key={w._id} value={w._id}>{w.name}{w.code ? ` (${w.code})` : ""}</option>
                  ))}
                </select>
              </div>
              <div className="invoice-meta-field">
                <label className="invoice-meta-label">E-Way Bill No.</label>
                <input className="invoice-meta-input" value={ewayBill} onChange={(e) => setEwayBill(e.target.value)} />
              </div>
              <div className="invoice-meta-field">
                <label className="invoice-meta-label">Vehicle No.</label>
                <input className="invoice-meta-input" value={vehicleNo} onChange={(e) => setVehicleNo(e.target.value)} />
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
                <th style={{ width: 90 }}>Tax</th>
                <th style={{ width: 120, textAlign: "right" }}>Amount (₹)</th>
                <th style={{ width: 40 }}></th>
              </tr>
            </thead>
            <tbody>
              {lines.map((l, i) => {
                const base = (Number(l.price) || 0) * (Number(l.quantity) || 0);
                const amount = Math.max(base - (Number(l.discount) || 0), 0);
                return (
                  <tr key={i}>
                    <td>{i + 1}</td>
                    <td>
                      <select className="invoice-item-input" value={l.product} onChange={(e) => onPickProduct(i, e.target.value)}>
                        <option value="">Select product</option>
                        {products.map((p) => (
                          <option key={p._id} value={p._id}>{p.name}</option>
                        ))}
                      </select>
                    </td>
                    <td><input className="invoice-item-input" value={l.hsn} onChange={(e) => updateLine(i, { hsn: e.target.value })} /></td>
                    <td><input type="number" min="0" className="invoice-item-input" value={l.quantity} onChange={(e) => updateLine(i, { quantity: e.target.value })} /></td>
                    <td><input type="number" min="0" className="invoice-item-input" value={l.price} onChange={(e) => updateLine(i, { price: e.target.value })} /></td>
                    <td><input type="number" min="0" className="invoice-item-input" value={l.discount} onChange={(e) => updateLine(i, { discount: e.target.value })} /></td>
                    <td>
                      <select className="invoice-item-input" value={l.gst} onChange={(e) => updateLine(i, { gst: e.target.value })}>
                        {GST_RATES.map((g) => <option key={g} value={g}>{g}%</option>)}
                      </select>
                    </td>
                    <td style={{ textAlign: "right", fontWeight: 700 }}>{inr(amount)}</td>
                    <td>
                      {lines.length > 1 && (
                        <button type="button" className="invoice-btn-add-item" onClick={() => setLines(lines.filter((_, idx) => idx !== i))} title="Remove">
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

        {/* Bottom: notes/terms + totals */}
        <div className="invoice-bottom-grid">
          <div className="invoice-bottom-left">
            <div className="invoice-meta-field">
              <label className="invoice-meta-label">Add Notes</label>
              <textarea rows={2} className="invoice-meta-input" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notes..." />
            </div>
            <div className="invoice-meta-field">
              <label className="invoice-meta-label">Terms &amp; Conditions</label>
              <textarea rows={3} className="invoice-meta-input" value={terms} onChange={(e) => setTerms(e.target.value)} />
            </div>
          </div>

          <div className="invoice-financials-card">
            <div className="invoice-calc-row">
              <span>Taxable Amount</span>
              <strong>{inr(Math.max(totals.subtotal - totals.discount - totals.tax, 0))}</strong>
            </div>
            <div className="invoice-calc-row">
              <span>Total GST</span>
              <strong>{inr(totals.tax)}</strong>
            </div>
            <div className="invoice-calc-row invoice-calc-grand-total">
              <span>Total Amount</span>
              <span>{inr(totals.grandTotal)}</span>
            </div>
            <div className="invoice-received-row" style={{ marginTop: 8 }}>
              <span>Amount Paid</span>
              <input
                type="number"
                min="0"
                max={totals.grandTotal}
                className="invoice-received-input"
                value={markFullyPaid ? totals.grandTotal : amountPaid}
                onChange={(e) => setAmountPaid(e.target.value)}
                disabled={markFullyPaid}
                placeholder="0"
              />
            </div>
            <label className="perm-action" style={{ marginTop: 6 }}>
              <input type="checkbox" checked={markFullyPaid} onChange={(e) => setMarkFullyPaid(e.target.checked)} />
              Mark as fully paid
            </label>
            <div className="invoice-calc-row invoice-balance-row" style={{ marginTop: 6 }}>
              <span>Balance Amount</span>
              <strong style={{ color: balance > 0 ? "#dc2626" : "#16a34a" }}>{inr(balance)}</strong>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
