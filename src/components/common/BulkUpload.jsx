// Reusable bulk-upload modal. Pick a CSV, preview parsed rows, upload via the provided
// `onUpload(rows)` function, and show the per-row results the backend returns.
//
// Props:
//   open, onClose
//   title
//   headers      - array of expected column names (for the template + preview)
//   sampleRow    - optional example values for the template
//   templateName - download filename
//   onUpload     - async (rows) => resultObject  (e.g. {created, updated, failed, errors})
import { useState } from "react";
import Modal from "../modals/Modal";
import Button from "./Button";
import { parseCSV, buildTemplate, downloadText } from "../../utils/csv";
import "./common.css";

export function BulkUpload({ open, onClose, title, headers = [], sampleRow = [], templateName = "template.csv", onUpload }) {
  const [rows, setRows] = useState([]);
  const [fileName, setFileName] = useState("");
  const [result, setResult] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  function reset() {
    setRows([]);
    setFileName("");
    setResult(null);
    setError("");
  }

  function handleClose() {
    reset();
    onClose();
  }

  function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setResult(null);
    setError("");
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = parseCSV(String(reader.result));
        setRows(parsed);
      } catch {
        setError("Could not parse this file. Make sure it's a valid CSV.");
      }
    };
    reader.readAsText(file);
  }

  async function handleUpload() {
    setUploading(true);
    setError("");
    try {
      const res = await onUpload(rows);
      setResult(res);
    } catch (err) {
      setError(err.response?.data?.message || "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  const okCount = result ? (result.created ?? 0) + (result.updated ?? 0) + (result.applied ?? 0) : 0;

  return (
    <Modal
      open={open}
      title={title}
      onClose={handleClose}
      footer={
        <>
          <Button variant="secondary" onClick={handleClose}>Close</Button>
          {!result && (
            <Button onClick={handleUpload} disabled={rows.length === 0 || uploading}>
              {uploading ? "Uploading..." : `Upload ${rows.length || ""} rows`}
            </Button>
          )}
        </>
      }
    >
      <div className="bulk">
        <p className="bulk__hint">
          Upload a CSV with columns: <code>{headers.join(", ")}</code>
        </p>
        <Button
          variant="secondary"
          type="button"
          onClick={() => downloadText(templateName, buildTemplate(headers, sampleRow))}
        >
          Download template
        </Button>

        <div className="bulk__file">
          <input type="file" accept=".csv,text/csv" onChange={handleFile} />
          {fileName && <span className="bulk__filename">{fileName}</span>}
        </div>

        {error && <p style={{ color: "var(--color-danger)" }}>{error}</p>}

        {/* Preview */}
        {rows.length > 0 && !result && (
          <div className="bulk__preview">
            <div className="bulk__preview-title">{rows.length} rows ready</div>
            <div className="data-table__wrap">
              <table className="data-table">
                <thead>
                  <tr>{headers.map((h) => <th key={h}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {rows.slice(0, 5).map((r, i) => (
                    <tr key={i}>{headers.map((h) => <td key={h}>{r[h]}</td>)}</tr>
                  ))}
                </tbody>
              </table>
            </div>
            {rows.length > 5 && <div className="bulk__more">…and {rows.length - 5} more</div>}
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="bulk__result">
            <p><strong>{okCount}</strong> rows processed successfully, <strong>{result.failed ?? 0}</strong> failed.</p>
            {result.errors?.length > 0 && (
              <ul className="bulk__errors">
                {result.errors.slice(0, 10).map((e, i) => (
                  <li key={i}>Row {e.row}{e.sku ? ` (${e.sku})` : ""}: {e.message}</li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}

export default BulkUpload;
