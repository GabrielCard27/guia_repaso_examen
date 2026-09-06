import { useCallback, useRef, useState } from "react";

const ACCEPTED_EXTENSIONS = [".pdf", ".docx"];
const ACCEPTED_MIME_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024; // 20 MB

function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isAcceptedFile(file) {
  const name = file.name.toLowerCase();
  const hasAcceptedExtension = ACCEPTED_EXTENSIONS.some((ext) => name.endsWith(ext));
  const hasAcceptedMime = ACCEPTED_MIME_TYPES.includes(file.type) || file.type === "";
  return hasAcceptedExtension && hasAcceptedMime;
}

export default function FileUploadScreen({
  file,
  onFileSelected,
  onFileRemoved,
  onGenerate,
  isBusy,
  busyMessage,
  error,
}) {
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const inputRef = useRef(null);

  const handleFiles = useCallback(
    (fileList) => {
      const selected = fileList && fileList[0];
      if (!selected) return;

      if (selected.size > MAX_FILE_SIZE_BYTES) {
        onFileSelected(null, "El archivo es demasiado grande. El límite es 20 MB.");
        return;
      }

      if (!isAcceptedFile(selected)) {
        onFileSelected(null, "Formato no compatible. Cargá un archivo PDF o Word (.docx).");
        return;
      }

      onFileSelected(selected, null);
    },
    [onFileSelected]
  );

  function handleDrop(event) {
    event.preventDefault();
    setIsDraggingOver(false);
    handleFiles(event.dataTransfer.files);
  }

  function handleBrowseClick() {
    inputRef.current?.click();
  }

  return (
    <div className="min-h-screen flex flex-col items-center px-4 py-10 sm:py-16">
      <header className="text-center max-w-lg mb-10">
        <h1 className="font-display text-4xl sm:text-5xl font-semibold text-ink tracking-tight">
          Estudio IA
        </h1>
        <p className="mt-3 text-subtle text-base sm:text-lg">
          Aprendé, practicá y evaluá tus conocimientos
        </p>
      </header>

      <main className="w-full max-w-xl">
        <div
          onDragOver={(event) => {
            event.preventDefault();
            setIsDraggingOver(true);
          }}
          onDragLeave={() => setIsDraggingOver(false)}
          onDrop={handleDrop}
          className={`rounded-xl2 border-2 border-dashed p-8 sm:p-12 text-center transition-colors ${
            isDraggingOver ? "border-brand-500 bg-brand-50" : "border-line bg-surface"
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            className="hidden"
            onChange={(event) => handleFiles(event.target.files)}
          />

          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-brand-50">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M12 16V4m0 0 4 4m-4-4-4 4M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3"
                stroke="#3563E9"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          <p className="text-ink font-medium">Arrastrá tu material acá</p>
          <p className="text-subtle text-sm mt-1">Archivos PDF o Word (.docx), hasta 20 MB</p>

          <button
            type="button"
            onClick={handleBrowseClick}
            className="mt-5 inline-flex items-center justify-center rounded-full bg-brand-500 px-6 py-3 text-sm font-medium text-white hover:bg-brand-600 transition-colors"
          >
            Cargar PDF o Word
          </button>
        </div>

        {file && (
          <div className="mt-4 flex items-center justify-between gap-3 rounded-xl2 border border-line bg-surface px-5 py-4 shadow-card">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-brand-50">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path
                    d="M7 3h7l5 5v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z"
                    stroke="#3563E9"
                    strokeWidth="1.6"
                  />
                  <path d="M14 3v5h5" stroke="#3563E9" strokeWidth="1.6" />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-ink">{file.name}</p>
                <p className="text-xs text-subtle">{formatFileSize(file.size)}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onFileRemoved}
              className="flex-shrink-0 text-sm font-medium text-bad-600 hover:text-bad-400 transition-colors"
            >
              Eliminar archivo
            </button>
          </div>
        )}

        {error && (
          <p className="mt-4 rounded-lg bg-bad-50 px-4 py-3 text-sm text-bad-600">{error}</p>
        )}

        <button
          type="button"
          onClick={onGenerate}
          disabled={!file || isBusy}
          className="mt-6 w-full rounded-full bg-brand-500 px-6 py-4 text-base font-medium text-white transition-colors hover:bg-brand-600 disabled:cursor-not-allowed disabled:bg-line disabled:text-subtle"
        >
          {isBusy ? busyMessage || "Generando evaluación…" : "Generar evaluación"}
        </button>
      </main>
    </div>
  );
}
