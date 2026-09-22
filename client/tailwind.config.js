/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#0b0f19",
          900: "#0f1424",
          800: "#161d33",
          700: "#212a45",
          600: "#2c3759",
        },
        amber: {
          DEFAULT: "#f2b84b",
          soft: "#f7d089",
          dim: "#a97f2f",
        },
      },
      fontFamily: {
        mono: ["JetBrains Mono", "Fira Code", "ui-monospace", "SFMono-Regular", "monospace"],
        display: ["Space Grotesk", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(242,184,75,0.15), 0 0 24px rgba(242,184,75,0.08)",
      },
    },
  },
  plugins: [],
};
