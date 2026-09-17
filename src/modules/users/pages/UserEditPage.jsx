// Edit User page. Update role, showroom/warehouse access, and status. Password is
// optional here — leave blank to keep the existing one.
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { PageHeader, Card, FormField, Button, Spinner } from "../../../components";
import { useRoles } from "../../roles/hooks/useRoles";
import { useShowrooms } from "../../showrooms/hooks/useShowrooms";
import { useUser, useUpdateUser } from "../hooks/useUsers";

export function UserEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: user, isLoading: userLoading } = useUser(id);
  const { data: roles = [], isLoading: rolesLoading } = useRoles();
  const { data: showrooms = [], isLoading: showroomsLoading } = useShowrooms();
  const updateUser = useUpdateUser(id);

  const [form, setForm] = useState(null);
  const [showroomAccess, setShowroomAccess] = useState(() => new Set());
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  // Seed the form once the user loads.
  useEffect(() => {
    if (!user) return;
    setForm({
      name: user.name || "",
      mobile: user.mobile || "",
      email: user.email || "",
      username: user.username || "",
      password: "",
      role: user.role?._id || user.role || "",
      status: user.status || "active",
    });
    setShowroomAccess(new Set((user.showrooms || []).map((s) => String(s._id || s))));
  }, [user]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  function toggleShowroom(sid) {
    setShowroomAccess((prev) => {
      const next = new Set(prev);
      next.has(sid) ? next.delete(sid) : next.add(sid);
      return next;
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSaved(false);
    const payload = { ...form, showrooms: Array.from(showroomAccess) };
    if (!payload.password) delete payload.password; // keep existing password
    try {
      await updateUser.mutateAsync(payload);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update user.");
    }
  }

  if (userLoading || rolesLoading || showroomsLoading || !form) return <Spinner />;

  return (
    <div>
      <PageHeader
        title={`Edit User — ${user?.name || ""}`}
        subtitle="Update role, access and status"
        actions={<Button variant="secondary" onClick={() => navigate("/users")}>← Back</Button>}
      />
      <Card>
        <form onSubmit={handleSubmit}>
          <div className="form-section__title">Personal Information</div>
          <div className="form-grid">
            <FormField label="Name *" htmlFor="name">
              <input id="name" value={form.name} onChange={set("name")} required />
            </FormField>
            <FormField label="Mobile" htmlFor="mobile">
              <input id="mobile" value={form.mobile} onChange={set("mobile")} />
            </FormField>
            <FormField label="Email *" htmlFor="email">
              <input id="email" type="email" value={form.email} onChange={set("email")} required />
            </FormField>
          </div>

          <div className="form-section__title">Login Information</div>
          <div className="form-grid">
            <FormField label="Username" htmlFor="username">
              <input id="username" value={form.username} onChange={set("username")} />
            </FormField>
            <FormField label="New Password (blank = unchanged)" htmlFor="password">
              <input id="password" type="password" value={form.password} onChange={set("password")} placeholder="••••••••" />
            </FormField>
            <FormField label="Role *" htmlFor="role">
              <select id="role" value={form.role} onChange={set("role")} required>
                <option value="">Select role</option>
                {roles.map((r) => (
                  <option key={r._id} value={r._id}>{r.name}</option>
                ))}
              </select>
            </FormField>
          </div>

          <div className="form-section__title">Location Access</div>
          <p style={{ fontSize: "0.82rem", color: "var(--color-text-muted)", margin: "0 0 10px" }}>
            Tick the warehouses / showrooms this user can access. Leave all unticked for
            org-wide access (sees everything).
          </p>
          {showrooms.length === 0 ? (
            <p className="tab-empty">No locations yet.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {["warehouse", "showroom"].map((type) => {
                const list = showrooms.filter((s) => (s.type || "showroom") === type);
                if (list.length === 0) return null;
                return (
                  <div key={type}>
                    <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>
                      {type === "warehouse" ? "🏭 Warehouses" : "🏪 Showrooms"}
                    </div>
                    <div className="perm-group__actions" style={{ padding: 0 }}>
                      {list.map((s) => (
                        <label key={s._id} className="perm-action">
                          <input
                            type="checkbox"
                            checked={showroomAccess.has(String(s._id))}
                            onChange={() => toggleShowroom(String(s._id))}
                          />
                          {s.name} ({s.code})
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="form-section__title">Status</div>
          <div className="form-grid">
            <FormField label="Status" htmlFor="status">
              <select id="status" value={form.status} onChange={set("status")}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="blocked">Blocked</option>
              </select>
            </FormField>
          </div>

          {error && <p style={{ color: "var(--color-danger)" }}>{error}</p>}
          {saved && <p style={{ color: "var(--color-success, #2e7d32)" }}>Changes saved.</p>}

          <div className="form-actions">
            <Button type="button" variant="secondary" onClick={() => navigate("/users")}>Cancel</Button>
            <Button type="submit" disabled={updateUser.isPending}>
              {updateUser.isPending ? "Saving…" : "Save Changes"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

export default UserEditPage;
