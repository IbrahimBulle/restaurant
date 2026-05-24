export function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function openPrintWindow(title, content) {
  const printWindow = window.open("", "_blank", "width=1100,height=900");
  if (!printWindow) {
    window.alert("Allow pop-ups in your browser to print this page.");
    return false;
  }
  printWindow.document.open();
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
          .toolbar {
            display: flex;
            justify-content: flex-end;
            gap: 12px;
            margin-bottom: 18px;
          }
          .toolbar button {
            border: 0;
            border-radius: 999px;
            padding: 12px 18px;
            font-size: 14px;
            font-weight: 700;
            cursor: pointer;
          }
          .toolbar button:first-child {
            background: #0f6b52;
            color: white;
          }
          .toolbar button:last-child {
            background: #e8eee9;
            color: #13211d;
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
            .toolbar { display: none; }
            body { padding: 0; background: white; }
          }
        </style>
      </head>
      <body>
        <div class="toolbar">
          <button type="button" id="print-trigger">Print</button>
          <button type="button" id="close-trigger">Close</button>
        </div>
        ${content}
        <script>
          const printButton = document.getElementById("print-trigger");
          const closeButton = document.getElementById("close-trigger");
          const waitForImages = () => {
            const images = Array.from(document.images || []);
            return Promise.all(
              images.map((image) => {
                if (image.complete) return Promise.resolve();
                return new Promise((resolve) => {
                  image.addEventListener("load", resolve, { once: true });
                  image.addEventListener("error", resolve, { once: true });
                });
              }),
            );
          };
          const triggerPrint = async () => {
            await waitForImages();
            window.focus();
            window.print();
          };
          printButton?.addEventListener("click", triggerPrint);
          closeButton?.addEventListener("click", () => window.close());
          window.addEventListener(
            "load",
            () => {
              window.setTimeout(triggerPrint, 250);
            },
            { once: true },
          );
        </script>
      </body>
    </html>`);
  printWindow.document.close();
  return true;
}
