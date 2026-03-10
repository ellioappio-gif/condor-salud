import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        celeste: { DEFAULT: "#75AADB", dark: "#4A7FAF", light: "#A8CCE8", pale: "#E4F0F9" },
        gold: { DEFAULT: "#F6B40E", pale: "#FEF5DC" },
        ink: { DEFAULT: "#1A1A1A", light: "#666666", muted: "#999999" },
        border: { DEFAULT: "#D4E4F0", light: "#E8F0F6" },
      },
      fontFamily: {
        display: ['"DM Sans"', "sans-serif"],
        body: ['"DM Sans"', "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
