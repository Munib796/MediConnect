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
      },
      fontFamily: {
        display: ["'Fraunces'", "serif"],
        sans: ["'Public Sans'", "sans-serif"],
        mono: ["'IBM Plex Mono'", "monospace"],
      },
    },
  },
  plugins: [],
};
