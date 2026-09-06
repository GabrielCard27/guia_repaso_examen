import Head from "next/head";
import { useCallback, useState } from "react";
import FileUploadScreen from "../components/FileUploadScreen";
import QuizScreen from "../components/QuizScreen";
import ResultsScreen from "../components/ResultsScreen";
import LoadingOverlay from "../components/LoadingOverlay";
import InstallPrompt from "../components/InstallPrompt";
import { extractTextFromPdf } from "../utils/extractPdf";
import { extractTextFromDocx } from "../utils/extractDocx";
import { hasEnoughContent } from "../utils/cleanText";
import { gradeAnswers } from "../utils/scoring";

class UserFacingError extends Error {
  constructor(message) {
    super(message);
    this.userMessage = message;
  }
}

const SCREENS = {
  UPLOAD: "upload",
  QUIZ: "quiz",
  RESULTS: "results",
};

async function requestQuestions(text) {
  let response;
  try {
    response = await fetch("/api/generate-questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
  } catch (err) {
    throw new UserFacingError(
      "No se pudo conectar con el servicio de generación. Revisá tu conexión e intentá nuevamente."
    );
  }

  let data = null;
  try {
    data = await response.json();
  } catch (err) {
    // el cuerpo no era JSON, se maneja abajo con el mensaje genérico
  }

  if (!response.ok) {
    throw new UserFacingError(
      data?.message || "No se pudo generar la evaluación. Intentá nuevamente."
    );
  }

  return data.questions;
}

async function extractText(file) {
  const isPdf = file.name.toLowerCase().endsWith(".pdf");
  try {
    const result = isPdf ? await extractTextFromPdf(file) : await extractTextFromDocx(file);
    return result.text;
  } catch (err) {
    throw new UserFacingError(err.message || "No se pudo leer el archivo. Probá con otro material.");
  }
}

export default function Home() {
  const [screen, setScreen] = useState(SCREENS.UPLOAD);

  const [file, setFile] = useState(null);
  const [fileError, setFileError] = useState(null);
  const [extractedText, setExtractedText] = useState("");

  const [isBusy, setIsBusy] = useState(false);
  const [busyMessage, setBusyMessage] = useState("");
  const [generateError, setGenerateError] = useState(null);

  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [gradeResult, setGradeResult] = useState(null);

  const [isRegenerating, setIsRegenerating] = useState(false);
  const [regenerateError, setRegenerateError] = useState(null);

  const handleFileSelected = useCallback((selectedFile, error) => {
    setFile(selectedFile);
    setFileError(error);
    setGenerateError(null);
  }, []);

  const handleFileRemoved = useCallback(() => {
    setFile(null);
    setFileError(null);
    setExtractedText("");
    setGenerateError(null);
  }, []);

  async function handleGenerate() {
    if (!file) return;
    setGenerateError(null);
    setIsBusy(true);

    try {
      setBusyMessage("Analizando el material…");
      const text = await extractText(file);

      if (!hasEnoughContent(text)) {
        throw new UserFacingError(
          "El documento no parece tener suficiente texto para generar una evaluación. Probá con otro archivo."
        );
      }

      setExtractedText(text);

      setBusyMessage("Generando la evaluación…");
      const generatedQuestions = await requestQuestions(text);

      setQuestions(generatedQuestions);
      setAnswers({});
      setGradeResult(null);
      setScreen(SCREENS.QUIZ);
    } catch (err) {
      setGenerateError(err.userMessage || "Ocurrió un error inesperado. Intentá nuevamente.");
    } finally {
      setIsBusy(false);
      setBusyMessage("");
    }
  }

  function handleAnswer(questionId, optionKey) {
    setAnswers((prev) => ({ ...prev, [questionId]: optionKey }));
  }

  function handleSubmitQuiz() {
    const result = gradeAnswers(questions, answers);
    setGradeResult(result);
    setScreen(SCREENS.RESULTS);
  }

  async function handleNewEvaluation() {
    setRegenerateError(null);
    setIsRegenerating(true);
    try {
      const generatedQuestions = await requestQuestions(extractedText);
      setQuestions(generatedQuestions);
      setAnswers({});
      setGradeResult(null);
      setScreen(SCREENS.QUIZ);
    } catch (err) {
      setRegenerateError(err.userMessage || "No se pudo generar una nueva evaluación. Intentá nuevamente.");
    } finally {
      setIsRegenerating(false);
    }
  }

  function handleBackToMaterial() {
    setScreen(SCREENS.UPLOAD);
    setGenerateError(null);
  }

  function handleDeleteMaterial() {
    setFile(null);
    setFileError(null);
    setExtractedText("");
    setQuestions([]);
    setAnswers({});
    setGradeResult(null);
    setGenerateError(null);
    setScreen(SCREENS.UPLOAD);
  }

  return (
    <>
      <Head>
        <title>Estudio IA</title>
      </Head>

      {screen === SCREENS.UPLOAD && (
        <FileUploadScreen
          file={file}
          onFileSelected={handleFileSelected}
          onFileRemoved={handleFileRemoved}
          onGenerate={handleGenerate}
          isBusy={isBusy}
          busyMessage={busyMessage}
          error={fileError || generateError}
        />
      )}

      {screen === SCREENS.QUIZ && questions.length > 0 && (
        <QuizScreen
          questions={questions}
          answers={answers}
          onAnswer={handleAnswer}
          onSubmit={handleSubmitQuiz}
        />
      )}

      {screen === SCREENS.RESULTS && gradeResult && (
        <>
          <ResultsScreen
            gradeResult={gradeResult}
            onNewEvaluation={handleNewEvaluation}
            onBackToMaterial={handleBackToMaterial}
            onDeleteMaterial={handleDeleteMaterial}
          />
          {regenerateError && (
            <div className="fixed bottom-4 left-1/2 z-40 w-[92%] max-w-md -translate-x-1/2 rounded-lg bg-bad-50 px-4 py-3 text-sm text-bad-600 shadow-card">
              {regenerateError}
            </div>
          )}
        </>
      )}

      {isRegenerating && <LoadingOverlay message="Generando una nueva evaluación…" />}

      <InstallPrompt />
    </>
  );
}
