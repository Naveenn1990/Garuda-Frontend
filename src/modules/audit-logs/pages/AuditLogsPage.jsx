// Audit Logs list page. Fetches records via useAuditLogs and renders them in a table.
// Columns and the create form are intentionally minimal placeholders to be filled
// in when this module is built out.
import { PageHeader, DataTable, Button, Spinner } from "../../../components";
import { useAuditLogs } from "../hooks/useAuditLogs";

const columns = [
  { key: "id", header: "ID" },
  { key: "name", header: "Name" },
  { key: "createdAt", header: "Created" },
];

export function AuditLogsPage() {
  const { data, isLoading, isError } = useAuditLogs();
  const rows = Array.isArray(data) ? data : data?.items ?? [];

  return (
    <div>
      <PageHeader
        title="Audit Logs"
        actions={<Button>New</Button>}
      />
      {isLoading ? (
        <Spinner />
      ) : isError ? (
        <p style={{ color: "#b91c1c" }}>Failed to load Audit Logs. Is the API running?</p>
      ) : (
        <DataTable columns={columns} rows={rows} emptyText="No records yet." />
      )}
    </div>
  );
}

export default AuditLogsPage;
