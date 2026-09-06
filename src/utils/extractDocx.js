import { cleanExtractedText } from "./cleanText";

/**
 * Extrae el texto de un archivo .docx completamente en el cliente
 * usando Mammoth.js. Devuelve { text } o lanza un Error con un mensaje
 * apto para mostrar al estudiante.
 */
export async function extractTextFromDocx(file) {
  let mammoth;
  try {
    mammoth = await import("mammoth/mammoth.browser");
  } catch (err) {
    throw new Error("No se pudo cargar el lector de Word. Probá recargar la página.");
  }

  const arrayBuffer = await file.arrayBuffer();

  let result;
  try {
    result = await mammoth.extractRawText({ arrayBuffer });
  } catch (err) {
    throw new Error(
      "No se pudo leer el archivo Word. Verificá que el archivo no esté dañado."
    );
  }

  const fullText = cleanExtractedText(result.value || "");
  return { text: fullText };
}
