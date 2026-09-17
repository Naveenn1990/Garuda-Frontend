// Parties / Customers list page with myBillBook architecture & KPIs
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader, DataTable, Button, Spinner, BulkUpload, ExportButton } from "../../../components";
import { usePermissions } from "../../../app/store/permissionStore";
import { useUI } from "../../../app/store/uiStore";
import { useCustomers, useBulkCustomers } from "../hooks/useCustomers";
import { FiUsers, FiArrowDownLeft, FiArrowUpRight, FiMessageCircle } from "react-icons/fi";

const CUSTOMER_HEADERS = ["name", "mobile", "email", "city", "state", "segment", "showroomCode"];
const CUSTOMER_SAMPLE = ["Priya Rao", "9000000001", "priya@test.com", "Bangalore", "Karnataka", "new", "BLR-001"];

const EXPORT_COLUMNS = [
  { header: "Party Name", value: (r) => r.name },
  { header: "Type", value: (r) => r.partyType || "customer" },
  { header: "Mobile", value: (r) => r.mobile },
  { header: "GSTIN", value: (r) => r.gstin || "" },
  { header: "Balance", value: (r) => r.openingBalance || 0 },
  { header: "City", value: (r) => r.city || "" },
  { header: "Status", value: (r) => r.status },
];

export function CustomersPage() {
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const { openPartyModal } = useUI();
  const [q, setQ] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [bulkOpen, setBulkOpen] = useState(false);
  const bulkCustomers = useBulkCustomers();
  const { data: rawRows = [], isLoading, isError } = useCustomers(q ? { q } : {});

  const rows = rawRows.filter((r) => {
    if (filterType === "all") return true;
    return (r.partyType || "customer") === filterType;
  });

  const totalCollect = rawRows
    .filter((r) => (r.balanceType || "to_collect") === "to_collect")
    .reduce((sum, r) => sum + (Number(r.openingBalance) || 0), 0);

  const totalPay = rawRows
    .filter((r) => r.balanceType === "to_pay")
    .reduce((sum, r) => sum + (Number(r.openingBalance) || 0), 0);

  const columns = [
    {
      key: "name",
      header: "Party Name",
      render: (r) => (
        <div>
          <div style={{ fontWeight: 700, color: "#1c1b17" }}>{r.name}</div>
          {r.gstin && (
            <div style={{ fontSize: "0.76rem", color: "#8c826c", fontWeight: 600 }}>
              GST: {r.gstin}
            </div>
          )}
        </div>
      ),
    },
    {
      key: "partyType",
      header: "Type",
      render: (r) => (
        <span
          style={{
            padding: "3px 8px",
            borderRadius: "6px",
            fontSize: "0.78rem",
            fontWeight: 700,
            textTransform: "capitalize",
            background: r.partyType === "supplier" ? "#fef3c7" : "#eff6ff",
            color: r.partyType === "supplier" ? "#92400e" : "#1e40af",
          }}
        >
          {r.partyType || "Customer"}
        </span>
      ),
    },
    { key: "mobile", header: "Mobile Number" },
    {
      key: "openingBalance",
      header: "Balance",
      render: (r) => {
        const bal = Number(r.openingBalance) || 0;
        const isToCollect = (r.balanceType || "to_collect") === "to_collect";
        return (
          <div style={{ fontWeight: 700, color: isToCollect ? "#16a34a" : "#dc2626" }}>
            {isToCollect ? "↓" : "↑"} ₹ {bal.toLocaleString("en-IN")}
          </div>
        );
      },
    },
    {
      key: "actions",
      header: "Actions",
      render: (r) => (
        <div style={{ display: "flex", gap: 6 }} onClick={(e) => e.stopPropagation()}>
          {r.mobile && (
            <a
              href={`https://wa.me/91${r.mobile.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
                `Hello ${r.name}, greeting from Garuda Retail!`
              )}`}
              target="_blank"
              rel="noreferrer"
              title="WhatsApp Party"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: 28,
                height: 28,
                borderRadius: "50%",
                background: "#25d366",
                color: "#fff",
                textDecoration: "none",
                fontSize: "0.95rem",
              }}
            >
              <FiMessageCircle />
            </a>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      {/* Top KPI Cards (Screenshot 2 Architecture) */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 20 }}>
        <div
          onClick={() => setFilterType("all")}
          style={{
            background: filterType === "all" ? "#fff6dc" : "#ffffff",
            border: `1px solid ${filterType === "all" ? "#c68629" : "#e8dfc7"}`,
            borderRadius: 12,
            padding: "16px 20px",
            cursor: "pointer",
            boxShadow: "0 2px 6px rgba(0,0,0,0.03)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#787163", fontSize: "0.85rem", fontWeight: 700 }}>
            <FiUsers style={{ color: "#c68629" }} />
            <span>All Parties</span>
          </div>
          <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "#1c1b17", marginTop: 6 }}>
            {rawRows.length}
          </div>
        </div>

        <div
          onClick={() => setFilterType("customer")}
          style={{
            background: filterType === "customer" ? "#ecfdf5" : "#ffffff",
            border: `1px solid ${filterType === "customer" ? "#10b981" : "#e8dfc7"}`,
            borderRadius: 12,
            padding: "16px 20px",
            cursor: "pointer",
            boxShadow: "0 2px 6px rgba(0,0,0,0.03)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#15803d", fontSize: "0.85rem", fontWeight: 700 }}>
            <FiArrowDownLeft />
            <span>To Collect (Receivables)</span>
          </div>
          <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "#16a34a", marginTop: 6 }}>
            ₹ {totalCollect.toLocaleString("en-IN")}
          </div>
        </div>

        <div
          onClick={() => setFilterType("supplier")}
          style={{
            background: filterType === "supplier" ? "#fff1f2" : "#ffffff",
            border: `1px solid ${filterType === "supplier" ? "#f43f5e" : "#e8dfc7"}`,
            borderRadius: 12,
            padding: "16px 20px",
            cursor: "pointer",
            boxShadow: "0 2px 6px rgba(0,0,0,0.03)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#be123c", fontSize: "0.85rem", fontWeight: 700 }}>
            <FiArrowUpRight />
            <span>To Pay (Payables)</span>
          </div>
          <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "#e11d48", marginTop: 6 }}>
            ₹ {totalPay.toLocaleString("en-IN")}
          </div>
        </div>
      </div>

      <PageHeader
        title="Parties & Customers"
        subtitle="Manage customer and vendor ledger accounts"
        actions={
          <div style={{ display: "flex", gap: 8 }}>
            <ExportButton rows={rows} columns={EXPORT_COLUMNS} filename="parties.csv" />
            {hasPermission("customers.create") && (
              <>
                <Button variant="secondary" onClick={() => setBulkOpen(true)}>
                  Bulk Upload
                </Button>
                <Button onClick={() => openPartyModal()}>+ Create Party</Button>
              </>
            )}
          </div>
        }
      />

      <div style={{ marginBottom: 16 }}>
        <input
          className="search-input"
          placeholder="Search party by name, mobile or GSTIN..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {isLoading ? (
        <Spinner />
      ) : isError ? (
        <p style={{ color: "var(--color-danger)" }}>Failed to load parties. Is the API running?</p>
      ) : (
        <DataTable
          columns={columns}
          rows={rows}
          emptyText="No parties found."
          onRowClick={(row) => navigate(`/customers/${row._id}`)}
        />
      )}

      <BulkUpload
        open={bulkOpen}
        onClose={() => setBulkOpen(false)}
        title="Bulk Upload Parties"
        headers={CUSTOMER_HEADERS}
        sampleRow={CUSTOMER_SAMPLE}
        templateName="parties-template.csv"
        onUpload={(rows) => bulkCustomers.mutateAsync(rows)}
      />
    </div>
  );
}

export default CustomersPage;

