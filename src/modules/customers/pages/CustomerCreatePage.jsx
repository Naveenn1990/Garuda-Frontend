// Create Customer form. Captures profile + assignment (showroom, salesperson) + segment.
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader, Card, FormField, Button, Spinner } from "../../../components";
import { useShowrooms } from "../../showrooms/hooks/useShowrooms";
import { useUsers } from "../../users/hooks/useUsers";
import { useCreateCustomer } from "../hooks/useCustomers";

const initial = {
  name: "",
  mobile: "",
  email: "",
  address: "",
  city: "",
  state: "",
  pincode: "",
  segment: "new",
  assignedShowroom: "",
  assignedSalesperson: "",
  status: "active",
};

export function CustomerCreatePage() {
  const navigate = useNavigate();
  const { data: showrooms = [], isLoading: sLoading } = useShowrooms({ type: "showroom" });
  const { data: users = [], isLoading: uLoading } = useUsers();
  const createCustomer = useCreateCustomer();

  const [form, setForm] = useState(initial);
  const [error, setError] = useState("");
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    const payload = {
      ...form,
      assignedShowroom: form.assignedShowroom || undefined,
      assignedSalesperson: form.assignedSalesperson || undefined,
    };
    try {
      const res = await createCustomer.mutateAsync(payload);
      navigate(res?.item?._id ? `/customers/${res.item._id}` : "/customers");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create customer.");
    }
  }

  if (sLoading || uLoading) return <Spinner />;

  return (
    <div>
      <PageHeader title="Create Customer" subtitle="Add a new customer record" />
      <Card>
        <form onSubmit={handleSubmit}>
          <div className="form-section__title">Basic Information</div>
          <div className="form-grid">
            <FormField label="Name *" htmlFor="name">
              <input id="name" value={form.name} onChange={set("name")} required />
            </FormField>
            <FormField label="Mobile *" htmlFor="mobile">
              <input id="mobile" value={form.mobile} onChange={set("mobile")} required />
            </FormField>
            <FormField label="Email" htmlFor="email">
              <input id="email" type="email" value={form.email} onChange={set("email")} />
            </FormField>
            <FormField label="Segment" htmlFor="segment">
              <select id="segment" value={form.segment} onChange={set("segment")}>
                <option value="new">New</option>
                <option value="existing">Existing</option>
                <option value="vip">VIP</option>
                <option value="inactive">Inactive</option>
              </select>
            </FormField>
          </div>

          <div className="form-section__title">Address</div>
          <FormField label="Address" htmlFor="address">
            <input id="address" value={form.address} onChange={set("address")} />
          </FormField>
          <div className="form-grid">
            <FormField label="City" htmlFor="city">
              <input id="city" value={form.city} onChange={set("city")} />
            </FormField>
            <FormField label="State" htmlFor="state">
              <input id="state" value={form.state} onChange={set("state")} />
            </FormField>
            <FormField label="Pincode" htmlFor="pincode">
              <input id="pincode" value={form.pincode} onChange={set("pincode")} />
            </FormField>
          </div>

          <div className="form-section__title">Assignment</div>
          <div className="form-grid">
            <FormField label="Assigned Showroom" htmlFor="assignedShowroom">
              <select id="assignedShowroom" value={form.assignedShowroom} onChange={set("assignedShowroom")}>
                <option value="">None</option>
                {showrooms.map((s) => (
                  <option key={s._id} value={s._id}>{s.name} ({s.code})</option>
                ))}
              </select>
            </FormField>
            <FormField label="Assigned Salesperson" htmlFor="assignedSalesperson">
              <select id="assignedSalesperson" value={form.assignedSalesperson} onChange={set("assignedSalesperson")}>
                <option value="">None</option>
                {users.map((u) => (
                  <option key={u._id} value={u._id}>{u.name}</option>
                ))}
              </select>
            </FormField>
            <FormField label="Status" htmlFor="status">
              <select id="status" value={form.status} onChange={set("status")}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="blocked">Blocked</option>
              </select>
            </FormField>
          </div>

          {error && <p style={{ color: "var(--color-danger)" }}>{error}</p>}

          <div className="form-actions">
            <Button type="button" variant="secondary" onClick={() => navigate("/customers")}>
              Cancel
            </Button>
            <Button type="submit" disabled={createCustomer.isPending}>
              {createCustomer.isPending ? "Creating..." : "Create Customer"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

export default CustomerCreatePage;
