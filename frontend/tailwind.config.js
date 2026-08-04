/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#10241F",
        teal: {
          DEFAULT: "#0D6E64",
          dark: "#094F48",
          light: "#E4F1EF",
        },
        marigold: {
          DEFAULT: "#E8A233",
          dark: "#C88420",
          light: "#FCF0DC",
        },
        paper: "#F4F7F5",
        slate: {
          DEFAULT: "#5B6B67",
          light: "#8A9793",
        },
        coral: {
          DEFAULT: "#C1443C",
          light: "#FBE9E7",
        },
        // Success / "all clear" state — a calmer green than the teal brand,
        // reserved for completed payments and finished visits so it reads
        // distinctly from the primary teal used for interactive elements.
        sage: {
          DEFAULT: "#2E7D5B",
          light: "#E3F2EA",
        },
      },
      fontFamily: {
        display: ["'Fraunces'", "serif"],
        sans: ["'Public Sans'", "sans-serif"],
        mono: ["'IBM Plex Mono'", "monospace"],
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "translateY(12px) scale(0.98)" },
          "100%": { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        // Expanding ring behind the live "now serving" dot.
        "pulse-ring": {
          "0%": { transform: "scale(0.9)", opacity: "0.7" },
          "70%, 100%": { transform: "scale(2.2)", opacity: "0" },
        },
        // Three-dot typing indicator for the assistant.
        "typing-bounce": {
          "0%, 80%, 100%": { transform: "translateY(0)", opacity: "0.4" },
          "40%": { transform: "translateY(-4px)", opacity: "1" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.5s ease-out both",
        "fade-in": "fade-in 0.4s ease-out both",
        "scale-in": "scale-in 0.22s ease-out both",
        "pulse-ring": "pulse-ring 1.8s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "typing-bounce": "typing-bounce 1.2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
