import { useEffect } from "react";
import { Fraunces, Lexend } from "next/font/google";
import "../styles/globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["500", "600"],
  variable: "--font-fraunces",
  display: "swap",
});

const lexend = Lexend({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-lexend",
  display: "swap",
});

export default function App({ Component, pageProps }) {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // El registro del service worker es una mejora progresiva:
        // si falla, la aplicación sigue funcionando sin instalación PWA.
      });
    }
  }, []);

  return (
    <div className={`${fraunces.variable} ${lexend.variable}`}>
      <Component {...pageProps} />
    </div>
  );
}
