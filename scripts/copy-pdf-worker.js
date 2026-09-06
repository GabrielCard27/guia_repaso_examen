// PDF.js necesita su archivo "worker" servido como estático para poder
// procesar PDFs en un hilo aparte del principal. Este script lo copia
// desde node_modules hacia /public en cada instalación, para que Next.js
// lo sirva en /pdf.worker.min.js (ver src/utils/extractPdf.js).
const fs = require("fs");
const path = require("path");

const source = path.join(
  __dirname,
  "..",
  "node_modules",
  "pdfjs-dist",
  "build",
  "pdf.worker.min.js"
);
const destination = path.join(__dirname, "..", "public", "pdf.worker.min.js");

try {
  fs.copyFileSync(source, destination);
  console.log("[copy-pdf-worker] pdf.worker.min.js copiado a /public");
} catch (err) {
  console.warn(
    "[copy-pdf-worker] No se pudo copiar pdf.worker.min.js. La lectura de PDF podría no funcionar.",
    err.message
  );
}
