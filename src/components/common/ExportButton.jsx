// Reusable "Export" button. Downloads the given rows as a CSV (opens in Excel) using
// the provided column definitions: [{ header, value: (row) => any }].
import Button from "./Button";
import { exportToCSV } from "../../utils/csv";

export function ExportButton({ rows = [], columns = [], filename = "export.csv", label = "Export", disabled }) {
  function handleExport() {
    if (!rows.length) return;
    exportToCSV(filename, rows, columns);
  }
  return (
    <Button variant="secondary" onClick={handleExport} disabled={disabled || rows.length === 0}>
      {label}
    </Button>
  );
}

export default ExportButton;
