import Anthropic from "@anthropic-ai/sdk";
import { extractJsonFromModelText, validateQuestionsPayload } from "../../utils/validateQuestions";
import { truncateForModel } from "../../utils/cleanText";

// Arquitectura: Frontend -> esta API de Vercel -> API de Anthropic -> Frontend.
// La API Key nunca llega al navegador: se lee únicamente desde el entorno
// del servidor (variable de entorno de Vercel).

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "2mb",
    },
  },
};

const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6";
const MAX_ATTEMPTS = 2;

function buildSystemPrompt() {
  return `Sos un diseñador de evaluaciones educativas. Tu única fuente de información es el material que te provee el usuario. Generás exclusivamente un objeto JSON, sin ningún texto adicional antes o después, sin bloques de código markdown, sin comentarios.`;
}

function buildUserPrompt(sourceText) {
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

FORMATO DE SALIDA (JSON estricto, sin texto adicional):
{
  "questions": [
    {
      "id": 1,
      "question": "texto de la pregunta",
      "options": { "A": "opción A", "B": "opción B", "C": "opción C", "D": "opción D" },
      "correctAnswer": "A",
      "explanation": "explicación breve basada en el material"
    }
  ]
}

MATERIAL DE ESTUDIO:
"""
${sourceText}
"""`;
}

async function requestQuestionsFromModel(client, sourceText) {
  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 8000,
    system: buildSystemPrompt(),
    messages: [{ role: "user", content: buildUserPrompt(sourceText) }],
  });

  const textBlock = message.content.find((block) => block.type === "text");
  return textBlock ? textBlock.text : "";
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "method_not_allowed", message: "Método no permitido." });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: "missing_api_key",
      message: "El servicio de evaluaciones no está disponible en este momento. Contactá al administrador.",
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
  const client = new Anthropic({ apiKey });

  let lastReason = "unknown";

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
      // Si es un error de autenticación, no tiene sentido reintentar.
      if (err?.status === 401 || err?.status === 403) break;
    }
  }

  return res.status(502).json({
    error: "generation_failed",
    message:
      "No se pudo generar la evaluación a partir del material. Podés intentar generarla nuevamente.",
    debugReason: lastReason,
  });
}
