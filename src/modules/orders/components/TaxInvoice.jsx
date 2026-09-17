// Shared GST Tax Invoice (ParNets-style). Dynamic from company settings + the
// fulfilling store's details. Used by both the order detail modal and the
// dedicated full-page invoice view.
import { imageUrl } from "../../storefront/utils";
import { numberToWords } from "../../../utils/numberToWords";
import PaymentIcons from "./PaymentIcons";

const num = (n) =>
  (Number(n) || 0).toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 });

export default function TaxInvoice({ o, company, balance, docTitle = "TAX INVOICE" }) {
  const c = company || {};
  const store = o.showroom || {};
  // Seller on the invoice = the GARUDA company (from Settings). Company details
  // always win; the store only fills a gap if a company field is blank.
  const seller = {
    name: c.businessName || store.name || "Company Name",
    address: c.billingAddress || store.address || "",
    city: c.city || store.city || "",
    state: c.state || store.state || "",
    pincode: c.pincode || store.pincode || "",
    gstin: c.gstin || store.gstin || "",
    pan: c.pan || "",
    phone: c.phone || store.phone || "",
    logo: c.logo || "",
  };
  const items = o.items || [];
  const bal = balance != null ? balance : Math.max((o.grandTotal || 0) - (o.amountPaid || 0), 0);

  const rows = items.map((it) => {
    const qty = it.quantity || 1;
    const gross = (it.price || 0) * qty;
    const disc = it.discount || 0;
    const net = Math.max(gross - disc, 0);
    const gstRate = it.gst || it.product?.gst || 0;
    const taxable = gstRate > 0 ? net / (1 + gstRate / 100) : net;
    const taxAmt = net - taxable;
    return {
      name: it.name || it.product?.name || "Product",
      hsn: it.product?.hsn || "-",
      unit: it.product?.unit || "PCS",
      qty,
      rate: it.price || 0,
      amount: net,
      gstRate,
      taxable,
      taxAmt,
    };
  });

  const totalQty = rows.reduce((s, r) => s + r.qty, 0);
  const totalTaxable = rows.reduce((s, r) => s + r.taxable, 0);
  const totalTax = rows.reduce((s, r) => s + r.taxAmt, 0);
  const cgst = totalTax / 2;
  const sgst = totalTax / 2;

  const hsnMap = {};
  rows.forEach((r) => {
    const key = `${r.hsn}|${r.gstRate}`;
    if (!hsnMap[key]) hsnMap[key] = { hsn: r.hsn, rate: r.gstRate, taxable: 0, tax: 0 };
    hsnMap[key].taxable += r.taxable;
    hsnMap[key].tax += r.taxAmt;
  });
  const hsnRows = Object.values(hsnMap);

  const invoiceNo = o.number || "-";
  const invoiceDate = new Date(o.createdAt).toLocaleDateString("en-GB");
  const placeOfSupply = o.customer?.state || c.state || "Karnataka";

  const cust = o.customer || {};
  const custAddr = [cust.address, cust.city, cust.state, cust.pincode].filter(Boolean).join(", ");
  const shipAddr = cust.shippingAddress?.address
    ? [cust.shippingAddress.address, cust.shippingAddress.city, cust.shippingAddress.state, cust.shippingAddress.pincode].filter(Boolean).join(", ")
    : custAddr;

  const upiQrSrc = c.customQrImage
    ? imageUrl(c.customQrImage)
    : c.upiId
      ? `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(`upi://pay?pa=${c.upiId}&pn=${c.businessName || ""}&am=${o.grandTotal || 0}&cu=INR`)}`
      : null;

  const bd = { border: "1px solid #333", padding: "4px 8px", fontSize: "0.72rem" };
  const bdRight = { ...bd, textAlign: "right" };
  const bdCenter = { ...bd, textAlign: "center" };

  return (
    <div className="printable-document" style={{ background: "#fff", color: "#111", fontSize: "0.72rem", lineHeight: 1.35 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
        <strong style={{ fontSize: "0.8rem" }}>{docTitle}</strong>
        <span style={{ border: "1px solid #999", padding: "1px 8px", fontSize: "0.68rem", color: "#555" }}>ORIGINAL FOR RECIPIENT</span>
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 0 }}>
        <tbody>
          <tr>
            <td style={{ ...bd, width: "58%", verticalAlign: "top" }}>
              <div style={{ display: "flex", gap: 10 }}>
                {seller.logo ? <img src={imageUrl(seller.logo)} alt="logo" style={{ height: 46, objectFit: "contain" }} /> : null}
                <div>
                  <div style={{ fontWeight: 800, fontSize: "0.95rem" }}>{seller.name}</div>
                  {seller.address ? <div>{seller.address}</div> : null}
                  <div>{[seller.city, seller.state, seller.pincode].filter(Boolean).join(", ")}</div>
                  {seller.gstin ? <div><strong>GSTIN:</strong> {seller.gstin}</div> : null}
                  {seller.pan ? <div><strong>PAN:</strong> {seller.pan}</div> : null}
                  {seller.phone ? <div><strong>Mobile:</strong> {seller.phone}</div> : null}
                </div>
              </div>
            </td>
            <td style={{ ...bd, verticalAlign: "top" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                <div>
                  <div style={{ color: "#555" }}>Invoice No.</div>
                  <div style={{ fontWeight: 700 }}>{invoiceNo}</div>
                </div>
                <div>
                  <div style={{ color: "#555" }}>Invoice Date</div>
                  <div style={{ fontWeight: 700 }}>{invoiceDate}</div>
                </div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <tbody>
          <tr>
            <td style={{ ...bd, width: "50%", verticalAlign: "top" }}>
              <div style={{ fontWeight: 700 }}>BILL TO</div>
              <div style={{ fontWeight: 700 }}>{cust.name || "Customer"}</div>
              {custAddr ? <div><strong>Address:</strong> {custAddr}</div> : null}
              {cust.gstin ? <div><strong>GSTIN:</strong> {cust.gstin}</div> : null}
              <div><strong>Place of Supply:</strong> {placeOfSupply}</div>
              {cust.mobile ? <div><strong>Mobile:</strong> {cust.mobile}</div> : null}
              {cust.pan ? <div><strong>PAN:</strong> {cust.pan}</div> : null}
            </td>
            <td style={{ ...bd, verticalAlign: "top" }}>
              <div style={{ fontWeight: 700 }}>SHIP TO</div>
              <div style={{ fontWeight: 700 }}>{cust.name || "Customer"}</div>
              {shipAddr ? <div><strong>Address:</strong> {shipAddr}</div> : null}
            </td>
          </tr>
        </tbody>
      </table>

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ background: "#f0f0f0" }}>
            <td style={bdCenter}><strong>S.NO.</strong></td>
            <td style={bd}><strong>ITEMS</strong></td>
            <td style={bdCenter}><strong>HSN</strong></td>
            <td style={bdCenter}><strong>QTY.</strong></td>
            <td style={bdRight}><strong>RATE</strong></td>
            <td style={bdRight}><strong>AMOUNT</strong></td>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              <td style={bdCenter}>{i + 1}</td>
              <td style={bd}>{r.name}</td>
              <td style={bdCenter}>{r.hsn}</td>
              <td style={bdCenter}>{r.qty} {r.unit}</td>
              <td style={bdRight}>{num(r.rate)}</td>
              <td style={bdRight}>{num(r.amount)}</td>
            </tr>
          ))}
          <tr>
            <td style={bd}></td>
            <td style={{ ...bd, textAlign: "right", fontStyle: "italic" }} colSpan={4}>CGST @{rows[0]?.gstRate ? rows[0].gstRate / 2 : 9}%</td>
            <td style={bdRight}>₹{num(cgst)}</td>
          </tr>
          <tr>
            <td style={bd}></td>
            <td style={{ ...bd, textAlign: "right", fontStyle: "italic" }} colSpan={4}>SGST @{rows[0]?.gstRate ? rows[0].gstRate / 2 : 9}%</td>
            <td style={bdRight}>₹{num(sgst)}</td>
          </tr>
          <tr style={{ background: "#f0f0f0", fontWeight: 700 }}>
            <td style={bd}></td>
            <td style={{ ...bd, textAlign: "right" }} colSpan={2}>TOTAL</td>
            <td style={bdCenter}>{totalQty}</td>
            <td style={bd}></td>
            <td style={bdRight}>₹ {num(o.grandTotal)}</td>
          </tr>
          <tr>
            <td style={bd}></td>
            <td style={{ ...bd, textAlign: "right", fontWeight: 700 }} colSpan={4}>BALANCE DUE</td>
            <td style={bdRight}>₹ {num(bal)}</td>
          </tr>
        </tbody>
      </table>

      <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 6 }}>
        <thead>
          <tr style={{ background: "#f7f7f7" }}>
            <td style={bd} rowSpan={2}><strong>HSN/SAC</strong></td>
            <td style={bdCenter} rowSpan={2}><strong>Taxable Value</strong></td>
            <td style={bdCenter} colSpan={2}><strong>CGST</strong></td>
            <td style={bdCenter} colSpan={2}><strong>SGST</strong></td>
            <td style={bdCenter} rowSpan={2}><strong>Total Tax Amount</strong></td>
          </tr>
          <tr style={{ background: "#f7f7f7" }}>
            <td style={bdCenter}><strong>Rate</strong></td>
            <td style={bdCenter}><strong>Amount</strong></td>
            <td style={bdCenter}><strong>Rate</strong></td>
            <td style={bdCenter}><strong>Amount</strong></td>
          </tr>
        </thead>
        <tbody>
          {hsnRows.map((h, i) => (
            <tr key={i}>
              <td style={bd}>{h.hsn}</td>
              <td style={bdRight}>{num(h.taxable)}</td>
              <td style={bdCenter}>{h.rate / 2}%</td>
              <td style={bdRight}>{num(h.tax / 2)}</td>
              <td style={bdCenter}>{h.rate / 2}%</td>
              <td style={bdRight}>{num(h.tax / 2)}</td>
              <td style={bdRight}>₹ {num(h.tax)}</td>
            </tr>
          ))}
          <tr style={{ fontWeight: 700 }}>
            <td style={bd}>Total</td>
            <td style={bdRight}>{num(totalTaxable)}</td>
            <td style={bd}></td>
            <td style={bdRight}>{num(cgst)}</td>
            <td style={bd}></td>
            <td style={bdRight}>{num(sgst)}</td>
            <td style={bdRight}>₹ {num(totalTax)}</td>
          </tr>
        </tbody>
      </table>

      <div style={{ border: "1px solid #333", borderTop: "none", padding: "6px 8px" }}>
        <div style={{ fontWeight: 700 }}>Total Amount (in words)</div>
        <div>{numberToWords(o.grandTotal)}</div>
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse", borderTop: "none" }}>
        <tbody>
          <tr>
            <td style={{ ...bd, width: "62%", verticalAlign: "top", padding: "8px 10px" }}>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>Bank Details</div>
              <table style={{ borderCollapse: "collapse" }}>
                <tbody>
                  <tr>
                    <td style={{ color: "#555", padding: "2px 16px 2px 0", verticalAlign: "top" }}>Name</td>
                    <td style={{ fontWeight: 600, padding: "2px 0" }}>{c.accountHolder || c.businessName || "-"}</td>
                  </tr>
                  <tr>
                    <td style={{ color: "#555", padding: "2px 16px 2px 0", verticalAlign: "top" }}>IFSC Code</td>
                    <td style={{ fontWeight: 600, padding: "2px 0" }}>{c.ifsc || "-"}</td>
                  </tr>
                  <tr>
                    <td style={{ color: "#555", padding: "2px 16px 2px 0", verticalAlign: "top" }}>Account No</td>
                    <td style={{ fontWeight: 600, padding: "2px 0" }}>{c.accountNumber || "-"}</td>
                  </tr>
                  <tr>
                    <td style={{ color: "#555", padding: "2px 16px 2px 0", verticalAlign: "top" }}>Bank</td>
                    <td style={{ fontWeight: 600, padding: "2px 0" }}>{[c.bankName, c.branch].filter(Boolean).join(", ") || "-"}</td>
                  </tr>
                </tbody>
              </table>
            </td>
            <td style={{ ...bd, verticalAlign: "top", padding: "8px 10px" }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
                <div>
                  <div style={{ fontWeight: 700, marginBottom: 6 }}>Payment QR Code</div>
                  {c.upiId ? (
                    <>
                      <div style={{ color: "#555" }}>UPI ID:</div>
                      <div style={{ fontWeight: 600, marginBottom: 8 }}>{c.upiId}</div>
                      {/* Accepted payment apps — real brand marks */}
                      <PaymentIcons size={18} />
                    </>
                  ) : (
                    <div style={{ color: "#999", fontSize: "0.68rem" }}>Set UPI ID in Settings</div>
                  )}
                </div>
                {upiQrSrc ? (
                  <img src={upiQrSrc} alt="Payment QR" style={{ height: 84, width: 84, objectFit: "contain", flexShrink: 0 }} />
                ) : null}
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <table style={{ width: "100%", borderCollapse: "collapse", borderTop: "none" }}>
        <tbody>
          <tr>
            <td style={{ ...bd, textAlign: "right", paddingTop: 10 }}>
              <div>For <strong>{seller.name}</strong></div>
              {c.signature ? (
                <img src={imageUrl(c.signature)} alt="signature" style={{ height: 40, objectFit: "contain", marginTop: 6 }} />
              ) : (
                <div style={{ height: 40 }} />
              )}
              <div style={{ marginTop: 4 }}>Authorised Signatory</div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
