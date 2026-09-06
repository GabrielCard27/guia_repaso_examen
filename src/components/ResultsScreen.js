import { CircularProgress } from "./ProgressBar";

const OPTION_KEYS = ["A", "B", "C", "D"];

function formatScore(score) {
  // Muestra "8,5" en vez de "8.5" para seguir la convención local.
  return score.toFixed(1).replace(".", ",");
}

export default function ResultsScreen({ gradeResult, onNewEvaluation, onBackToMaterial, onDeleteMaterial }) {
  const { results, correctCount, incorrectCount, totalQuestions, score, maxScore, percentage, message } =
    gradeResult;

  return (
    <div className="min-h-screen px-4 py-10 sm:py-14">
      <div className="mx-auto max-w-2xl">
        <section className="rounded-xl2 border border-line bg-surface p-6 sm:p-10 shadow-card text-center">
          <p className="text-sm font-medium text-subtle">RESULTADO</p>

          <div className="mt-4 flex justify-center">
            <CircularProgress percentage={percentage} />
          </div>

          <p className="mt-4 font-display text-4xl font-semibold text-ink">
            {formatScore(score)} / {maxScore}
          </p>

          <p className="mt-2 text-base text-subtle">{message}</p>

          <div className="mt-6 flex items-center justify-center gap-6 text-sm">
            <span className="flex items-center gap-1.5 text-good-600">
              <span aria-hidden="true">🟢</span> {correctCount} correctas
            </span>
            <span className="flex items-center gap-1.5 text-bad-600">
              <span aria-hidden="true">🔴</span> {incorrectCount} incorrectas
            </span>
          </div>
          <p className="mt-1 text-xs text-subtle">{totalQuestions} preguntas en total</p>
        </section>

        <section className="mt-8 space-y-4">
          {results.map((r, index) => (
            <article
              key={r.id}
              className="rounded-xl2 border border-line bg-surface p-5 sm:p-6 shadow-card"
            >
              <p className="text-sm font-medium text-subtle">Pregunta {index + 1}</p>
              <p className="mt-1 text-base font-medium text-ink leading-relaxed">{r.question}</p>

              <div className="mt-4 space-y-2">
                {OPTION_KEYS.map((key) => {
                  const isCorrectOption = key === r.correctAnswer;
                  const isSelectedOption = key === r.selected;

                  let stateClasses = "border-line";
                  let icon = null;

                  if (isSelectedOption && r.isCorrect) {
                    stateClasses = "border-good-400 bg-good-50";
                    icon = "🟢";
                  } else if (isSelectedOption && !r.isCorrect) {
                    stateClasses = "border-bad-400 bg-bad-50";
                    icon = "🔴";
                  } else if (isCorrectOption && !r.isCorrect) {
                    stateClasses = "border-good-400 bg-good-50";
                    icon = "🟢";
                  }

                  return (
                    <div
                      key={key}
                      className={`flex items-center gap-2 rounded-lg border px-3.5 py-2.5 text-sm ${stateClasses}`}
                    >
                      <span className="font-semibold">{key}.</span>
                      <span className="flex-1 text-ink">{r.options[key]}</span>
                      {icon && <span aria-hidden="true">{icon}</span>}
                    </div>
                  );
                })}
              </div>

              <p className={`mt-3 text-sm font-medium ${r.isCorrect ? "text-good-600" : "text-bad-600"}`}>
                {r.isCorrect ? "Respuesta correcta" : `Respuesta correcta: ${r.correctAnswer}`}
              </p>

              {r.explanation && (
                <p className="mt-2 text-sm text-subtle leading-relaxed">{r.explanation}</p>
              )}
            </article>
          ))}
        </section>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={onNewEvaluation}
            className="flex-1 rounded-full bg-brand-500 px-6 py-4 text-sm font-medium text-white hover:bg-brand-600 transition-colors"
          >
            Nueva evaluación
          </button>
          <button
            type="button"
            onClick={onBackToMaterial}
            className="flex-1 rounded-full border border-line px-6 py-4 text-sm font-medium text-ink hover:border-brand-300 transition-colors"
          >
            Volver al material
          </button>
          <button
            type="button"
            onClick={onDeleteMaterial}
            className="flex-1 rounded-full border border-line px-6 py-4 text-sm font-medium text-bad-600 hover:border-bad-400 transition-colors"
          >
            Eliminar material
          </button>
        </div>
      </div>
    </div>
  );
}
