// Create Warehouse form. A warehouse is a Showroom document with type="warehouse".
// Reuses the showroom create hook and injects the type.
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader, Card, FormField, Button } from "../../../components";
import { useCreateShowroom } from "../../showrooms/hooks/useShowrooms";

const initial = {
  name: "",
  code: "",
  address: "",
  city: "",
  state: "",
  pincode: "",
  phone: "",
  email: "",
  gstin: "",
  status: "active",
};

export function WarehouseCreatePage() {
  const navigate = useNavigate();
  const createWarehouse = useCreateShowroom();
  const [form, setForm] = useState(initial);
  const [error, setError] = useState("");

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      // Mark this location as a warehouse.
      await createWarehouse.mutateAsync({ ...form, type: "warehouse" });
      navigate("/warehouses");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create warehouse.");
    }
  }

  return (
    <div>
      <PageHeader title="Create Warehouse" subtitle="Add a stock-holding location" />
      <Card>
        <form onSubmit={handleSubmit}>
          <div className="form-section__title">Basic Information</div>
          <div className="form-grid">
            <FormField label="Warehouse Name *" htmlFor="name">
              <input id="name" value={form.name} onChange={set("name")} required />
            </FormField>
            <FormField label="Code *" htmlFor="code">
              <input id="code" value={form.code} onChange={set("code")} placeholder="WH-001" required />
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
            <FormField label="Status" htmlFor="status">
              <select id="status" value={form.status} onChange={set("status")}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </FormField>
          </div>

          {error && <p style={{ color: "var(--color-danger)" }}>{error}</p>}

          <div className="form-actions">
            <Button type="button" variant="secondary" onClick={() => navigate("/warehouses")}>
              Cancel
            </Button>
            <Button type="submit" disabled={createWarehouse.isPending}>
              {createWarehouse.isPending ? "Creating..." : "Create Warehouse"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

export default WarehouseCreatePage;
