/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          0: "#0A0A0B",
          50: "#121214",
          100: "#17171A",
          200: "#1F1F23",
          300: "#2A2A30",
          400: "#3A3A42",
          500: "#55555E",
        },
        bone: {
          0: "#F5F3EE",
          100: "#E8E5DE",
          200: "#C4C1BA",
          300: "#8E8C87",
        },
        gold: {
          DEFAULT: "#D4A13E",
          soft: "#E8C27A",
          dim: "#9A7528",
        },
        // Official MTA line bullets
        mta: {
          red: "#EE352E", // 1 2 3
          green: "#00933C", // 4 5 6
          purple: "#B933AD", // 7
          blue: "#0039A6", // A C E
          orange: "#FF6319", // B D F M
          lime: "#6CBE45", // G
          brown: "#996633", // J Z
          grey: "#A7A9AC", // L
          yellow: "#FCCC0A", // N Q R W
          slate: "#808183", // S
          sir: "#053F8E",
        },
      },
      fontFamily: {
        mono: [
          "JetBrains Mono",
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "monospace",
        ],
        sans: [
          "DM Sans",
          "-apple-system",
          "system-ui",
          "Segoe UI",
          "sans-serif",
        ],
      },
      fontSize: {
        hero: ["5.5rem", { lineHeight: "1", letterSpacing: "-0.04em" }],
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(212,161,62,0.15), 0 10px 40px -10px rgba(212,161,62,0.35)",
      },
      keyframes: {
        staleness: {
          "0%, 100%": { opacity: "0.6" },
          "50%": { opacity: "1" },
        },
        pulsegold: {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(212,161,62,0.4)" },
          "50%": { boxShadow: "0 0 0 8px rgba(212,161,62,0)" },
        },
      },
      animation: {
        staleness: "staleness 2s ease-in-out infinite",
        pulsegold: "pulsegold 2s ease-out infinite",
      },
    },
  },
  plugins: [],
};
