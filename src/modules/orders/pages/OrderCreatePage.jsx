// Create Sales Invoice Page - myBillBook architecture with Garuda Warm Cream & Gold Theme
import { useState, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiArrowLeft,
  FiEdit3,
  FiEye,
  FiPlus,
  FiTrash2,
  FiUpload,
  FiCheck,
  FiPrinter,
  FiMaximize2,
  FiUserPlus,
  FiDollarSign,
  FiHelpCircle,
  FiPhone,
  FiMapPin,
  FiAlertTriangle,
  FiFileText,
  FiEdit,
} from "react-icons/fi";
import { useCustomers } from "../../customers/hooks/useCustomers";
import { useProducts } from "../../products/hooks/useProducts";
import { useShowrooms } from "../../showrooms/hooks/useShowrooms";
import { useUsers } from "../../users/hooks/useUsers";
import { useCreateOrder } from "../hooks/useOrders";
import { useRecordPayment } from "../../payments/hooks/usePayments";
import { useUI } from "../../../app/store/uiStore";
import { useCompany } from "../../../app/store/companyStore";
import { FiSettings, FiCamera } from "react-icons/fi";
import { numberToWords } from "../../../utils/numberToWords";
import TaxInvoice from "../components/TaxInvoice";
import "./SalesInvoiceCreate.css";

const inr = (n) => `₹${(Number(n) || 0).toLocaleString("en-IN")}`;

function formatDisplayDate(dateStr) {
  if (!dateStr) return "";
  const parts = dateStr.split("-");
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}

const GST_RATES = [0, 5, 12, 18, 28];
const PAYMENT_MODES = [
  { label: "Cash", value: "cash" },
  { label: "UPI / QR Code", value: "upi" },
  { label: "Card (Credit/Debit)", value: "card" },
  { label: "Net Banking", value: "netbanking" },
  { label: "Cheque", value: "cheque" },
];

export function OrderCreatePage() {
  const navigate = useNavigate();
  const { openPartyModal } = useUI();
  const { company, updateLogo } = useCompany();
  const fileInputRef = useRef(null);
  const sigInputRef = useRef(null);
  const logoInputRef = useRef(null);

  const { data: customers = [] } = useCustomers();
  const { data: products = [] } = useProducts();
  const { data: showrooms = [] } = useShowrooms({ type: "showroom" });
  const { data: users = [] } = useUsers();

  const createOrder = useCreateOrder();
  const recordPayment = useRecordPayment();

  // Mode: 'edit' or 'preview'
  const [viewMode, setViewMode] = useState("edit");

  // Party Selection
  const [selectedPartyId, setSelectedPartyId] = useState("");
  const selectedParty = useMemo(
    () => customers.find((c) => c._id === selectedPartyId) || null,
    [customers, selectedPartyId]
  );

  // Invoice Details
  const [invoiceNo, setInvoiceNo] = useState(`INV-${Math.floor(100 + Math.random() * 900)}`);
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split("T")[0]);
  const [showDueDate, setShowDueDate] = useState(false);
  const [dueDate, setDueDate] = useState("");
  const [ewayBill, setEwayBill] = useState("");
  const [vehicleNo, setVehicleNo] = useState("");
  const [showroom, setShowroom] = useState("");
  const [repeatInvoice, setRepeatInvoice] = useState(false);

  // Line Items
  const [items, setItems] = useState([
    {
      product: "",
      name: "",
      sku: "",
      hsn: "8418",
      quantity: 1,
      unit: "PCS",
      price: 0,
      taxInclusive: true,
      discount: 0,
      gst: 18,
    },
  ]);

  // Bottom Left: Notes, Terms, Bank & Custom UPI QR
  const [showNotes, setShowNotes] = useState(false);
  const [notes, setNotes] = useState("");
  const [showTerms, setShowTerms] = useState(false);
  const [terms, setTerms] = useState(
    "1. Goods once sold will not be taken back without original invoice.\n2. 1-year manufacturer warranty applies as per brand policy."
  );

  // Bank Details
  const [showBank, setShowBank] = useState(true);
  const [bankDetails, setBankDetails] = useState({
    accountNumber: "2652000100008401",
    ifsc: "KARB0000244",
    bankName: "Karnataka Bank, Indiranagar Branch",
    holderName: "GARUDA ELECTRONICS & RETAIL PVT LTD",
  });
  const [editBankModal, setEditBankModal] = useState(false);

  // UPI & QR Code (Supports Custom Upload + Generated QR)
  const [showUpi, setShowUpi] = useState(true);
  const [upiId, setUpiId] = useState("garuda@kbl");
  const [customQrImage, setCustomQrImage] = useState(null);

  // Bottom Right: Financials
  const [showAddlCharges, setShowAddlCharges] = useState(false);
  const [addlCharges, setAddlCharges] = useState(0);
  const [addlChargesDesc, setAddlChargesDesc] = useState("Delivery / Shipping");
  const [showOverallDiscount, setShowOverallDiscount] = useState(false);
  const [overallDiscount, setOverallDiscount] = useState(0);
  const [applyTcs, setApplyTcs] = useState(false);
  const [autoRoundOff, setAutoRoundOff] = useState(true);

  // Payment
  const [receivedAmount, setReceivedAmount] = useState("");
  const [paymentMode, setPaymentMode] = useState("cash");
  const [markFullyPaid, setMarkFullyPaid] = useState(false);

  // Signature
  const [signatureImage, setSignatureImage] = useState(null);
  const [signatoryName, setSignatoryName] = useState("For Garuda Retail");

  // Barcode / Quick SKU Entry
  const [barcodePrompt, setBarcodePrompt] = useState(false);
  const [barcodeInput, setBarcodeInput] = useState("");

  const [errorMsg, setErrorMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- Calculations ---
  const calculations = useMemo(() => {
    let rawSubtotal = 0;
    let totalItemDiscount = 0;
    let totalTax = 0;
    let totalQty = 0;

    const lineCalculations = items.map((it) => {
      const qty = Number(it.quantity) || 0;
      totalQty += qty;
      const price = Number(it.price) || 0;
      const disc = Number(it.discount) || 0;
      const gst = Number(it.gst) || 0;

      const baseAmount = price * qty;
      const discountedAmount = Math.max(baseAmount - disc, 0);

      let lineTax = 0;
      let lineTotal = discountedAmount;

      if (it.taxInclusive) {
        // Price includes tax, decompose
        lineTax = gst > 0 ? discountedAmount - discountedAmount / (1 + gst / 100) : 0;
        lineTotal = discountedAmount;
      } else {
        // Price excludes tax, compound
        lineTax = gst > 0 ? (discountedAmount * gst) / 100 : 0;
        lineTotal = discountedAmount + lineTax;
      }

      rawSubtotal += baseAmount;
      totalItemDiscount += disc;
      totalTax += lineTax;

      return {
        baseAmount,
        discountedAmount,
        lineTax,
        lineTotal: Math.round(lineTotal * 100) / 100,
      };
    });

    const subtotalAfterItemDisc = Math.max(rawSubtotal - totalItemDiscount, 0);
    const taxableAmount = subtotalAfterItemDisc;
    const extraCharges = Number(addlCharges) || 0;
    const billDiscount = Number(overallDiscount) || 0;

    let preRoundTotal = taxableAmount + totalTax + extraCharges - billDiscount;
    if (applyTcs) {
      preRoundTotal += preRoundTotal * 0.001; // 0.1% TCS
    }

    let roundOffDiff = 0;
    let finalGrandTotal = preRoundTotal;

    if (autoRoundOff) {
      finalGrandTotal = Math.round(preRoundTotal);
      roundOffDiff = Math.round((finalGrandTotal - preRoundTotal) * 100) / 100;
    }

    const rec = markFullyPaid ? finalGrandTotal : Number(receivedAmount) || 0;
    const balanceDue = Math.max(finalGrandTotal - rec, 0);

    return {
      lineCalculations,
      rawSubtotal,
      totalQty,
      totalItemDiscount,
      totalTax: Math.round(totalTax * 100) / 100,
      taxableAmount: Math.round(taxableAmount * 100) / 100,
      extraCharges,
      billDiscount,
      roundOffDiff,
      finalGrandTotal: Math.max(finalGrandTotal, 0),
      received: rec,
      balanceDue: Math.max(balanceDue, 0),
    };
  }, [
    items,
    addlCharges,
    overallDiscount,
    applyTcs,
    autoRoundOff,
    receivedAmount,
    markFullyPaid,
  ]);

  // Tax breakdown summary grouped by HSN/SAC
  const taxSummary = useMemo(() => {
    const map = {};
    items.forEach((it) => {
      const hsn = it.hsn || "84501900";
      const qty = Number(it.quantity) || 0;
      const price = Number(it.price) || 0;
      const disc = Number(it.discount) || 0;
      const gst = Number(it.gst) || 18;
      const baseAmount = price * qty - disc;

      let taxable = baseAmount;
      let tax = 0;
      if (it.taxInclusive) {
        taxable = gst > 0 ? baseAmount / (1 + gst / 100) : baseAmount;
        tax = baseAmount - taxable;
      } else {
        taxable = baseAmount;
        tax = (baseAmount * gst) / 100;
      }

      if (!map[hsn]) {
        map[hsn] = {
          hsn,
          taxableValue: 0,
          cgstRate: gst / 2,
          cgstAmount: 0,
          sgstRate: gst / 2,
          sgstAmount: 0,
          totalTax: 0,
        };
      }
      map[hsn].taxableValue += taxable;
      map[hsn].cgstAmount += tax / 2;
      map[hsn].sgstAmount += tax / 2;
      map[hsn].totalTax += tax;
    });
    return Object.values(map);
  }, [items]);

  // Sync mark fully paid
  const handleMarkFullyPaidChange = (checked) => {
    setMarkFullyPaid(checked);
    if (checked) {
      setReceivedAmount(calculations.finalGrandTotal);
    }
  };

  // Line Item actions
  const handleProductSelect = (index, productId) => {
    const prod = products.find((p) => p._id === productId);
    const updated = [...items];
    if (prod) {
      updated[index] = {
        ...updated[index],
        product: prod._id,
        name: prod.name,
        sku: prod.sku || "",
        hsn: prod.hsn || "8418",
        unit: prod.unit || "PCS",
        price: prod.sellingPrice || prod.mrp || 0,
        taxInclusive: prod.taxInclusive !== false,
        discount: prod.discount || 0,
        gst: prod.gst || 18,
      };
    }
    setItems(updated);
  };

  const handleLineChange = (index, field, value) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  };

  const addItemLine = () => {
    setItems((prev) => [
      ...prev,
      {
        product: "",
        name: "",
        sku: "",
        hsn: "8418",
        quantity: 1,
        unit: "PCS",
        price: 0,
        taxInclusive: true,
        discount: 0,
        gst: 18,
      },
    ]);
  };

  const removeItemLine = (index) => {
    if (items.length === 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Barcode / SKU quick scan handler
  const handleBarcodeScan = (e) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;
    const cleanQuery = barcodeInput.trim().toLowerCase();
    const found = products.find(
      (p) =>
        (p.sku && p.sku.toLowerCase() === cleanQuery) ||
        (p.name && p.name.toLowerCase().includes(cleanQuery))
    );

    if (found) {
      // Add or replace
      setItems((prev) => {
        const last = prev[prev.length - 1];
        if (!last.product && !last.name) {
          const clone = [...prev];
          clone[clone.length - 1] = {
            product: found._id,
            name: found.name,
            sku: found.sku || "",
            hsn: found.hsn || "8418",
            unit: found.unit || "PCS",
            price: found.sellingPrice || found.mrp || 0,
            taxInclusive: found.taxInclusive !== false,
            discount: found.discount || 0,
            gst: found.gst || 18,
            quantity: 1,
          };
          return clone;
        } else {
          return [
            ...prev,
            {
              product: found._id,
              name: found.name,
              sku: found.sku || "",
              hsn: found.hsn || "8418",
              unit: found.unit || "PCS",
              price: found.sellingPrice || found.mrp || 0,
              taxInclusive: found.taxInclusive !== false,
              discount: found.discount || 0,
              gst: found.gst || 18,
              quantity: 1,
            },
          ];
        }
      });
      setBarcodeInput("");
      setBarcodePrompt(false);
    } else {
      alert(`No product found matching Barcode / SKU "${barcodeInput}"`);
    }
  };

  // UPI QR Code Image upload handler
  const handleQrUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setCustomQrImage(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Signature image upload handler
  const handleSignatureUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setSignatureImage(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Dynamic QR generator URL if no custom image
  const dynamicQrUrl = useMemo(() => {
    if (customQrImage) return customQrImage;
    const upiUri = `upi://pay?pa=${encodeURIComponent(
      upiId
    )}&pn=GarudaRetail&am=${calculations.finalGrandTotal}&cu=INR`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
      upiUri
    )}`;
  }, [customQrImage, upiId, calculations.finalGrandTotal]);

  // The showroom object selected for this invoice (used as the fulfilling store on
  // the preview; company settings still take priority for the seller header).
  const selectedShowroom = useMemo(
    () => showrooms.find((s) => s._id === showroom) || null,
    [showrooms, showroom]
  );

  // Build an order-shaped object so the preview reuses the exact same shared
  // TaxInvoice component as the Order Detail / Invoice View pages. This keeps the
  // "Preview Mode" 1:1 with the real printed invoice, dynamic from company settings.
  const previewOrder = useMemo(
    () => ({
      number: invoiceNo,
      createdAt: invoiceDate ? new Date(invoiceDate).toISOString() : new Date().toISOString(),
      grandTotal: calculations.finalGrandTotal,
      amountPaid: calculations.received,
      showroom: selectedShowroom || undefined,
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
        : { name: "Cash Customer" },
      items: items
        .filter((it) => it.product || (it.name && it.name.trim()))
        .map((it) => ({
          name: it.name,
          quantity: Number(it.quantity) || 1,
          price: Number(it.price) || 0,
          discount: Number(it.discount) || 0,
          gst: Number(it.gst) || 0,
          // TaxInvoice reads hsn/unit off `product`, so nest them there.
          product: { hsn: it.hsn || "-", unit: it.unit || "PCS" },
        })),
    }),
    [invoiceNo, invoiceDate, calculations.finalGrandTotal, calculations.received, selectedShowroom, selectedParty, items]
  );

  // Save Sales Invoice
  const handleSaveInvoice = async (saveAndNew = false) => {
    if (!selectedPartyId && !selectedParty) {
      setErrorMsg("Please select or create a Party / Customer to bill to.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    const validLines = items.filter((it) => it.product || it.name.trim());
    if (validLines.length === 0) {
      setErrorMsg("Please add at least one line item to the invoice.");
      return;
    }

    const targetShowroom = showroom || (showrooms.length > 0 ? showrooms[0]._id : undefined);
    if (!targetShowroom) {
      setErrorMsg("Please select a showroom / branch.");
      return;
    }

    setErrorMsg("");
    setIsSubmitting(true);

    try {
      const payload = {
        number: invoiceNo,
        customer: selectedPartyId,
        showroom: targetShowroom,
        channel: "showroom",
        notes: notes.trim() || undefined,
        terms: terms.trim() || undefined,
        ewayBill: ewayBill.trim() || undefined,
        vehicleNo: vehicleNo.trim() || undefined,
        items: validLines.map((it) => ({
          product: it.product || undefined,
          name: it.name,
          sku: it.sku,
          hsn: it.hsn,
          quantity: Number(it.quantity) || 1,
          price: Number(it.price) || 0,
          discount: Number(it.discount) || 0,
          gst: Number(it.gst) || 0,
        })),
        couponDiscount: calculations.billDiscount,
        totalAmount: calculations.finalGrandTotal,
      };

      const res = await createOrder.mutateAsync(payload);
      const createdOrder = res?.item || res;

      // Record immediate payment if received > 0
      const rec = markFullyPaid ? calculations.finalGrandTotal : Number(receivedAmount) || 0;
      if (rec > 0 && createdOrder?._id) {
        await recordPayment.mutateAsync({
          order: createdOrder._id,
          customer: selectedPartyId,
          amount: rec,
          mode: paymentMode,
          notes: `Instant payment collected via ${paymentMode.toUpperCase()} for Invoice ${invoiceNo}`,
        });
      }

      if (saveAndNew) {
        setInvoiceNo(`INV-${Math.floor(100 + Math.random() * 900)}`);
        setItems([
          {
            product: "",
            name: "",
            sku: "",
            hsn: "8418",
            quantity: 1,
            unit: "PCS",
            price: 0,
            taxInclusive: true,
            discount: 0,
            gst: 18,
          },
        ]);
        setReceivedAmount("");
        setMarkFullyPaid(false);
        setIsSubmitting(false);
      } else {
        navigate(createdOrder?._id ? `/orders/${createdOrder._id}` : "/orders");
      }
    } catch (err) {
      setErrorMsg(err?.response?.data?.message || err.message || "Failed to create sales invoice.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="invoice-create-container">
      {/* 1. Top Navbar */}
      <header className="invoice-top-bar">
        <div className="invoice-top-left">
          <button type="button" className="invoice-btn-exit" onClick={() => navigate("/orders")}>
            <FiArrowLeft />
            <span>Exit</span>
          </button>
          <h1 className="invoice-title">Create Sales Invoice</h1>
        </div>

        {/* Center Mode Switcher */}
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

        {/* Top Right Actions */}
        <div className="invoice-top-right">
          <button
            type="button"
            className="invoice-btn-save-new"
            onClick={() => handleSaveInvoice(true)}
            disabled={isSubmitting}
          >
            Save & New
          </button>
          <button
            type="button"
            className="invoice-btn-save-primary"
            onClick={() => handleSaveInvoice(false)}
            disabled={isSubmitting}
          >
            <FiCheck />
            <span>{isSubmitting ? "Saving..." : "Save Invoice"}</span>
          </button>
        </div>
      </header>

      {/* Error Banner */}
      {errorMsg && (
        <div
          style={{
            maxWidth: 1280,
            margin: "16px auto 0",
            background: "#fef2f2",
            color: "#b91c1c",
            padding: "12px 20px",
            borderRadius: 10,
            border: "1px solid #fecaca",
            fontWeight: 700,
            fontSize: "0.9rem",
          }}
        >
          <FiAlertTriangle style={{ verticalAlign: "-2px", marginRight: 6 }} /> {errorMsg}
        </div>
      )}

      {/* 2. Main Sheet Canvas */}
      <main className="invoice-sheet">
        {/* VIEW MODE: EDIT */}
        {viewMode === "edit" ? (
          <>
            {/* Top Grid: Bill To & Invoice Details */}
            <div className="invoice-meta-grid">
              {/* Bill To */}
              <div className="invoice-bill-to-box">
                <div className="invoice-box-label">Bill To</div>

                {!selectedParty ? (
                  <div
                    className="invoice-party-dashed-btn"
                    onClick={() =>
                      openPartyModal((newParty) => {
                        if (newParty?._id) setSelectedPartyId(newParty._id);
                      })
                    }
                  >
                    <FiUserPlus style={{ fontSize: "1.4rem" }} />
                    <span>+ Add Party / Customer</span>
                  </div>
                ) : (
                  <div className="invoice-party-selected-card">
                    <div>
                      <div className="invoice-party-info-name">{selectedParty.name}</div>
                      <div className="invoice-party-info-sub">
                        <FiPhone style={{ verticalAlign: "-2px", marginRight: 5 }} />
                        {selectedParty.mobile}
                      </div>
                      {selectedParty.gstin && (
                        <div className="invoice-party-info-sub">
                          <strong>GSTIN:</strong> {selectedParty.gstin}
                        </div>
                      )}
                      {selectedParty.address && (
                        <div className="invoice-party-info-sub">
                          <FiMapPin style={{ verticalAlign: "-2px", marginRight: 5 }} />
                          {selectedParty.address}, {selectedParty.city}
                        </div>
                      )}
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        type="button"
                        onClick={() =>
                          openPartyModal((newParty) => {
                            if (newParty?._id) setSelectedPartyId(newParty._id);
                          })
                        }
                        style={{
                          background: "#fff",
                          border: "1px solid #dcd3be",
                          padding: "4px 10px",
                          borderRadius: 6,
                          fontSize: "0.78rem",
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        Change
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedPartyId("")}
                        style={{
                          background: "#fff",
                          border: "1px solid #fee2e2",
                          color: "#dc2626",
                          padding: "4px 8px",
                          borderRadius: 6,
                          fontSize: "0.78rem",
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                )}

                {/* Or Quick dropdown select party */}
                {!selectedParty && (
                  <select
                    className="invoice-meta-select"
                    value={selectedPartyId}
                    onChange={(e) => setSelectedPartyId(e.target.value)}
                  >
                    <option value="">-- Or Select Existing Party from List --</option>
                    {customers.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name} ({c.mobile}) {c.city ? `· ${c.city}` : ""}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Invoice Details Box */}
              <div className="invoice-details-box">
                <div className="invoice-details-header">
                  <span style={{ fontWeight: 800, fontSize: "0.95rem", color: "#1c1b17" }}>
                    Invoice Details
                  </span>
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      fontSize: "0.82rem",
                      fontWeight: 600,
                      color: "#4a4539",
                      cursor: "pointer",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={repeatInvoice}
                      onChange={(e) => setRepeatInvoice(e.target.checked)}
                    />
                    <span>Repeat this invoice</span>
                  </label>
                </div>

                <div className="invoice-details-grid">
                  <div className="invoice-meta-field">
                    <label className="invoice-meta-label">Sales Invoice No.</label>
                    <input
                      type="text"
                      className="invoice-meta-input"
                      value={invoiceNo}
                      onChange={(e) => setInvoiceNo(e.target.value)}
                    />
                  </div>

                  <div className="invoice-meta-field">
                    <label className="invoice-meta-label">Sales Invoice Date</label>
                    <input
                      type="date"
                      className="invoice-meta-input"
                      value={invoiceDate}
                      onChange={(e) => setInvoiceDate(e.target.value)}
                    />
                  </div>

                  <div className="invoice-meta-field">
                    <label className="invoice-meta-label">Showroom / Store *</label>
                    <select
                      className="invoice-meta-select"
                      value={showroom}
                      onChange={(e) => setShowroom(e.target.value)}
                    >
                      <option value="">Select Showroom Branch</option>
                      {showrooms.map((s) => (
                        <option key={s._id} value={s._id}>
                          {s.name} ({s.code || s.city})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="invoice-meta-field">
                    {!showDueDate ? (
                      <button
                        type="button"
                        onClick={() => setShowDueDate(true)}
                        style={{
                          background: "transparent",
                          border: "none",
                          color: "#8a6016",
                          fontWeight: 700,
                          fontSize: "0.82rem",
                          cursor: "pointer",
                          textAlign: "left",
                          padding: "8px 0",
                        }}
                      >
                        + Add Due Date
                      </button>
                    ) : (
                      <>
                        <label className="invoice-meta-label">Due Date</label>
                        <input
                          type="date"
                          className="invoice-meta-input"
                          value={dueDate}
                          onChange={(e) => setDueDate(e.target.value)}
                        />
                      </>
                    )}
                  </div>

                  <div className="invoice-meta-field">
                    <label className="invoice-meta-label">E-Way Bill No.</label>
                    <input
                      type="text"
                      className="invoice-meta-input"
                      placeholder="Enter E-Way Bill Number"
                      value={ewayBill}
                      onChange={(e) => setEwayBill(e.target.value)}
                    />
                  </div>

                  <div className="invoice-meta-field">
                    <label className="invoice-meta-label">Vehicle No.</label>
                    <input
                      type="text"
                      className="invoice-meta-input"
                      placeholder="e.g. KA 01 AB 1234"
                      value={vehicleNo}
                      onChange={(e) => setVehicleNo(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Line Items Table */}
            <div className="invoice-table-wrap">
              <table className="invoice-table">
                <thead>
                  <tr>
                    <th style={{ width: "4%" }}>NO</th>
                    <th style={{ width: "34%" }}>ITEMS</th>
                    <th style={{ width: "10%" }}>HSN</th>
                    <th style={{ width: "10%" }}>QTY</th>
                    <th style={{ width: "14%" }}>PRICE/ITEM (₹)</th>
                    <th style={{ width: "10%" }}>DISCOUNT</th>
                    <th style={{ width: "8%" }}>TAX</th>
                    <th style={{ width: "10%", textAlign: "right" }}>AMOUNT (₹)</th>
                    <th style={{ width: "4%" }}></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it, idx) => {
                    const lineCalc = calculations.lineCalculations[idx] || { lineTotal: 0 };
                    return (
                      <tr key={idx}>
                        <td style={{ fontWeight: 700, color: "#8c826c" }}>{idx + 1}</td>
                        <td>
                          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                            <select
                              className="invoice-item-input"
                              value={it.product}
                              onChange={(e) => handleProductSelect(idx, e.target.value)}
                            >
                              <option value="">-- Choose Product / Item --</option>
                              {products.map((p) => (
                                <option key={p._id} value={p._id}>
                                  {p.name} ({p.sku}) · ₹{p.sellingPrice || p.mrp}
                                </option>
                              ))}
                            </select>
                            <input
                              type="text"
                              className="invoice-item-input"
                              placeholder="Or type custom item name / description"
                              value={it.name}
                              onChange={(e) => handleLineChange(idx, "name", e.target.value)}
                            />
                          </div>
                        </td>
                        <td>
                          <input
                            type="text"
                            className="invoice-item-input"
                            value={it.hsn}
                            onChange={(e) => handleLineChange(idx, "hsn", e.target.value)}
                          />
                        </td>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                            <input
                              type="number"
                              className="invoice-item-input"
                              value={it.quantity}
                              onChange={(e) => handleLineChange(idx, "quantity", e.target.value)}
                              min="1"
                            />
                            <span style={{ fontSize: "0.75rem", color: "#787163", fontWeight: 700 }}>
                              {it.unit}
                            </span>
                          </div>
                        </td>
                        <td>
                          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                            <input
                              type="number"
                              className="invoice-item-input"
                              value={it.price}
                              onChange={(e) => handleLineChange(idx, "price", e.target.value)}
                              min="0"
                            />
                            <span style={{ fontSize: "0.72rem", color: "#8a6016", fontWeight: 600 }}>
                              {it.taxInclusive ? "Incl. Tax" : "Excl. Tax"}
                            </span>
                          </div>
                        </td>
                        <td>
                          <input
                            type="number"
                            className="invoice-item-input"
                            placeholder="₹ Disc"
                            value={it.discount}
                            onChange={(e) => handleLineChange(idx, "discount", e.target.value)}
                            min="0"
                          />
                        </td>
                        <td>
                          <select
                            className="invoice-item-input"
                            value={it.gst}
                            onChange={(e) => handleLineChange(idx, "gst", Number(e.target.value))}
                          >
                            {GST_RATES.map((rate) => (
                              <option key={rate} value={rate}>
                                {rate}%
                              </option>
                            ))}
                          </select>
                        </td>
                        <td style={{ textAlign: "right", fontWeight: 800, color: "#1c1b17" }}>
                          ₹ {lineCalc.lineTotal.toLocaleString("en-IN")}
                        </td>
                        <td>
                          {items.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeItemLine(idx)}
                              style={{
                                background: "none",
                                border: "none",
                                color: "#dc2626",
                                cursor: "pointer",
                                fontSize: "1rem",
                              }}
                              title="Delete Line"
                            >
                              <FiTrash2 />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Add Item & Scan Barcode Action Row */}
              <div className="invoice-add-item-row">
                <div style={{ display: "flex", gap: 12 }}>
                  <button type="button" className="invoice-btn-add-item" onClick={addItemLine}>
                    <FiPlus />
                    <span>+ Add Item</span>
                  </button>
                  <button
                    type="button"
                    className="invoice-btn-add-item"
                    style={{ color: "#8a6016", borderLeft: "1px solid #e5dcc4", paddingLeft: 12 }}
                    onClick={() => navigate("/products/create")}
                  >
                    <span>+ Create New Item</span>
                  </button>
                </div>

                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  {barcodePrompt ? (
                    <form onSubmit={handleBarcodeScan} style={{ display: "flex", gap: 6 }}>
                      <input
                        type="text"
                        placeholder="Scan / Type SKU and press Enter"
                        className="invoice-item-input"
                        value={barcodeInput}
                        onChange={(e) => setBarcodeInput(e.target.value)}
                        autoFocus
                        style={{ width: 220 }}
                      />
                      <button type="submit" className="invoice-btn-scan-barcode">
                        Scan
                      </button>
                      <button
                        type="button"
                        onClick={() => setBarcodePrompt(false)}
                        style={{ background: "none", border: "none", cursor: "pointer" }}
                      >
                        ✕
                      </button>
                    </form>
                  ) : (
                    <button
                      type="button"
                      className="invoice-btn-scan-barcode"
                      onClick={() => setBarcodePrompt(true)}
                    >
                      <span>📷 Scan Barcode / SKU</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Subtotal Footer */}
              <table className="invoice-table">
                <tfoot>
                  <tr className="invoice-table-subtotal-row">
                    <td style={{ width: "48%" }}>
                      <strong>Subtotal</strong>
                    </td>
                    <td style={{ width: "10%" }}>
                      <strong>{calculations.totalQty} PCS</strong>
                    </td>
                    <td style={{ width: "14%" }}></td>
                    <td style={{ width: "10%" }}>
                      <strong>₹ {calculations.totalItemDiscount.toLocaleString("en-IN")}</strong>
                    </td>
                    <td style={{ width: "8%" }}>
                      <strong>₹ {calculations.totalTax.toLocaleString("en-IN")}</strong>
                    </td>
                    <td style={{ width: "10%", textAlign: "right" }}>
                      <strong>₹ {calculations.rawSubtotal.toLocaleString("en-IN")}</strong>
                    </td>
                    <td style={{ width: "4%" }}></td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Bottom Section: Left Notes/Bank/UPI & Right Financials */}
            <div className="invoice-bottom-grid">
              {/* Left Column: Notes, Terms, Bank Details, and Custom UPI QR Upload */}
              <div className="invoice-bottom-left">
                {/* Notes */}
                {!showNotes ? (
                  <button
                    type="button"
                    className="invoice-expandable-btn"
                    onClick={() => setShowNotes(true)}
                  >
                    <FiEdit style={{ verticalAlign: "-2px", marginRight: 6 }} /> Add Notes
                  </button>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span className="invoice-box-label">Notes</span>
                      <button
                        type="button"
                        onClick={() => setShowNotes(false)}
                        style={{ background: "none", border: "none", color: "#8c826c", cursor: "pointer" }}
                      >
                        Remove
                      </button>
                    </div>
                    <textarea
                      rows={2}
                      className="invoice-item-input"
                      placeholder="Add public invoice notes or special handling instructions..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </div>
                )}

                {/* Terms */}
                {!showTerms ? (
                  <button
                    type="button"
                    className="invoice-expandable-btn"
                    onClick={() => setShowTerms(true)}
                  >
                    <FiFileText style={{ verticalAlign: "-2px", marginRight: 6 }} /> Add Terms &amp; Conditions
                  </button>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span className="invoice-box-label">Terms & Conditions</span>
                      <button
                        type="button"
                        onClick={() => setShowTerms(false)}
                        style={{ background: "none", border: "none", color: "#8c826c", cursor: "pointer" }}
                      >
                        Remove
                      </button>
                    </div>
                    <textarea
                      rows={3}
                      className="invoice-item-input"
                      value={terms}
                      onChange={(e) => setTerms(e.target.value)}
                    />
                  </div>
                )}

                {/* Bank Details Box */}
                {showBank && (
                  <div className="invoice-bank-card">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontWeight: 800, fontSize: "0.86rem", color: "#1c1b17" }}>
                        Bank Details
                      </span>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button
                          type="button"
                          onClick={() => setEditBankModal(true)}
                          style={{
                            background: "#fff",
                            border: "1px solid #dcd3be",
                            padding: "2px 8px",
                            borderRadius: 4,
                            fontSize: "0.75rem",
                            fontWeight: 700,
                            cursor: "pointer",
                          }}
                        >
                          Change
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowBank(false)}
                          style={{
                            background: "none",
                            border: "none",
                            color: "#dc2626",
                            fontSize: "0.75rem",
                            cursor: "pointer",
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    </div>

                    <div className="invoice-bank-grid">
                      <div>
                        <div className="invoice-bank-label">Account Number:</div>
                        <div className="invoice-bank-value">{bankDetails.accountNumber}</div>
                      </div>
                      <div>
                        <div className="invoice-bank-label">IFSC Code:</div>
                        <div className="invoice-bank-value">{bankDetails.ifsc}</div>
                      </div>
                      <div>
                        <div className="invoice-bank-label">Bank & Branch:</div>
                        <div className="invoice-bank-value">{bankDetails.bankName}</div>
                      </div>
                      <div>
                        <div className="invoice-bank-label">Account Holder Name:</div>
                        <div className="invoice-bank-value">{bankDetails.holderName}</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Payment QR / UPI Box with Upload Option */}
                {showUpi && (
                  <div className="invoice-upi-card">
                    <img src={dynamicQrUrl} alt="Payment QR" className="invoice-upi-qr-preview" />
                    <div className="invoice-upi-info">
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontWeight: 800, fontSize: "0.86rem", color: "#1c1b17" }}>
                          Payment QR / UPI
                        </span>
                        <FiHelpCircle title="Scan to pay directly from PhonePe, GPay, Paytm, or BHIM" />
                      </div>
                      <div className="invoice-upi-id-text">{upiId}</div>

                      <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                        <input
                          type="file"
                          ref={fileInputRef}
                          style={{ display: "none" }}
                          accept="image/*"
                          onChange={handleQrUpload}
                        />
                        <button
                          type="button"
                          className="invoice-upi-upload-btn"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <FiUpload />
                          <span>Upload Custom QR</span>
                        </button>

                        {customQrImage && (
                          <button
                            type="button"
                            onClick={() => setCustomQrImage(null)}
                            style={{
                              background: "#fff",
                              border: "1px solid #fee2e2",
                              color: "#dc2626",
                              padding: "4px 8px",
                              borderRadius: 6,
                              fontSize: "0.76rem",
                              fontWeight: 700,
                              cursor: "pointer",
                            }}
                          >
                            Reset to Auto QR
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: Financial Breakdown & Payments */}
              <div className="invoice-financials-card">
                {/* Additional Charges */}
                {!showAddlCharges ? (
                  <button
                    type="button"
                    className="invoice-expandable-btn"
                    onClick={() => setShowAddlCharges(true)}
                  >
                    + Add Additional Charges (Shipping / Handling)
                  </button>
                ) : (
                  <div className="invoice-calc-row">
                    <div style={{ display: "flex", gap: 6 }}>
                      <input
                        type="text"
                        className="invoice-item-input"
                        value={addlChargesDesc}
                        onChange={(e) => setAddlChargesDesc(e.target.value)}
                        style={{ width: 140 }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setShowAddlCharges(false);
                          setAddlCharges(0);
                        }}
                        style={{ background: "none", border: "none", color: "#dc2626", cursor: "pointer" }}
                      >
                        ✕
                      </button>
                    </div>
                    <input
                      type="number"
                      className="invoice-item-input"
                      placeholder="₹ 0"
                      value={addlCharges}
                      onChange={(e) => setAddlCharges(Number(e.target.value) || 0)}
                      style={{ width: 100, textAlign: "right" }}
                      min="0"
                    />
                  </div>
                )}

                <div className="invoice-calc-row">
                  <span>Taxable Amount</span>
                  <strong>₹ {calculations.taxableAmount.toLocaleString("en-IN")}</strong>
                </div>

                <div className="invoice-calc-row">
                  <span>Total Tax (GST)</span>
                  <strong>₹ {calculations.totalTax.toLocaleString("en-IN")}</strong>
                </div>

                {/* Overall Discount */}
                {!showOverallDiscount ? (
                  <button
                    type="button"
                    className="invoice-expandable-btn"
                    onClick={() => setShowOverallDiscount(true)}
                  >
                    + Add Bill Discount
                  </button>
                ) : (
                  <div className="invoice-calc-row">
                    <span>Discount on Bill (₹)</span>
                    <input
                      type="number"
                      className="invoice-item-input"
                      value={overallDiscount}
                      onChange={(e) => setOverallDiscount(Number(e.target.value) || 0)}
                      style={{ width: 100, textAlign: "right" }}
                      min="0"
                    />
                  </div>
                )}

                {/* TCS Checkbox */}
                <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.85rem", color: "#4a4539", cursor: "pointer", fontWeight: 600 }}>
                  <input
                    type="checkbox"
                    checked={applyTcs}
                    onChange={(e) => setApplyTcs(e.target.checked)}
                  />
                  <span>Apply TCS (Tax Collected at Source @ 0.1%)</span>
                </label>

                {/* Auto Round Off */}
                <div className="invoice-calc-row">
                  <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontWeight: 600 }}>
                    <input
                      type="checkbox"
                      checked={autoRoundOff}
                      onChange={(e) => setAutoRoundOff(e.target.checked)}
                    />
                    <span>Auto Round Off</span>
                  </label>
                  <span>{calculations.roundOffDiff >= 0 ? `+ ₹${calculations.roundOffDiff}` : `- ₹${Math.abs(calculations.roundOffDiff)}`}</span>
                </div>

                {/* Total Amount (Large Display) */}
                <div className="invoice-calc-grand-total">
                  <span>Total Amount:</span>
                  <span style={{ color: "#c68629" }}>₹ {calculations.finalGrandTotal.toLocaleString("en-IN")}</span>
                </div>

                {/* Total Amount Received */}
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <div className="invoice-calc-row">
                    <span>Total Amount Received</span>
                    <span style={{ fontWeight: 700 }}>₹ {calculations.received.toLocaleString("en-IN")}</span>
                  </div>

                  <div className="invoice-received-row">
                    <input
                      type="number"
                      className="invoice-received-input"
                      placeholder="₹ Enter received amount"
                      value={receivedAmount}
                      onChange={(e) => {
                        setReceivedAmount(e.target.value);
                        setMarkFullyPaid(false);
                      }}
                      min="0"
                    />
                    <select
                      className="invoice-meta-select"
                      value={paymentMode}
                      onChange={(e) => setPaymentMode(e.target.value)}
                      style={{ width: 150 }}
                    >
                      {PAYMENT_MODES.map((m) => (
                        <option key={m.value} value={m.value}>
                          {m.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.85rem", fontWeight: 700, color: "#16a34a", cursor: "pointer", marginTop: 4 }}>
                    <input
                      type="checkbox"
                      checked={markFullyPaid}
                      onChange={(e) => handleMarkFullyPaidChange(e.target.checked)}
                    />
                    <span>Mark as fully paid</span>
                  </label>
                </div>

                {/* Balance Amount */}
                <div className="invoice-balance-row">
                  <span>Balance Amount</span>
                  <span style={{ color: calculations.balanceDue > 0 ? "#dc2626" : "#16a34a" }}>
                    ₹ {calculations.balanceDue.toLocaleString("en-IN")}
                  </span>
                </div>

                {/* Authorized Signature Box */}
                <input
                  type="file"
                  ref={sigInputRef}
                  style={{ display: "none" }}
                  accept="image/*"
                  onChange={handleSignatureUpload}
                />
                {!signatureImage ? (
                  <div
                    className="invoice-signature-dashed-box"
                    onClick={() => sigInputRef.current?.click()}
                  >
                    <FiUpload />
                    <span>+ Add Authorized Signature</span>
                  </div>
                ) : (
                  <div style={{ border: "1px solid #e5dcc4", borderRadius: 8, padding: 8, background: "#fff", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <img src={signatureImage} alt="Signature" style={{ maxHeight: 40, objectFit: "contain" }} />
                    <button
                      type="button"
                      onClick={() => setSignatureImage(null)}
                      style={{ background: "none", border: "none", color: "#dc2626", cursor: "pointer" }}
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          /* VIEW MODE: PREVIEW — reuses the shared TaxInvoice so the preview is
             identical to the real printed invoice, dynamic from company settings. */
          <div className="inv-view__sheet" style={{ padding: 24, background: "#fff", border: "1px solid #e5dcc4", borderRadius: 10, maxWidth: 820, margin: "0 auto" }}>
            <TaxInvoice o={previewOrder} company={company} balance={calculations.balanceDue} />
          </div>
        )}
      </main>

      {/* Edit Bank Details Modal */}
      {editBankModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}
        >
          <div
            style={{
              background: "#fff",
              padding: 24,
              borderRadius: 14,
              width: "100%",
              maxWidth: 460,
              boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
            }}
          >
            <h3 style={{ margin: "0 0 16px", color: "#1c1b17" }}>Edit Bank Details</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <label className="invoice-meta-label">Account Number</label>
                <input
                  type="text"
                  className="invoice-meta-input"
                  value={bankDetails.accountNumber}
                  onChange={(e) =>
                    setBankDetails((prev) => ({ ...prev, accountNumber: e.target.value }))
                  }
                />
              </div>
              <div>
                <label className="invoice-meta-label">IFSC Code</label>
                <input
                  type="text"
                  className="invoice-meta-input"
                  value={bankDetails.ifsc}
                  onChange={(e) =>
                    setBankDetails((prev) => ({ ...prev, ifsc: e.target.value }))
                  }
                />
              </div>
              <div>
                <label className="invoice-meta-label">Bank & Branch Name</label>
                <input
                  type="text"
                  className="invoice-meta-input"
                  value={bankDetails.bankName}
                  onChange={(e) =>
                    setBankDetails((prev) => ({ ...prev, bankName: e.target.value }))
                  }
                />
              </div>
              <div>
                <label className="invoice-meta-label">Account Holder Name</label>
                <input
                  type="text"
                  className="invoice-meta-input"
                  value={bankDetails.holderName}
                  onChange={(e) =>
                    setBankDetails((prev) => ({ ...prev, holderName: e.target.value }))
                  }
                />
              </div>
              <div>
                <label className="invoice-meta-label">UPI ID</label>
                <input
                  type="text"
                  className="invoice-meta-input"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                />
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20 }}>
              <button
                type="button"
                className="invoice-btn-exit"
                onClick={() => setEditBankModal(false)}
              >
                Close
              </button>
              <button
                type="button"
                className="invoice-btn-save-primary"
                onClick={() => setEditBankModal(false)}
              >
                Save Bank Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default OrderCreatePage;
