// Enquiry form: captures a customer enquiry which creates a lead in the CRM.
import { useState } from "react";
import { useSubmitEnquiry, useShopProducts } from "../hooks/useShop";

export function EnquiryPage() {
  const submit = useSubmitEnquiry();
  const { data } = useShopProducts({ limit: 60 });
  const products = data?.items || [];

  const [form, setForm] = useState({ name: "", mobile: "", email: "", product: "", message: "" });
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!form.name || !form.mobile) {
      setError("Please enter your name and mobile number.");
      return;
    }
    try {
      await submit.mutateAsync({
        ...form,
        product: form.product || undefined,
      });
      setDone(true);
    } catch (err) {
      setError(err.response?.data?.message || "Could not submit enquiry. Please try again.");
    }
  }

  if (done) {
    return (
      <div className="sf-empty">
        <h2>Thank you!</h2>
        <p>Your enquiry has been received. Our team will contact you shortly.</p>
      </div>
    );
  }

  return (
    <div className="sf-form">
      <h1>Enquiry</h1>
      <p style={{ color: "#6b6250" }}>
        Tell us what you're looking for and we'll get in touch.
      </p>
      <form onSubmit={handleSubmit}>
        <label htmlFor="e-name">Name *</label>
        <input id="e-name" value={form.name} onChange={set("name")} required />

        <label htmlFor="e-mobile">Mobile *</label>
        <input id="e-mobile" value={form.mobile} onChange={set("mobile")} required />

        <label htmlFor="e-email">Email</label>
        <input id="e-email" type="email" value={form.email} onChange={set("email")} />

        <label htmlFor="e-product">Product of interest</label>
        <select id="e-product" value={form.product} onChange={set("product")}>
          <option value="">Select a product (optional)</option>
          {products.map((p) => (
            <option key={p._id} value={p._id}>{p.name}</option>
          ))}
        </select>

        <label htmlFor="e-message">Message</label>
        <textarea id="e-message" rows={4} value={form.message} onChange={set("message")} />

        {error && <p style={{ color: "#c0392b" }}>{error}</p>}

        <button className="sf-btn" style={{ marginTop: 16 }} type="submit" disabled={submit.isPending}>
          {submit.isPending ? "Submitting..." : "Submit Enquiry"}
        </button>
      </form>
    </div>
  );
}

export default EnquiryPage;
