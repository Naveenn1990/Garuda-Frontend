// Create Showroom form. Captures the fields required by the SOW (name, code, address,
// contact, GST, operating details). On success it navigates to the new showroom's
// detail page (per spec: don't just show a toast, go to the detail view).
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader, Card, FormField, Button } from "../../../components";
import { useCreateShowroom } from "../hooks/useShowrooms";
import CoordinatePicker from "../components/CoordinatePicker";

const initial = {
  name: "",
  code: "",
  address: "",
  city: "",
  state: "",
  pincode: "",
  lat: "",
  lng: "",
  phone: "",
  email: "",
  gstin: "",
  openingTime: "",
  closingTime: "",
  status: "active",
};

export function ShowroomCreatePage() {
  const navigate = useNavigate();
  const createShowroom = useCreateShowroom();
  const [form, setForm] = useState(initial);
  const [error, setError] = useState("");

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      const res = await createShowroom.mutateAsync(form);
      const id = res?.item?._id;
      navigate(id ? `/showrooms/${id}` : "/showrooms");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create showroom.");
    }
  }

  return (
    <div>
      <PageHeader title="Create Showroom" subtitle="Add a new retail location" />
      <Card>
        <form onSubmit={handleSubmit}>
          <div className="form-section__title">Basic Information</div>
          <div className="form-grid">
            <FormField label="Showroom Name *" htmlFor="name">
              <input id="name" value={form.name} onChange={set("name")} required />
            </FormField>
            <FormField label="Code *" htmlFor="code">
              <input id="code" value={form.code} onChange={set("code")} placeholder="BLR-001" required />
            </FormField>
          </div>
          <FormField label="Address" htmlFor="address">
            <input id="address" value={form.address} onChange={set("address")} />
          </FormField>
          <div className="form-grid">
            <FormField label="City *" htmlFor="city">
              <input id="city" value={form.city} onChange={set("city")} required />
            </FormField>
            <FormField label="State *" htmlFor="state">
              <input id="state" value={form.state} onChange={set("state")} required />
            </FormField>
            <FormField label="Pincode" htmlFor="pincode">
              <input id="pincode" value={form.pincode} onChange={set("pincode")} />
            </FormField>
          </div>

          <div className="form-section__title">Map Coordinates</div>
          <p style={{ fontSize: "0.85rem", color: "var(--color-text-muted)", margin: "0 0 12px" }}>
            Set the map pin for this showroom — customers use this to find the nearest store.
          </p>
          <CoordinatePicker
            lat={form.lat}
            lng={form.lng}
            onChange={({ lat, lng }) => setForm((f) => ({ ...f, lat, lng }))}
          />

          <div className="form-section__title">Contact Information</div>
          <div className="form-grid">
            <FormField label="Phone" htmlFor="phone">
              <input id="phone" value={form.phone} onChange={set("phone")} />
            </FormField>
            <FormField label="Email" htmlFor="email">
              <input id="email" type="email" value={form.email} onChange={set("email")} />
            </FormField>
          </div>

          <div className="form-section__title">Business Information</div>
          <div className="form-grid">
            <FormField label="GSTIN" htmlFor="gstin">
              <input id="gstin" value={form.gstin} onChange={set("gstin")} />
            </FormField>
          </div>

          <div className="form-section__title">Operating Details</div>
          <div className="form-grid">
            <FormField label="Opening Time" htmlFor="openingTime">
              <input id="openingTime" value={form.openingTime} onChange={set("openingTime")} placeholder="10:00 AM" />
            </FormField>
            <FormField label="Closing Time" htmlFor="closingTime">
              <input id="closingTime" value={form.closingTime} onChange={set("closingTime")} placeholder="08:00 PM" />
            </FormField>
            <FormField label="Status" htmlFor="status">
              <select id="status" value={form.status} onChange={set("status")}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </FormField>
          </div>

          {error && <p style={{ color: "var(--color-danger)" }}>{error}</p>}

          <div className="form-actions">
            <Button type="button" variant="secondary" onClick={() => navigate("/showrooms")}>
              Cancel
            </Button>
            <Button type="submit" disabled={createShowroom.isPending}>
              {createShowroom.isPending ? "Creating..." : "Create Showroom"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

export default ShowroomCreatePage;
