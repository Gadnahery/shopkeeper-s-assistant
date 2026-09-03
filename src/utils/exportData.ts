/**
 * Export data array to CSV file (pure vanilla JS, no external dependency)
 */
export function exportToCSV(data: Record<string, unknown>[], filename: string) {
  if (!data.length) return;
  const headers = Object.keys(data[0]);
  const rows = data.map((row) =>
    headers
      .map((header) => {
        const val = row[header];
        const stringVal = val === null || val === undefined ? "" : String(val);
        return `"${stringVal.replace(/"/g, '""')}"`;
      })
      .join(",")
  );

  const csvContent = [headers.join(","), ...rows].join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename.replace(/\.csv$/, "")}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export data array to Excel (.xlsx) file (falls back to CSV with .xlsx extension)
 */
export function exportToExcel(data: Record<string, unknown>[], filename: string) {
  exportToCSV(data, `${filename.replace(/\.xlsx$/, "")}`);
}

/**
 * Simple CSV parser for import functionality
 */
export function parseCSV(csvText: string): Record<string, string>[] {
  const lines = csvText.trim().split(/\r\n|\n/);
  if (lines.length < 2) return [];

  const headers = lines[0].split(",").map((h) => h.replace(/^"|"$/g, "").trim());
  const results: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values: string[] = [];
    let insideQuotes = false;
    let currentVal = "";

    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      if (char === '"') {
        insideQuotes = !insideQuotes;
      } else if (char === "," && !insideQuotes) {
        values.push(currentVal.trim());
        currentVal = "";
      } else {
        currentVal += char;
      }
    }
    values.push(currentVal.trim());

    const row: Record<string, string> = {};
    headers.forEach((header, idx) => {
      row[header] = (values[idx] || "").replace(/^"|"$/g, "").replace(/""/g, '"');
    });
    results.push(row);
  }

  return results;
}

/**
 * Format records for clean export (removes internal fields, formats dates/numbers)
 */
export function formatForExport(
  records: Record<string, unknown>[],
  columns: { key: string; label: string; format?: (val: unknown) => string }[]
): Record<string, unknown>[] {
  return records.map((record) => {
    const row: Record<string, unknown> = {};
    for (const col of columns) {
      const val = record[col.key];
      row[col.label] = col.format ? col.format(val) : val ?? "";
    }
    return row;
  });
}

/**
 * Group records by a key for multi-sheet export
 */
export function groupByField<T extends Record<string, unknown>>(
  items: T[],
  key: keyof T
): Record<string, T[]> {
  return items.reduce((acc, item) => {
    const group = String(item[key] || "Other");
    if (!acc[group]) acc[group] = [];
    acc[group].push(item);
    return acc;
  }, {} as Record<string, T[]>);
}

export type PrintablePDFOptions = {
  title: string;
  period?: string;
  stats?: { label: string; value: string }[];
  items: { date: string; customer: string; method: string; total: string }[];
};

/** Export data as simple printable HTML (for PDF-like export via browser print) */
export function exportToPrintablePDF(
  titleOrOptions: string | PrintablePDFOptions,
  headers?: string[],
  rows?: string[][]
) {
  const printWindow = window.open("", "_blank");
  if (!printWindow) return;

  if (typeof titleOrOptions === "object") {
    const { title, period, stats, items } = titleOrOptions;
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${title}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; color: #1a1d29; }
          h1 { font-size: 20px; margin-bottom: 4px; }
          .sub { font-size: 12px; color: #666; margin-bottom: 16px; }
          .stats { display: flex; gap: 16px; margin-bottom: 20px; }
          .stat-box { border: 1px solid #ddd; padding: 10px; border-radius: 6px; flex: 1; }
          .stat-label { font-size: 11px; color: #666; }
          .stat-val { font-size: 16px; font-weight: bold; margin-top: 4px; }
          table { width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 10px; }
          th, td { border: 1px solid #eee; padding: 8px 10px; text-align: left; }
          th { background: #f4f5f7; color: #333; font-weight: 600; }
          tr:nth-child(even) { background: #fafafa; }
        </style>
      </head>
      <body>
        <h1>${title}</h1>
        <div class="sub">${period ? `Period: ${period} | ` : ""}Generated: ${new Date().toLocaleString()}</div>
        ${
          stats
            ? `<div class="stats">${stats
                .map(
                  (s) => `<div class="stat-box"><div class="stat-label">${s.label}</div><div class="stat-val">${s.value}</div></div>`
                )
                .join("")}</div>`
            : ""
        }
        <table>
          <thead><tr><th>Date</th><th>Customer</th><th>Method</th><th style="text-align:right">Total</th></tr></thead>
          <tbody>${items
            .map(
              (it) => `<tr><td>${it.date}</td><td>${it.customer}</td><td>${it.method}</td><td style="text-align:right"><b>${it.total}</b></td></tr>`
            )
            .join("")}</tbody>
        </table>
      </body>
      </html>
    `);
  } else {
    const title = titleOrOptions;
    const h = headers || [];
    const r = rows || [];
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${title}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h1 { font-size: 18px; margin-bottom: 10px; }
          table { width: 100%; border-collapse: collapse; font-size: 12px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background: #26a17b; color: white; }
          tr:nth-child(even) { background: #f9f9f9; }
          .date { font-size: 11px; color: #666; margin-bottom: 15px; }
        </style>
      </head>
      <body>
        <h1>${title}</h1>
        <div class="date">Generated: ${new Date().toLocaleString()}</div>
        <table>
          <thead><tr>${h.map((head) => `<th>${head}</th>`).join("")}</tr></thead>
          <tbody>${r.map((row) => `<tr>${row.map((c) => `<td>${c}</td>`).join("")}</tr>`).join("")}</tbody>
        </table>
      </body>
      </html>
    `);
  }

  printWindow.document.close();
  printWindow.print();
}
