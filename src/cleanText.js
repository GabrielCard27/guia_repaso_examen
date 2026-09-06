// Umbral mínimo de caracteres "útiles" para considerar que el documento
// tiene contenido suficiente como para generar una evaluación.
export const MIN_USEFUL_CHARACTERS = 400;

/**
 * Normaliza el texto extraído de un PDF o DOCX:
 * - colapsa espacios y saltos de línea repetidos
 * - elimina caracteres de control invisibles
 * - recorta espacios al inicio/fin
 */
export function cleanExtractedText(rawText) {
  if (!rawText) return "";

  return rawText
    .replace(/\r\n/g, "\n")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .split("\n")
    .map((line) => line.trim())
    .join("\n")
    .trim();
}

/**
 * Cuenta caracteres "útiles" (letras y números), ignorando espacios y
 * puntuación, para decidir si el documento tiene texto suficiente.
 */
export function countUsefulCharacters(text) {
  if (!text) return 0;
  const matches = text.match(/[\p{L}\p{N}]/gu);
  return matches ? matches.length : 0;
}

export function hasEnoughContent(text) {
  return countUsefulCharacters(text) >= MIN_USEFUL_CHARACTERS;
}

/**
 * Recorta el texto a un máximo de caracteres para no enviar documentos
 * enormes a la IA. Corta en un límite de párrafo cuando es posible.
 */
export function truncateForModel(text, maxChars = 60000) {
  if (text.length <= maxChars) return text;
  const slice = text.slice(0, maxChars);
  const lastBreak = slice.lastIndexOf("\n\n");
  return lastBreak > maxChars * 0.5 ? slice.slice(0, lastBreak) : slice;
}
