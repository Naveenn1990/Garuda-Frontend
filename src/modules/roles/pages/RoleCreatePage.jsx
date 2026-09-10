// Create Role page. Renders a permission matrix from the catalog (module rows x
// action checkboxes) so permissions are data-driven, not hardcoded.
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader, Card, FormField, Button, Spinner } from "../../../components";
import { usePermissionCatalog, useCreateRole } from "../hooks/useRoles";
import "./RoleCreatePage.css";

export function RoleCreatePage() {
  const navigate = useNavigate();
  const { data: catalog = [], isLoading } = usePermissionCatalog();
  const createRole = useCreateRole();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selected, setSelected] = useState(() => new Set());
  const [error, setError] = useState("");

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
    try {
      await createRole.mutateAsync({
        name,
        description,
        permissions: Array.from(selected),
      });
      navigate("/roles");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create role.");
    }
  }

  if (isLoading) return <Spinner />;

  return (
    <div>
      <PageHeader title="Create Role" subtitle="Assign module and feature permissions" />
      <Card>
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

          <div className="form-actions">
            <Button type="button" variant="secondary" onClick={() => navigate("/roles")}>
              Cancel
            </Button>
            <Button type="submit" disabled={createRole.isPending}>
              {createRole.isPending ? "Saving..." : "Save Role"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

export default RoleCreatePage;
