export const REQUIRED_QUESTION_COUNT = 20;
export const VALID_OPTION_KEYS = ["A", "B", "C", "D"];

/**
 * Valida que el objeto recibido de la IA cumpla exactamente el contrato
 * esperado por la aplicación. Devuelve { valid: true, questions } o
 * { valid: false, reason } con un motivo interno (no se muestra tal cual
 * al estudiante).
 */
export function validateQuestionsPayload(payload) {
  if (!payload || typeof payload !== "object") {
    return { valid: false, reason: "El resultado no es un objeto JSON." };
  }

  const { questions } = payload;

  if (!Array.isArray(questions)) {
    return { valid: false, reason: "Falta el array 'questions'." };
  }

  if (questions.length !== REQUIRED_QUESTION_COUNT) {
    return {
      valid: false,
      reason: `Se esperaban ${REQUIRED_QUESTION_COUNT} preguntas y se recibieron ${questions.length}.`,
    };
  }

  for (let i = 0; i < questions.length; i += 1) {
    const q = questions[i];
    const position = i + 1;

    if (!q || typeof q !== "object") {
      return { valid: false, reason: `La pregunta ${position} no es un objeto válido.` };
    }
    if (typeof q.question !== "string" || q.question.trim().length === 0) {
      return { valid: false, reason: `La pregunta ${position} no tiene enunciado.` };
    }
    if (!q.options || typeof q.options !== "object") {
      return { valid: false, reason: `La pregunta ${position} no tiene opciones.` };
    }

    const optionKeys = Object.keys(q.options);
    const hasExactlyFourOptions =
      VALID_OPTION_KEYS.every((key) => typeof q.options[key] === "string" && q.options[key].trim().length > 0) &&
      optionKeys.length === 4;

    if (!hasExactlyFourOptions) {
      return { valid: false, reason: `La pregunta ${position} no tiene exactamente 4 opciones (A, B, C, D).` };
    }

    if (!VALID_OPTION_KEYS.includes(q.correctAnswer)) {
      return { valid: false, reason: `La pregunta ${position} tiene una respuesta correcta inválida.` };
    }
  }

  // Normaliza: fuerza id secuencial 1..20 sin confiar en lo que mandó la IA.
  const normalizedQuestions = questions.map((q, index) => ({
    id: index + 1,
    question: q.question.trim(),
    options: {
      A: q.options.A.trim(),
      B: q.options.B.trim(),
      C: q.options.C.trim(),
      D: q.options.D.trim(),
    },
    correctAnswer: q.correctAnswer,
    explanation: typeof q.explanation === "string" ? q.explanation.trim() : "",
  }));

  return { valid: true, questions: normalizedQuestions };
}

/**
 * Intenta extraer un objeto JSON de un texto de respuesta de la IA que
 * podría venir envuelto en texto adicional o bloques ```json.
 */
export function extractJsonFromModelText(text) {
  if (!text) return null;

  const fencedMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fencedMatch ? fencedMatch[1] : text;

  const firstBrace = candidate.indexOf("{");
  const lastBrace = candidate.lastIndexOf("}");
  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    return null;
  }

  const jsonSlice = candidate.slice(firstBrace, lastBrace + 1);

  try {
    return JSON.parse(jsonSlice);
  } catch (err) {
    return null;
  }
}
