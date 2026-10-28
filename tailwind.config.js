/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx}", "./components/**/*.{js,jsx}", "./features/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        background: "var(--bg)",
        foreground: "var(--tx)",
        muted: "var(--mut)",
        surface: "var(--surface)",
        "surface-strong": "var(--surface-strong)",
        border: "var(--line)",
        accent: "var(--accent)",
      },
      boxShadow: {
        glass: "var(--shadow)",
      },
      borderRadius: {
        card: "var(--radius-card)",
      },
    },
  },
  plugins: [],
};
