export function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function openPrintWindow(title, content) {
  const printWindow = window.open("", "_blank", "noopener,noreferrer,width=1100,height=900");
  if (!printWindow) return;
  printWindow.document.write(`<!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>${escapeHtml(title)}</title>
        <style>
          * { box-sizing: border-box; }
          body {
            margin: 0;
            padding: 32px;
            font-family: "Segoe UI", Arial, sans-serif;
            background: #f6f3ea;
            color: #13211d;
          }
          .sheet {
            display: grid;
            gap: 24px;
          }
          .card {
            background: white;
            border: 1px solid #dde5de;
            border-radius: 28px;
            padding: 24px;
            box-shadow: 0 18px 45px rgba(16, 28, 24, 0.08);
            page-break-inside: avoid;
          }
          .eyebrow {
            color: #0f6b52;
            font-size: 12px;
            letter-spacing: 0.12em;
            text-transform: uppercase;
            font-weight: 700;
            margin: 0 0 8px;
          }
          h1, h2, h3, p { margin: 0; }
          p + p { margin-top: 8px; }
          img {
            display: block;
            width: 100%;
            max-width: 220px;
            margin: 18px auto;
            border-radius: 18px;
            border: 10px solid #f6f3ea;
          }
          .muted {
            color: #55635e;
          }
          .scan-url, .code {
            word-break: break-word;
            font-size: 12px;
            padding: 12px 14px;
            border-radius: 16px;
            background: #f4f7f3;
            border: 1px solid #dde5de;
            margin-top: 16px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 16px;
          }
          td, th {
            padding: 10px 0;
            border-bottom: 1px solid #ebefec;
            text-align: left;
            font-size: 14px;
          }
          th:last-child, td:last-child {
            text-align: right;
          }
          @media print {
            body { padding: 0; background: white; }
          }
        </style>
      </head>
      <body>${content}</body>
    </html>`);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
  }, 200);
}
