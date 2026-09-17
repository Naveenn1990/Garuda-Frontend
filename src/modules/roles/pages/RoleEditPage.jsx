// Edit Role page. Same permission matrix as create, pre-filled from the role.
// System roles (isSystem) can still have permissions tweaked but keep their name.
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { PageHeader, Card, FormField, Button, Spinner } from "../../../components";
import { usePermissionCatalog, useRole, useUpdateRole } from "../hooks/useRoles";
import "./RoleCreatePage.css";

export function RoleEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: catalog = [], isLoading: catalogLoading } = usePermissionCatalog();
  const { data: role, isLoading: roleLoading } = useRole(id);
  const updateRole = useUpdateRole(id);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selected, setSelected] = useState(() => new Set());
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!role) return;
    setName(role.name || "");
    setDescription(role.description || "");
    setSelected(new Set(role.permissions || []));
  }, [role]);

  function toggle(key) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

  function toggleModule(group, checked) {
    setSelected((prev) => {
      const next = new Set(prev);
      group.actions.forEach((a) => {
        const key = `${group.module}.${a}`;
        checked ? next.add(key) : next.delete(key);
      });
      return next;
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSaved(false);
    try {
      await updateRole.mutateAsync({
        name,
        description,
        permissions: Array.from(selected),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update role.");
    }
  }

  if (catalogLoading || roleLoading || !role) return <Spinner />;

  const isSuperAdmin = role.isSuperAdmin;

  return (
    <div>
      <PageHeader
        title={`Edit Role — ${role.name}`}
        subtitle={role.isSystem ? "System role" : "Custom role"}
        actions={<Button variant="secondary" onClick={() => navigate("/roles")}>← Back</Button>}
      />
      <Card>
        {isSuperAdmin ? (
          <p className="tab-empty">The Super Admin role has full access and cannot be edited.</p>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <FormField label="Role Name *" htmlFor="name">
                <input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
              </FormField>
              <FormField label="Description" htmlFor="desc">
                <input id="desc" value={description} onChange={(e) => setDescription(e.target.value)} />
              </FormField>
            </div>

            <div className="form-section__title">Permissions</div>
            <div className="perm-matrix">
              {catalog.map((group) => {
                const allChecked = group.actions.every((a) =>
                  selected.has(`${group.module}.${a}`)
                );
                return (
                  <div key={group.module} className="perm-group">
                    <div className="perm-group__head">
                      <label className="perm-group__title">
                        <input
                          type="checkbox"
                          checked={allChecked}
                          onChange={(e) => toggleModule(group, e.target.checked)}
                        />
                        {group.label}
                      </label>
                    </div>
                    <div className="perm-group__actions">
                      {group.actions.map((action) => {
                        const key = `${group.module}.${action}`;
                        return (
                          <label key={key} className="perm-action">
                            <input
                              type="checkbox"
                              checked={selected.has(key)}
                              onChange={() => toggle(key)}
                            />
                            {action}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {error && <p style={{ color: "var(--color-danger)" }}>{error}</p>}
            {saved && <p style={{ color: "var(--color-success, #2e7d32)" }}>Changes saved.</p>}

            <div className="form-actions">
              <Button type="button" variant="secondary" onClick={() => navigate("/roles")}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateRole.isPending}>
                {updateRole.isPending ? "Saving…" : "Save Changes"}
              </Button>
            </div>
          </form>
        )}
      </Card>
    </div>
  );
}

export default RoleEditPage;
