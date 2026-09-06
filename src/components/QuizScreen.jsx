import { useState } from "react";
import { LinearProgress } from "./ProgressBar";

const OPTION_KEYS = ["A", "B", "C", "D"];

export default function QuizScreen({ questions, answers, onAnswer, onSubmit }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showConfirm, setShowConfirm] = useState(false);

  const total = questions.length;
  const currentQuestion = questions[currentIndex];
  const answeredCount = Object.keys(answers).length;
  const allAnswered = answeredCount === total;

  function goTo(index) {
    setCurrentIndex(Math.max(0, Math.min(total - 1, index)));
  }

  function handleEvaluarClick() {
    setShowConfirm(true);
  }

  return (
    <div className="min-h-screen flex flex-col items-center px-4 py-8 sm:py-12 pb-32">
      <div className="w-full max-w-2xl">
        <header className="mb-6">
          <div className="flex items-baseline justify-between">
            <h2 className="font-display text-2xl font-semibold text-ink">
              Pregunta {currentIndex + 1} de {total}
            </h2>
            <span className="text-sm text-subtle">{answeredCount}/{total} respondidas</span>
          </div>
          <div className="mt-3">
            <LinearProgress value={answeredCount} max={total} />
          </div>
        </header>

        <nav aria-label="Navegación entre preguntas" className="mb-6 grid grid-cols-5 gap-2 sm:grid-cols-10">
          {questions.map((q, index) => {
            const isAnswered = answers[q.id] !== undefined;
            const isCurrent = index === currentIndex;
            return (
              <button
                key={q.id}
                type="button"
                onClick={() => goTo(index)}
                aria-current={isCurrent ? "true" : undefined}
                aria-label={`Ir a la pregunta ${index + 1}${isAnswered ? ", respondida" : ", sin responder"}`}
                className={`h-8 rounded-md text-xs font-medium transition-colors ${
                  isCurrent
                    ? "bg-brand-500 text-white"
                    : isAnswered
                    ? "bg-brand-100 text-brand-700"
                    : "bg-line text-subtle"
                }`}
              >
                {index + 1}
              </button>
            );
          })}
        </nav>

        <section className="rounded-xl2 border border-line bg-surface p-6 sm:p-8 shadow-card">
          <p className="text-lg font-medium text-ink leading-relaxed">
            {currentQuestion.question}
          </p>

          <fieldset className="mt-6 space-y-3">
            <legend className="sr-only">Opciones de respuesta</legend>
            {OPTION_KEYS.map((key) => {
              const isSelected = answers[currentQuestion.id] === key;
              return (
                <label
                  key={key}
                  className={`flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3.5 transition-colors ${
                    isSelected
                      ? "border-brand-500 bg-brand-50"
                      : "border-line bg-paper hover:border-brand-300"
                  }`}
                >
                  <input
                    type="radio"
                    name={`question-${currentQuestion.id}`}
                    value={key}
                    checked={isSelected}
                    onChange={() => onAnswer(currentQuestion.id, key)}
                    className="mt-1 h-4 w-4 accent-brand-500 flex-shrink-0"
                  />
                  <span className="text-sm sm:text-base text-ink">
                    <span className="font-semibold mr-2">{key}.</span>
                    {currentQuestion.options[key]}
                  </span>
                </label>
              );
            })}
          </fieldset>
        </section>

        <div className="mt-6 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => goTo(currentIndex - 1)}
            disabled={currentIndex === 0}
            className="rounded-full border border-line px-5 py-3 text-sm font-medium text-ink disabled:opacity-40"
          >
            Anterior
          </button>
          <button
            type="button"
            onClick={() => goTo(currentIndex + 1)}
            disabled={currentIndex === total - 1}
            className="rounded-full border border-line px-5 py-3 text-sm font-medium text-ink disabled:opacity-40"
          >
            Siguiente
          </button>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 border-t border-line bg-surface/95 backdrop-blur px-4 py-4">
        <div className="mx-auto max-w-2xl">
          <button
            type="button"
            onClick={handleEvaluarClick}
            disabled={!allAnswered}
            className="w-full rounded-full bg-brand-500 px-6 py-4 text-base font-medium text-white transition-colors hover:bg-brand-600 disabled:cursor-not-allowed disabled:bg-line disabled:text-subtle"
          >
            {allAnswered ? "Evaluar" : `Evaluar (${answeredCount}/${total})`}
          </button>
        </div>
      </div>

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4">
          <div className="w-full max-w-sm rounded-xl2 bg-surface p-6 shadow-card">
            <p className="text-lg font-medium text-ink">¿Querés finalizar la evaluación?</p>
            <p className="mt-2 text-sm text-subtle">
              Una vez que evalúes, vas a ver el resultado y la corrección de cada pregunta.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                className="flex-1 rounded-full border border-line px-4 py-3 text-sm font-medium text-ink"
              >
                Seguir revisando
              </button>
              <button
                type="button"
                onClick={onSubmit}
                className="flex-1 rounded-full bg-brand-500 px-4 py-3 text-sm font-medium text-white hover:bg-brand-600"
              >
                Evaluar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
