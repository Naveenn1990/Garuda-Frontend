// Deliveries page. List deliveries with an inline status update, and schedule a new
// delivery for an order via a modal.
import { useState } from "react";
import { PageHeader, Card, Button, Spinner, Modal, FormField } from "../../../components";
import { usePermissions } from "../../../app/store/permissionStore";
import { useOrders } from "../../orders/hooks/useOrders";
import { useDeliveries, useCreateDelivery, useUpdateDelivery } from "../hooks/useDeliveries";

const STATUSES = ["pending", "scheduled", "dispatched", "delivered", "failed"];

export function DeliveriesPage() {
  const { hasPermission } = usePermissions();
  const { data: rows = [], isLoading, isError } = useDeliveries();
  const { data: orders = [] } = useOrders();
  const createDelivery = useCreateDelivery();
  const updateDelivery = useUpdateDelivery();

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ order: "", scheduledDate: "", address: "" });
  const [error, setError] = useState("");

  async function handleCreate(e) {
    e.preventDefault();
    setError("");
    try {
      await createDelivery.mutateAsync({
        order: form.order,
        scheduledDate: form.scheduledDate || undefined,
        address: form.address || undefined,
      });
      setForm({ order: "", scheduledDate: "", address: "" });
      setOpen(false);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create delivery.");
    }
  }

  async function handleStatus(id, status) {
    try {
      await updateDelivery.mutateAsync({ id, status });
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update.");
    }
  }

  return (
    <div>
      <PageHeader
        title="Deliveries"
        subtitle="Schedule and track order deliveries"
        actions={hasPermission("deliveries.create") && <Button onClick={() => setOpen(true)}>+ Schedule Delivery</Button>}
      />

      {isLoading ? (
        <Spinner />
      ) : isError ? (
        <p style={{ color: "var(--color-danger)" }}>Failed to load deliveries. Is the API running?</p>
      ) : (
        <Card>
          <div className="data-table__wrap" style={{ border: "none" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Scheduled</th>
                  <th>Address</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr><td className="data-table__empty" colSpan={5}>No deliveries yet.</td></tr>
                ) : (
                  rows.map((d) => (
                    <tr key={d._id}>
                      <td>{d.order?.number || "—"}</td>
                      <td>{d.customer?.name || "—"}</td>
                      <td>{d.scheduledDate ? new Date(d.scheduledDate).toLocaleDateString() : "—"}</td>
                      <td>{d.address || "—"}</td>
                      <td>
                        <select
                          className="lead-stage-select"
                          value={d.status}
                          onChange={(e) => handleStatus(d._id, e.target.value)}
                          disabled={!hasPermission("deliveries.edit")}
                        >
                          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Modal
        open={open}
        title="Schedule Delivery"
        onClose={() => setOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={createDelivery.isPending}>
              {createDelivery.isPending ? "Saving..." : "Schedule"}
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreate}>
          <FormField label="Order *" htmlFor="d-order">
            <select id="d-order" value={form.order} onChange={(e) => setForm({ ...form, order: e.target.value })} required>
              <option value="">Select order</option>
              {orders.map((o) => <option key={o._id} value={o._id}>{o.number} — {o.customer?.name}</option>)}
            </select>
          </FormField>
          <FormField label="Scheduled Date" htmlFor="d-date">
            <input id="d-date" type="date" value={form.scheduledDate} onChange={(e) => setForm({ ...form, scheduledDate: e.target.value })} />
          </FormField>
          <FormField label="Address" htmlFor="d-address">
            <input id="d-address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </FormField>
          {error && <p style={{ color: "var(--color-danger)" }}>{error}</p>}
        </form>
      </Modal>
    </div>
  );
}

export default DeliveriesPage;
