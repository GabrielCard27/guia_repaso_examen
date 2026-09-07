import { GoogleGenAI } from "@google/genai";
import { extractJsonFromModelText, validateQuestionsPayload } from "../../utils/validateQuestions";
import { truncateForModel } from "../../utils/cleanText";

// Arquitectura: Frontend -> esta API de Vercel -> Gemini API -> Frontend.
// La API Key nunca llega al navegador: se lee únicamente desde el entorno
// del servidor (variable de entorno de Vercel). El frontend siempre habla
// con esta misma ruta (/api/generate-questions); solo cambió el proveedor
// de IA por dentro.

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "2mb",
    },
  },
};

const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const MAX_ATTEMPTS = 2;

// Esquema estructurado: le pedimos a Gemini que su salida cumpla esta forma
// de manera nativa (responseSchema + responseMimeType), lo que reduce
// drásticamente la posibilidad de JSON inválido o con texto extra.
const QUESTIONS_RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    questions: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "integer" },
          question: { type: "string" },
          options: {
            type: "object",
            properties: {
              A: { type: "string" },
              B: { type: "string" },
              C: { type: "string" },
              D: { type: "string" },
            },
            required: ["A", "B", "C", "D"],
          },
          correctAnswer: { type: "string", enum: ["A", "B", "C", "D"] },
          explanation: { type: "string" },
        },
        required: ["id", "question", "options", "correctAnswer", "explanation"],
      },
    },
  },
  required: ["questions"],
};

function buildSystemInstruction() {
  return `Sos un diseñador de evaluaciones educativas. Tu única fuente de información es el material que te provee el usuario. Respondés exclusivamente con el objeto JSON pedido, sin texto adicional antes o después.`;
}

function buildPrompt(sourceText) {
  return `A partir del siguiente material de estudio, generá una evaluación de opción múltiple.

REGLAS OBLIGATORIAS:
- Exactamente 20 preguntas, ni una más ni una menos.
- Cada pregunta tiene exactamente 4 opciones: A, B, C y D.
- Cada pregunta tiene una única respuesta correcta.
- Las preguntas deben basarse EXCLUSIVAMENTE en el contenido del material. No inventes datos externos ni supongas información que no esté presente.
- Evitá preguntas ambiguas o con más de una interpretación posible.
- Distribución de dificultad: 7 preguntas fáciles, 8 preguntas intermedias, 5 preguntas difíciles.
- Las preguntas deben evaluar comprensión real del contenido, no solo memoria literal de frases.
- Cada pregunta debe incluir una explicación breve (1-2 oraciones) de por qué esa es la respuesta correcta, basada en el material.
- Los "id" deben ser números correlativos del 1 al 20, en ese orden.

MATERIAL DE ESTUDIO:
"""
${sourceText}
"""`;
}

async function requestQuestionsFromModel(client, sourceText) {
  const response = await client.models.generateContent({
    model: MODEL,
    contents: buildPrompt(sourceText),
    config: {
      systemInstruction: buildSystemInstruction(),
      responseMimeType: "application/json",
      responseSchema: QUESTIONS_RESPONSE_SCHEMA,
      temperature: 0.4,
      maxOutputTokens: 8000,
    },
  });

  return response.text || "";
}

function classifyError(err) {
  const status = err?.status ?? err?.code;
  const message = String(err?.message || "").toLowerCase();

  if (status === 401 || status === 403 || message.includes("api key not valid")) {
    return "auth";
  }
  if (
    status === 429 ||
    message.includes("resource_exhausted") ||
    message.includes("quota") ||
    message.includes("rate limit")
  ) {
    return "rate_limit";
  }
  return "unknown";
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "method_not_allowed", message: "Método no permitido." });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: "missing_api_key",
      message: "El servicio de generación de preguntas no está configurado correctamente.",
    });
  }

  const { text } = req.body || {};

  if (!text || typeof text !== "string" || text.trim().length === 0) {
    return res.status(400).json({
      error: "empty_text",
      message: "No se recibió contenido del material para generar la evaluación.",
    });
  }

  const sourceText = truncateForModel(text.trim());
  const client = new GoogleGenAI({ apiKey });

  let lastReason = "unknown";
  let lastErrorKind = "unknown";

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      const rawText = await requestQuestionsFromModel(client, sourceText);
      const parsed = extractJsonFromModelText(rawText);

      if (!parsed) {
        lastReason = "invalid_json";
        continue;
      }

      const validation = validateQuestionsPayload(parsed);
      if (!validation.valid) {
        lastReason = validation.reason;
        continue;
      }

      return res.status(200).json({ questions: validation.questions });
    } catch (err) {
      lastReason = err?.message || "request_failed";
      lastErrorKind = classifyError(err);
      // Si es un error de autenticación o de límite de uso, no tiene sentido reintentar.
      if (lastErrorKind === "auth" || lastErrorKind === "rate_limit") break;
    }
  }

  if (lastErrorKind === "rate_limit") {
    return res.status(429).json({
      error: "rate_limited",
      message: "Se alcanzó temporalmente el límite de generación. Intentá nuevamente más tarde.",
      debugReason: lastReason,
    });
  }

  if (lastErrorKind === "auth") {
    return res.status(500).json({
      error: "invalid_api_key",
      message: "El servicio de generación de preguntas no está configurado correctamente.",
      debugReason: lastReason,
    });
  }

  return res.status(502).json({
    error: "generation_failed",
    message:
      "No pudimos generar una evaluación válida a partir de este material. Intentá nuevamente.",
    debugReason: lastReason,
  });
}
