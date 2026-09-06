# Estudio IA

Aplicación web educativa: el estudiante carga un PDF o Word propio, una IA genera
una evaluación de opción múltiple de exactamente 20 preguntas a partir de ese
material, y la aplicación corrige y muestra la nota al finalizar.

Funciona como sitio web y como **PWA instalable** (se puede agregar a la
pantalla de inicio o instalar como app de escritorio).

## Arquitectura

```
Frontend (Next.js, React)  →  /api/generate-questions (función serverless de Vercel)  →  API de Anthropic (Claude)  →  Frontend
```

- **Extracción de texto**: ocurre enteramente en el navegador.
  - PDF → [`pdfjs-dist`](https://www.npmjs.com/package/pdfjs-dist)
  - DOCX → [`mammoth`](https://www.npmjs.com/package/mammoth)
  - El archivo original nunca se sube a un servidor: solo se envía el
    **texto ya extraído** a la función serverless.
- **Generación de preguntas**: la función serverless `/api/generate-questions`
  recibe el texto, arma el prompt y llama a la API de Anthropic. Ahí, y solo
  ahí, se lee la variable de entorno `ANTHROPIC_API_KEY`. La clave nunca
  viaja al navegador.
- **Corrección**: es 100% local, usando el campo `correctAnswer` que generó
  la IA al crear la evaluación. No se vuelve a consultar a la IA para
  corregir, lo que garantiza una corrección consistente y reduce el consumo
  de API (una sola llamada genera las 20 preguntas).
- **Privacidad**: no hay base de datos ni almacenamiento permanente de
  archivos. El material vive en memoria del navegador durante la sesión y
  se descarta al eliminar el archivo o cerrar la pestaña.

## Estructura de carpetas

```
src/
  pages/
    index.js              → pantalla principal (máquina de estados de la app)
    _app.js / _document.js
    api/
      generate-questions.js → función serverless que llama a la IA
  components/
    FileUploadScreen.js    → carga de archivo (drag & drop)
    QuizScreen.js          → las 20 preguntas, navegación y progreso
    ResultsScreen.js       → nota, resumen y corrección detallada
    ProgressBar.js         → barra lineal y anillo circular de progreso
    InstallPrompt.js       → botón "Instalar aplicación" (PWA)
    LoadingOverlay.js
  utils/
    extractPdf.js          → extracción de texto de PDF (PDF.js)
    extractDocx.js         → extracción de texto de Word (Mammoth.js)
    cleanText.js           → limpieza y validación de longitud del texto
    validateQuestions.js   → validación estricta del JSON devuelto por la IA
    scoring.js             → cálculo de la nota y mensajes de resultado
public/
  manifest.json, sw.js, icons/, favicon.ico, pdf.worker.min.js (generado)
```

## Requisitos

- Node.js 18 o superior
- Una cuenta de Anthropic con una API key (https://console.anthropic.com)

## Desarrollo local

```bash
npm install
cp .env.example .env.local
# completar ANTHROPIC_API_KEY en .env.local
npm run dev
```

La aplicación queda disponible en `http://localhost:3000`.

> `npm install` copia automáticamente el worker de PDF.js a `public/pdf.worker.min.js`
> (ver `scripts/copy-pdf-worker.js`). Es necesario para que la lectura de PDF
> funcione en el navegador.

## Despliegue en Vercel

1. Subir este proyecto a un repositorio de GitHub.
2. En Vercel: **New Project** → importar el repositorio.
3. En **Settings → Environment Variables**, agregar:
   - `ANTHROPIC_API_KEY` = tu clave real (nunca se sube al repo)
   - `ANTHROPIC_MODEL` = `claude-sonnet-4-6` (opcional, ya es el valor por defecto)
4. Deploy. Vercel detecta Next.js automáticamente.

## Instalación como PWA

Una vez desplegada (o corriendo en `localhost`), el navegador ofrece instalar
la app. La aplicación también muestra su propio botón **"Instalar
aplicación"** cuando el navegador lo permite. Instalada, se abre como una
ventana independiente, sin la barra del navegador.

## Límites de la primera versión (a propósito)

- Solo PDF con capa de texto y DOCX. PDF escaneados (imágenes) quedan
  preparados para una futura integración de OCR — ver el comentario en
  `src/utils/extractPdf.js`.
- Sin historial, sin materias, sin perfiles de usuario: la arquitectura
  (pantallas + utils separados) está pensada para agregar esas funciones
  después sin rehacer el flujo actual.

## Notas de costos

Cada evaluación se genera con **una sola llamada** a la API (las 20 preguntas
juntas). La corrección es local. Regenerar preguntas ("Nueva evaluación")
hace una nueva llamada, reutilizando el texto ya extraído del material (no
vuelve a leer el archivo).
