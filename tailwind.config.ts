/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "selector",
  content: [
    "./components/**/*.{js,vue,ts}",
    "./layouts/**/*.vue",
    "./pages/**/*.vue",
    "./plugins/**/*.{js,ts}",
    "./app.vue",
    "./error.vue",
  ],
  plugins: [require("tailwindcss-primeui"), require("@tailwindcss/typography")],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1500px",
      },
    },
  },
};
