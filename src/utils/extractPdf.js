import { cleanExtractedText } from "./cleanText";

// Nota sobre el futuro: si en una versión posterior se necesita soportar
// PDF escaneados (sin capa de texto), este es el punto donde se debería
// detectar "texto insuficiente por página" y disparar un flujo de OCR
// (por ejemplo tesseract.js) como paso adicional antes de armar `fullText`.

let pdfjsLibPromise = null;

function loadPdfJs() {
  if (!pdfjsLibPromise) {
    pdfjsLibPromise = import("pdfjs-dist/build/pdf").then((pdfjsLib) => {
      pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.js";
      return pdfjsLib;
    });
  }
  return pdfjsLibPromise;
}

/**
 * Extrae el texto de un archivo PDF completamente en el cliente.
 * Devuelve { text, pageCount } o lanza un Error con un mensaje apto
 * para mostrar al estudiante.
 */
export async function extractTextFromPdf(file, onProgress) {
  let pdfjsLib;
  try {
    pdfjsLib = await loadPdfJs();
  } catch (err) {
    throw new Error("No se pudo cargar el lector de PDF. Probá recargar la página.");
  }

  const arrayBuffer = await file.arrayBuffer();

  let pdf;
  try {
    pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  } catch (err) {
    throw new Error(
      "No se pudo leer el archivo PDF. Verificá que no esté dañado ni protegido con contraseña."
    );
  }

  const pageCount = pdf.numPages;
  const pageTexts = [];

  for (let pageNumber = 1; pageNumber <= pageCount; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    const pageText = content.items.map((item) => item.str).join(" ");
    pageTexts.push(pageText);

    if (onProgress) {
      onProgress(pageNumber, pageCount);
    }
  }

  const fullText = cleanExtractedText(pageTexts.join("\n\n"));
  return { text: fullText, pageCount };
}
