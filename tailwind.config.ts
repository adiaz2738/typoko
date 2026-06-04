import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#0f0f13",
        surface: "#1a1a22",
        border: "#2a2a36",
        muted: "#737373",
        text: "#d4d4d4",
        subtle: "#a3a3a3",
        accent: "#e2b714",
        correct: "#4ade80",
        incorrect: "#f87171",
        current: "#ffffff",
      },
      fontFamily: {
        mono: ["'JetBrains Mono'", "Menlo", "Monaco", "Consolas", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
