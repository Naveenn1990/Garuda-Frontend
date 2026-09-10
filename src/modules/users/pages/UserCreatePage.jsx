// Create User page. Personal + login info, a role dropdown (from the roles API) and
// showroom-access checkboxes (from the showrooms API). Establishes the
// User -> Role(-> permissions) and User -> Showroom(access) relationships.
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader, Card, FormField, Button, Spinner } from "../../../components";
import { useRoles } from "../../roles/hooks/useRoles";
import { useShowrooms } from "../../showrooms/hooks/useShowrooms";
import { useCreateUser } from "../hooks/useUsers";

const initial = {
  name: "",
  mobile: "",
  email: "",
  username: "",
  password: "",
  role: "",
  status: "active",
};

export function UserCreatePage() {
  const navigate = useNavigate();
  const { data: roles = [], isLoading: rolesLoading } = useRoles();
  const { data: showrooms = [], isLoading: showroomsLoading } = useShowrooms();
  const createUser = useCreateUser();

  const [form, setForm] = useState(initial);
  const [showroomAccess, setShowroomAccess] = useState(() => new Set());
  const [error, setError] = useState("");

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  function toggleShowroom(id) {
    setShowroomAccess((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      await createUser.mutateAsync({
        ...form,
        showrooms: Array.from(showroomAccess),
      });
      navigate("/users");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create user.");
    }
  }

  if (rolesLoading || showroomsLoading) return <Spinner />;

  return (
    <div>
      <PageHeader title="Create User" subtitle="Add a system user with role and showroom access" />
      <Card>
        <form onSubmit={handleSubmit}>
          <div className="form-section__title">Personal Information</div>
          <div className="form-grid">
            <FormField label="Name *" htmlFor="name">
              <input id="name" value={form.name} onChange={set("name")} required />
            </FormField>
            <FormField label="Mobile *" htmlFor="mobile">
              <input id="mobile" value={form.mobile} onChange={set("mobile")} required />
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
            <FormField label="Password *" htmlFor="password">
              <input id="password" type="password" value={form.password} onChange={set("password")} required />
            </FormField>
            <FormField label="Role *" htmlFor="role">
              <select id="role" value={form.role} onChange={set("role")} required>
                <option value="">Select role</option>
                {roles.map((r) => (
                  <option key={r._id} value={r._id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </FormField>
          </div>

          <div className="form-section__title">Showroom Access</div>
          {showrooms.length === 0 ? (
            <p className="tab-empty">No showrooms yet. Create a showroom first, or leave empty for org-wide access.</p>
          ) : (
            <div className="perm-group__actions" style={{ padding: 0 }}>
              {showrooms.map((s) => (
                <label key={s._id} className="perm-action">
                  <input
                    type="checkbox"
                    checked={showroomAccess.has(s._id)}
                    onChange={() => toggleShowroom(s._id)}
                  />
                  {s.name} ({s.code})
                </label>
              ))}
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

          <div className="form-actions">
            <Button type="button" variant="secondary" onClick={() => navigate("/users")}>
              Cancel
            </Button>
            <Button type="submit" disabled={createUser.isPending}>
              {createUser.isPending ? "Creating..." : "Create User"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

export default UserCreatePage;
