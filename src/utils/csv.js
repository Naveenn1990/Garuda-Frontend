// Minimal CSV helpers. Handles quoted fields, commas inside quotes, and CRLF. Good
// enough for the bulk-upload templates we generate (no nested quotes/newlines).

// Parse CSV text into an array of row objects keyed by the header row.
export function parseCSV(text) {
  const rows = splitRows(text.trim());
  if (rows.length === 0) return [];
  const headers = parseLine(rows[0]).map((h) => h.trim());
  return rows.slice(1).map((line) => {
    const cells = parseLine(line);
    const obj = {};
    headers.forEach((h, i) => {
      obj[h] = (cells[i] ?? "").trim();
    });
    return obj;
  });
}

// Split into lines, respecting quotes (a quoted field may contain commas but we keep
// it simple: no embedded newlines in our templates).
function splitRows(text) {
  return text.split(/\r?\n/).filter((l) => l.trim().length > 0);
}

// Parse a single CSV line into an array of cell strings.
function parseLine(line) {
  const cells = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      cells.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  cells.push(cur);
  return cells;
}

// Build a CSV string from headers (used for downloadable templates).
export function buildTemplate(headers, sampleRow = []) {
  const lines = [headers.join(",")];
  if (sampleRow.length) lines.push(sampleRow.join(","));
  return lines.join("\n");
}

// Escape a single CSV cell (wrap in quotes if it contains comma/quote/newline).
function escapeCell(value) {
  const s = value === null || value === undefined ? "" : String(value);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

// Build CSV text from rows using a column definition:
//   columns: [{ header, value: (row) => any }]
export function rowsToCSV(rows, columns) {
  const headerLine = columns.map((c) => escapeCell(c.header)).join(",");
  const lines = rows.map((row) =>
    columns.map((c) => escapeCell(c.value(row))).join(",")
  );
  return [headerLine, ...lines].join("\n");
}

// Export rows to a downloaded CSV file (opens in Excel).
export function exportToCSV(filename, rows, columns) {
  downloadText(filename, rowsToCSV(rows, columns));
}

// Trigger a browser download of the given text as a file.
export function downloadText(filename, text) {
  const blob = new Blob([text], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
