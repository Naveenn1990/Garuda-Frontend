// Create Quotation. Pick a customer, add product line items (qty/price/discount/gst),
// and see a live total. The backend recomputes and stores the authoritative totals.
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader, Card, FormField, Button, Spinner } from "../../../components";
import { useCustomers } from "../../customers/hooks/useCustomers";
import { useProducts } from "../../products/hooks/useProducts";
import { useCreateQuotation } from "../hooks/useQuotations";

const inr = (n) => `₹${(Number(n) || 0).toLocaleString("en-IN")}`;

function emptyLine() {
  return { product: "", name: "", quantity: 1, price: 0, discount: 0, gst: 0 };
}

export function QuotationCreatePage() {
  const navigate = useNavigate();
  const { data: customers = [], isLoading: cLoading } = useCustomers();
  const { data: products = [], isLoading: pLoading } = useProducts();
  const createQuotation = useCreateQuotation();

  const [customer, setCustomer] = useState("");
  const [lines, setLines] = useState([emptyLine()]);
  const [error, setError] = useState("");

  function updateLine(i, patch) {
    setLines((prev) => prev.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  }

  // When a product is picked, prefill its price/discount/gst/name.
  function onPickProduct(i, productId) {
    const p = products.find((x) => x._id === productId);
    updateLine(i, {
      product: productId,
      name: p?.name || "",
      price: p?.sellingPrice || 0,
      discount: p?.discount || 0,
      gst: p?.gst || 0,
    });
  }

  // Live totals (mirrors the backend formula).
  const totals = lines.reduce(
    (acc, l) => {
      const base = (Number(l.price) || 0) * (Number(l.quantity) || 0);
      const disc = Number(l.discount) || 0;
      const taxable = Math.max(base - disc, 0);
      const tax = (taxable * (Number(l.gst) || 0)) / 100;
      acc.subtotal += base;
      acc.discount += disc;
      acc.tax += tax;
      return acc;
    },
    { subtotal: 0, discount: 0, tax: 0 }
  );
  const grandTotal = Math.max(totals.subtotal - totals.discount, 0) + totals.tax;

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      await createQuotation.mutateAsync({
        customer,
        items: lines
          .filter((l) => l.product)
          .map((l) => ({
            product: l.product,
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
    <div>
      <PageHeader title="New Quotation" subtitle="Build a price offer for a customer" />
      <Card>
        <form onSubmit={handleSubmit}>
          <FormField label="Customer *" htmlFor="q-customer">
            <select id="q-customer" value={customer} onChange={(e) => setCustomer(e.target.value)} required>
              <option value="">Select customer</option>
              {customers.map((c) => (
                <option key={c._id} value={c._id}>{c.name} ({c.mobile})</option>
              ))}
            </select>
          </FormField>

          <div className="form-section__title">Items</div>
          <div className="data-table__wrap" style={{ border: "1px solid var(--color-border)" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Qty</th>
                  <th>Price</th>
                  <th>Discount</th>
                  <th>GST %</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {lines.map((l, i) => (
                  <tr key={i}>
                    <td>
                      <select value={l.product} onChange={(e) => onPickProduct(i, e.target.value)} className="lead-stage-select" style={{ textTransform: "none" }}>
                        <option value="">Select</option>
                        {products.map((p) => (
                          <option key={p._id} value={p._id}>{p.name}</option>
                        ))}
                      </select>
                    </td>
                    <td><input type="number" min="1" value={l.quantity} onChange={(e) => updateLine(i, { quantity: e.target.value })} style={{ width: 60 }} /></td>
                    <td><input type="number" min="0" value={l.price} onChange={(e) => updateLine(i, { price: e.target.value })} style={{ width: 90 }} /></td>
                    <td><input type="number" min="0" value={l.discount} onChange={(e) => updateLine(i, { discount: e.target.value })} style={{ width: 90 }} /></td>
                    <td><input type="number" min="0" value={l.gst} onChange={(e) => updateLine(i, { gst: e.target.value })} style={{ width: 60 }} /></td>
                    <td>
                      {lines.length > 1 && (
                        <Button variant="secondary" type="button" onClick={() => setLines(lines.filter((_, idx) => idx !== i))}>×</Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ marginTop: 12 }}>
            <Button variant="secondary" type="button" onClick={() => setLines([...lines, emptyLine()])}>
              + Add Item
            </Button>
          </div>

          <div className="quote-totals">
            <div><span>Subtotal</span><strong>{inr(totals.subtotal)}</strong></div>
            <div><span>Discount</span><strong>- {inr(totals.discount)}</strong></div>
            <div><span>Tax</span><strong>{inr(totals.tax)}</strong></div>
            <div className="quote-totals__grand"><span>Grand Total</span><strong>{inr(grandTotal)}</strong></div>
          </div>

          {error && <p style={{ color: "var(--color-danger)" }}>{error}</p>}

          <div className="form-actions">
            <Button type="button" variant="secondary" onClick={() => navigate("/quotations")}>Cancel</Button>
            <Button type="submit" disabled={createQuotation.isPending}>
              {createQuotation.isPending ? "Saving..." : "Create Quotation"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

export default QuotationCreatePage;
