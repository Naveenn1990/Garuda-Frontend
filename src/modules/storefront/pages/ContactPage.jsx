// Contact Us - shows contact info + showrooms, and a message form that creates a
// CRM lead (reusing the enquiry endpoint).
import { useState } from "react";
import { FiMapPin, FiPhone, FiMail } from "react-icons/fi";
import { useSubmitEnquiry, useStoreLocations } from "../hooks/useShop";

export function ContactPage() {
  const submit = useSubmitEnquiry();
  const { data: stores = [] } = useStoreLocations();
  const [form, setForm] = useState({ name: "", mobile: "", email: "", message: "" });
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!form.name || !form.mobile) return setError("Please enter your name and mobile.");
    try {
      await submit.mutateAsync(form);
      setDone(true);
    } catch (err) {
      setError(err.response?.data?.message || "Could not send your message.");
    }
  }

  return (
    <div className="sf-static">
      <h1>Contact Us</h1>
      <p className="sf-static__lead">
        Have a question or need help choosing a product? Reach out, we're happy to help.
      </p>

      <div className="sf-contact">
        {/* Left: contact info + stores */}
        <div>
          <div className="sf-contact__info">
            <div><FiPhone /> <span>+91 90000 00000</span></div>
            <div><FiMail /> <span>support@garudainternational.com</span></div>
          </div>

          {stores.length > 0 && (
            <>
              <h3 style={{ marginTop: 24 }}>Our Showrooms</h3>
              <div className="sf-stores" style={{ marginTop: 12 }}>
                {stores.map((s) => (
                  <div className="sf-store" key={s._id}>
                    <h3><FiMapPin /> {s.name}</h3>
                    {s.address && <p>{s.address}</p>}
                    <p>{[s.city, s.state, s.pincode].filter(Boolean).join(", ")}</p>
                    {s.phone && <p>📞 {s.phone}</p>}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Right: message form */}
        <div className="sf-contact__form">
          {done ? (
            <div className="sf-empty" style={{ padding: "30px 0" }}>
              <h3>Thank you!</h3>
              <p>Your message has been received. Our team will contact you shortly.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <h3>Send us a message</h3>
              <label>Name *</label>
              <input value={form.name} onChange={set("name")} required />
              <label>Mobile *</label>
              <input value={form.mobile} onChange={set("mobile")} required />
              <label>Email</label>
              <input type="email" value={form.email} onChange={set("email")} />
              <label>Message</label>
              <textarea rows={4} value={form.message} onChange={set("message")} />
              {error && <p className="sf-auth__error">{error}</p>}
              <button className="sf-btn sf-btn--dark" type="submit" disabled={submit.isPending} style={{ marginTop: 14 }}>
                {submit.isPending ? "Sending..." : "Send Message"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default ContactPage;
