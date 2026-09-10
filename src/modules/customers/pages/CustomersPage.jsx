// Customers list page. Search + Add Customer; rows link to the detail (360) page.
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader, DataTable, Button, Spinner, BulkUpload, ExportButton } from "../../../components";
import { usePermissions } from "../../../app/store/permissionStore";
import { useCustomers, useBulkCustomers } from "../hooks/useCustomers";

const CUSTOMER_HEADERS = ["name", "mobile", "email", "city", "state", "segment", "showroomCode"];
const CUSTOMER_SAMPLE = ["Priya Rao", "9000000001", "priya@test.com", "Bangalore", "Karnataka", "new", "BLR-001"];

// Columns for CSV export.
const EXPORT_COLUMNS = [
  { header: "Name", value: (r) => r.name },
  { header: "Mobile", value: (r) => r.mobile },
  { header: "Email", value: (r) => r.email || "" },
  { header: "Segment", value: (r) => r.segment },
  { header: "Source", value: (r) => r.source },
  { header: "Showroom", value: (r) => r.assignedShowroom?.code || "" },
  { header: "Status", value: (r) => r.status },
];

export function CustomersPage() {
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const [q, setQ] = useState("");
  const [bulkOpen, setBulkOpen] = useState(false);
  const bulkCustomers = useBulkCustomers();
  const { data: rows = [], isLoading, isError } = useCustomers(q ? { q } : {});

  const columns = [
    { key: "name", header: "Name" },
    { key: "mobile", header: "Mobile" },
    { key: "email", header: "Email", render: (r) => r.email || "—" },
    { key: "segment", header: "Segment", render: (r) => r.segment },
    { key: "source", header: "Source", render: (r) => r.source },
    {
      key: "status",
      header: "Status",
      render: (r) => <span className={`badge badge--${r.status}`}>{r.status}</span>,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Customers"
        subtitle="Manage customer records"
        actions={
          <div style={{ display: "flex", gap: 8 }}>
            <ExportButton rows={rows} columns={EXPORT_COLUMNS} filename="customers.csv" />
            {hasPermission("customers.create") && (
              <>
                <Button variant="secondary" onClick={() => setBulkOpen(true)}>Bulk Upload</Button>
                <Button onClick={() => navigate("/customers/create")}>+ Add Customer</Button>
              </>
            )}
          </div>
        }
      />
      <div style={{ marginBottom: 16 }}>
        <input
          className="search-input"
          placeholder="Search by name, mobile or email..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>
      {isLoading ? (
        <Spinner />
      ) : isError ? (
        <p style={{ color: "var(--color-danger)" }}>Failed to load customers. Is the API running?</p>
      ) : (
        <DataTable
          columns={columns}
          rows={rows}
          emptyText="No customers yet."
          onRowClick={(row) => navigate(`/customers/${row._id}`)}
        />
      )}

      <BulkUpload
        open={bulkOpen}
        onClose={() => setBulkOpen(false)}
        title="Bulk Upload Customers"
        headers={CUSTOMER_HEADERS}
        sampleRow={CUSTOMER_SAMPLE}
        templateName="customers-template.csv"
        onUpload={(rows) => bulkCustomers.mutateAsync(rows)}
      />
    </div>
  );
}

export default CustomersPage;
