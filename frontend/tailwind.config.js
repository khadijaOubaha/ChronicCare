/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "monospace"],
      },
      colors: {
        brand: {
          950: "#0b2f3d",
          900: "#0f3b4c",
          800: "#164a5d",
          600: "#148f84",
          500: "#1aa699",
          100: "#d6f2ee",
        },
        surface: "#f6f8fa",
      },
    },
  },
  plugins: [],
};
