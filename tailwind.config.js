/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,jsx}",
    "./src/components/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Paleta pedida en el brief: fondo claro, azul principal,
        // verde/rojo para correcciones, gris neutro para lo secundario.
        paper: "#F7F8FB",
        surface: "#FFFFFF",
        ink: "#1D2433",
        subtle: "#5B6472",
        line: "#E3E7EF",
        brand: {
          50: "#EEF3FF",
          100: "#DCE6FF",
          300: "#8FADFB",
          500: "#3563E9",
          600: "#2A4FC4",
          700: "#213E9C",
        },
        good: {
          50: "#EAF7EE",
          400: "#3FB871",
          600: "#1F8A4C",
        },
        bad: {
          50: "#FCEBEC",
          400: "#E4586A",
          600: "#C4293D",
        },
      },
      fontFamily: {
        display: ["var(--font-fraunces)", "Georgia", "serif"],
        body: ["var(--font-lexend)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        xl2: "1.25rem",
      },
      boxShadow: {
        card: "0 1px 2px rgba(29, 36, 51, 0.04), 0 8px 24px -12px rgba(29, 36, 51, 0.12)",
      },
    },
  },
  plugins: [],
};
