import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="es">
      <Head>
        <meta charSet="utf-8" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#3563E9" />
        <meta name="description" content="Estudio IA: cargá tu material y generá una evaluación de 20 preguntas para practicar y evaluar tus conocimientos." />
        <link rel="icon" href="/icons/icon-192.png" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </Head>
      <body className="bg-paper text-ink font-body antialiased">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
