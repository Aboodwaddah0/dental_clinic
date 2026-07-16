import * as XLSX from "xlsx";

type Row = (string | number)[];

export function exportToCSV(filename: string, headers: string[], rows: Row[]) {
  const lines = [headers, ...rows].map((r) =>
    r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
  );
  const blob = new Blob(["﻿" + lines.join("\r\n")], { type: "text/csv;charset=utf-8;" });
  triggerDownload(blob, `${filename}.csv`);
}

export function exportToExcel(filename: string, sheetName: string, headers: string[], rows: Row[]) {
  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

export function exportToPDF(filename: string, title: string, headers: string[], rows: Row[], isRtl = false) {
  const dir = isRtl ? "rtl" : "ltr";
  const lang = isRtl ? "ar" : "en";
  const dateStr = new Date().toLocaleDateString(isRtl ? "ar-SA" : "en-US", {
    year: "numeric", month: "long", day: "numeric",
  });

  const escape = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const headerCells = headers.map((h) => `<th>${escape(h)}</th>`).join("");
  const bodyRows = rows
    .map((r) => `<tr>${r.map((c) => `<td>${escape(String(c))}</td>`).join("")}</tr>`)
    .join("");

  const html = `<!DOCTYPE html>
<html dir="${dir}" lang="${lang}">
<head>
<meta charset="UTF-8">
<title>${escape(title)}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: 'Segoe UI', Arial, 'Tahoma', sans-serif;
    padding: 24px;
    direction: ${dir};
    font-size: 13px;
    color: #111;
  }
  h1 { font-size: 18px; font-weight: 700; margin-bottom: 4px; }
  .date { color: #6b7280; font-size: 11px; margin-bottom: 20px; }
  table { width: 100%; border-collapse: collapse; }
  th {
    background: #0ea5e9;
    color: #fff;
    padding: 8px 12px;
    text-align: ${isRtl ? "right" : "left"};
    font-weight: 600;
    font-size: 12px;
  }
  td { padding: 7px 12px; border-bottom: 1px solid #e5e7eb; font-size: 12px; }
  tr:nth-child(even) td { background: #f8fafc; }
  @media print {
    body { padding: 0; }
    @page { margin: 15mm; }
  }
</style>
</head>
<body>
<h1>${escape(title)}</h1>
<p class="date">${dateStr}</p>
<table>
  <thead><tr>${headerCells}</tr></thead>
  <tbody>${bodyRows}</tbody>
</table>
<script>window.onload = function() { window.print(); };<\/script>
</body>
</html>`;

  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, "_blank");
  if (win) win.focus();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

function triggerDownload(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}
