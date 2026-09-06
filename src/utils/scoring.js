export const TOTAL_QUESTIONS = 20;
export const POINTS_PER_QUESTION = 0.5;
export const MAX_SCORE = 10;

/**
 * Corrige las respuestas del estudiante contra correctAnswer.
 * No vuelve a consultar a la IA: usa exclusivamente el campo generado
 * originalmente, para garantizar una corrección consistente.
 */
export function gradeAnswers(questions, answers) {
  const results = questions.map((q) => {
    const selected = answers[q.id] ?? null;
    const isCorrect = selected === q.correctAnswer;
    return {
      id: q.id,
      question: q.question,
      options: q.options,
      correctAnswer: q.correctAnswer,
      explanation: q.explanation,
      selected,
      isCorrect,
    };
  });

  const correctCount = results.filter((r) => r.isCorrect).length;
  const incorrectCount = results.length - correctCount;
  const score = Math.round(correctCount * POINTS_PER_QUESTION * 10) / 10; // evita errores de coma flotante
  const percentage = Math.round((correctCount / results.length) * 100);

  return {
    results,
    correctCount,
    incorrectCount,
    totalQuestions: results.length,
    score,
    maxScore: MAX_SCORE,
    percentage,
    message: getResultMessage(percentage),
  };
}

/**
 * Mensajes siempre constructivos, nunca desmotivadores, según el brief.
 */
export function getResultMessage(percentage) {
  if (percentage >= 90) return "Excelente trabajo.";
  if (percentage >= 70) return "Muy buen resultado.";
  if (percentage >= 60) return "Buen trabajo, pero hay algunos temas para reforzar.";
  return "Conviene repasar el material y volver a intentarlo.";
}
