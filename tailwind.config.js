/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Neo-Brutalist Stitch Palette
        "surface": "#F9F9F7",
        "surface-dim": "#DADAD8",
        "surface-bright": "#F9F9F7",
        "surface-container-lowest": "#FFFFFF",
        "surface-container-low": "#F4F4F2",
        "surface-container": "#EEEEEC",
        "surface-container-high": "#E8E8E6",
        "surface-container-highest": "#E2E3E1",
        "surface-variant": "#E2E3E1",
        "on-surface": "#1A1C1B",
        "on-surface-variant": "#4E4633",
        "inverse-surface": "#2F3130",
        "inverse-on-surface": "#F1F1EF",
        "outline": "#7F7660",
        "outline-variant": "#D1C5AC",
        
        // Canary Yellow (Primary)
        "primary": "#735C00",
        "on-primary": "#FFFFFF",
        "primary-container": "#FFD027",
        "on-primary-container": "#705900",
        "primary-fixed": "#FFE087",
        "primary-fixed-dim": "#EFC110",

        // Neon Green (Secondary)
        "secondary": "#086E00",
        "on-secondary": "#FFFFFF",
        "secondary-container": "#87F96E",
        "on-secondary-container": "#087300",
        "secondary-fixed": "#8AFC71",
        "secondary-fixed-dim": "#6EDF58",
        "on-secondary-fixed": "#012200",
        "on-secondary-fixed-variant": "#045300",

        // Bubblegum / Coral Pink (Tertiary)
        "tertiary": "#AD2C4F",
        "on-tertiary": "#FFFFFF",
        "tertiary-container": "#FFC7CE",
        "on-tertiary-container": "#AA2A4C",
        "tertiary-fixed": "#FFD9DD",
        "tertiary-fixed-dim": "#FFB2BD",

        // Error
        "error": "#BA1A1A",
        "on-error": "#FFFFFF",
        "error-container": "#FFDAD6",
        "on-error-container": "#93000A",
      },
      fontFamily: {
        sans: ["'Space Grotesk'", "sans-serif"],
        display: ["'Space Grotesk'", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
      boxShadow: {
        'brutal-sm': '2px 2px 0px #000000',
        'brutal': '4px 4px 0px #000000',
        'brutal-md': '6px 6px 0px #000000',
        'brutal-lg': '8px 8px 0px #000000',
      },
      borderWidth: {
        '3': '3px',
      }
    },
  },
  plugins: [],
}
