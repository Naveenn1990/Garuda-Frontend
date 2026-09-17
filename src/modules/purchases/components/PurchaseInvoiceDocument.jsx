// Purchase Invoice document — a DEDICATED template, fully separate from the sales
// TaxInvoice. A purchase bill is the supplier billing YOU, so the seller/BILL FROM is
// the SUPPLIER and the recipient is your own company (from settings). Title is
// "PURCHASE". Changing the sales invoice never affects this and vice-versa.
import { imageUrl } from "../../storefront/utils";
import { numberToWords } from "../../../utils/numberToWords";

const num = (n) =>
  (Number(n) || 0).toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 });

export default function PurchaseInvoiceDocument({ p, company }) {
  const c = company || {};
  const supplier = p.supplier || {};
  const warehouse = p.warehouse || {};

  // Seller on a purchase invoice = the SUPPLIER we bought from.
  const seller = {
    name: supplier.name || "Supplier",
    address: supplier.address || "",
    city: supplier.city || "",
    state: supplier.state || "",
    pincode: supplier.pincode || "",
    gstin: supplier.gstin || "",
    pan: supplier.pan || "",
    phone: supplier.mobile || "",
  };

  // Recipient = our own company (from company settings).
  const buyer = {
    name: c.businessName || "Company",
    address: c.billingAddress || "",
    city: c.city || "",
    state: c.state || "",
    pincode: c.pincode || "",
    gstin: c.gstin || "",
    pan: c.pan || "",
    logo: c.logo || "",
  };

  const items = p.items || [];
  const rows = items.map((it) => {
    const qty = it.quantity || 1;
    const gross = (it.price || 0) * qty;
    const disc = it.discount || 0;
    const net = Math.max(gross - disc, 0);
    const gstRate = it.gst || it.product?.gst || 0;
    const taxable = gstRate > 0 ? net / (1 + gstRate / 100) : net;
    const taxAmt = net - taxable;
    return {
      name: it.name || it.product?.name || "Item",
      hsn: it.hsn || it.product?.hsn || "-",
      unit: it.unit || it.product?.unit || "PCS",
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

  const invoiceNo = p.number || "-";
  const invoiceDate = p.invoiceDate || p.createdAt;
  const dateStr = invoiceDate ? new Date(invoiceDate).toLocaleDateString("en-GB") : "-";
  const placeOfSupply = supplier.state || c.state || "";

  const supAddr = [seller.city, seller.state, seller.pincode].filter(Boolean).join(", ");
  const buyerAddr = [buyer.city, buyer.state, buyer.pincode].filter(Boolean).join(", ");

  const bd = { border: "1px solid #333", padding: "4px 8px", fontSize: "0.72rem" };
  const bdRight = { ...bd, textAlign: "right" };
  const bdCenter = { ...bd, textAlign: "center" };

  return (
    <div className="printable-document" style={{ background: "#fff", color: "#111", fontSize: "0.72rem", lineHeight: 1.35 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
        <strong style={{ fontSize: "0.8rem" }}>PURCHASE</strong>
        <span style={{ border: "1px solid #999", padding: "1px 8px", fontSize: "0.68rem", color: "#555" }}>ORIGINAL FOR RECIPIENT</span>
      </div>

      {/* Company header (our own business, from Settings) + purchase meta. The
          supplier appears in the BILL FROM section below. */}
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <tbody>
          <tr>
            <td style={{ ...bd, width: "58%", verticalAlign: "top" }}>
              <div style={{ display: "flex", gap: 10 }}>
                {buyer.logo ? (
                  <img src={imageUrl(buyer.logo)} alt="logo" style={{ height: 46, objectFit: "contain" }} />
                ) : null}
                <div>
                  <div style={{ fontWeight: 800, fontSize: "0.95rem" }}>{buyer.name}</div>
                  {buyer.address ? <div>{buyer.address}</div> : null}
                  {buyerAddr ? <div>{buyerAddr}</div> : null}
                  {buyer.gstin ? <div><strong>GSTIN:</strong> {buyer.gstin}</div> : null}
                  {buyer.pan ? <div><strong>PAN:</strong> {buyer.pan}</div> : null}
                  {c.phone ? <div><strong>Mobile:</strong> {c.phone}</div> : null}
                </div>
              </div>
            </td>
            <td style={{ ...bd, verticalAlign: "top" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                <div>
                  <div style={{ color: "#555" }}>Purchase No.</div>
                  <div style={{ fontWeight: 700 }}>{invoiceNo}</div>
                </div>
                <div>
                  <div style={{ color: "#555" }}>Purchase Date</div>
                  <div style={{ fontWeight: 700 }}>{dateStr}</div>
                </div>
              </div>
              {p.originalInvoiceNo ? (
                <div style={{ marginTop: 8 }}>
                  <div style={{ color: "#555" }}>Original Invoice No.</div>
                  <div style={{ fontWeight: 700 }}>{p.originalInvoiceNo}</div>
                </div>
              ) : null}
            </td>
          </tr>
        </tbody>
      </table>

      {/* BILL FROM (supplier) / SHIP TO (us) */}
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <tbody>
          <tr>
            <td style={{ ...bd, width: "50%", verticalAlign: "top" }}>
              <div style={{ fontWeight: 700 }}>BILL FROM</div>
              <div style={{ fontWeight: 700 }}>{seller.name}</div>
              {seller.address ? <div><strong>Address:</strong> {seller.address}{supAddr ? `, ${supAddr}` : ""}</div> : null}
              {seller.gstin ? <div><strong>GSTIN:</strong> {seller.gstin}</div> : null}
              {placeOfSupply ? <div><strong>Place of Supply:</strong> {placeOfSupply}</div> : null}
              {seller.phone ? <div><strong>Mobile:</strong> {seller.phone}</div> : null}
              {seller.pan ? <div><strong>PAN:</strong> {seller.pan}</div> : null}
            </td>
            <td style={{ ...bd, verticalAlign: "top" }}>
              <div style={{ fontWeight: 700 }}>SHIP TO {warehouse.name ? `(${warehouse.name})` : ""}</div>
              {/* Recipient = our own company, pulled dynamically from Business Settings
                  (logo, name, address, GST, PAN). */}
              <div style={{ display: "flex", gap: 8, alignItems: "flex-start", marginTop: 2 }}>
                {buyer.logo ? (
                  <img src={imageUrl(buyer.logo)} alt="logo" style={{ height: 38, objectFit: "contain" }} />
                ) : null}
                <div>
                  <div style={{ fontWeight: 700 }}>{buyer.name}</div>
                  {buyer.address ? <div><strong>Address:</strong> {buyer.address}{buyerAddr ? `, ${buyerAddr}` : ""}</div> : null}
                  {buyer.gstin ? <div><strong>GSTIN:</strong> {buyer.gstin}</div> : null}
                  {buyer.pan ? <div><strong>PAN:</strong> {buyer.pan}</div> : null}
                  {c.phone ? <div><strong>Mobile:</strong> {c.phone}</div> : null}
                </div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      {/* Items */}
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
            <td style={bdRight}>₹ {num(p.grandTotal)}</td>
          </tr>
        </tbody>
      </table>

      {/* HSN tax breakdown */}
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
        <div>{numberToWords(p.grandTotal)}</div>
      </div>

      {/* Amount payable summary */}
      <table style={{ width: "100%", borderCollapse: "collapse", borderTop: "none" }}>
        <tbody>
          <tr>
            <td style={{ ...bd, width: "62%", verticalAlign: "top", padding: "8px 10px" }}>
              {p.notes ? (
                <>
                  <div style={{ fontWeight: 700, marginBottom: 4 }}>Notes</div>
                  <div>{p.notes}</div>
                </>
              ) : null}
              {p.terms ? (
                <>
                  <div style={{ fontWeight: 700, margin: "8px 0 4px" }}>Terms &amp; Conditions</div>
                  <div>{p.terms}</div>
                </>
              ) : null}
            </td>
            <td style={{ ...bd, verticalAlign: "top", padding: "8px 10px" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <tbody>
                  <tr>
                    <td style={{ color: "#555", padding: "2px 0" }}>Total Amount</td>
                    <td style={{ textAlign: "right", fontWeight: 700 }}>₹ {num(p.grandTotal)}</td>
                  </tr>
                  <tr>
                    <td style={{ color: "#555", padding: "2px 0" }}>Amount Paid</td>
                    <td style={{ textAlign: "right", fontWeight: 700 }}>₹ {num(p.amountPaid)}</td>
                  </tr>
                  <tr>
                    <td style={{ color: "#555", padding: "2px 0", borderTop: "1px solid #ddd" }}>Balance Due</td>
                    <td style={{ textAlign: "right", fontWeight: 800, borderTop: "1px solid #ddd" }}>
                      ₹ {num(Math.max((p.grandTotal || 0) - (p.amountPaid || 0), 0))}
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
