// Notifications list page. Fetches records via useNotifications and renders them in a table.
// Columns and the create form are intentionally minimal placeholders to be filled
// in when this module is built out.
import { PageHeader, DataTable, Button, Spinner } from "../../../components";
import { useNotifications } from "../hooks/useNotifications";

const columns = [
  { key: "id", header: "ID" },
  { key: "name", header: "Name" },
  { key: "createdAt", header: "Created" },
];

export function NotificationsPage() {
  const { data, isLoading, isError } = useNotifications();
  const rows = Array.isArray(data) ? data : data?.items ?? [];

  return (
    <div>
      <PageHeader
        title="Notifications"
        actions={<Button>New</Button>}
      />
      {isLoading ? (
        <Spinner />
      ) : isError ? (
        <p style={{ color: "#b91c1c" }}>Failed to load Notifications. Is the API running?</p>
      ) : (
        <DataTable columns={columns} rows={rows} emptyText="No records yet." />
      )}
    </div>
  );
}

export default NotificationsPage;
