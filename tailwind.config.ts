import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: { bg: "#16150f", panel: "#1e1c15", line: "#35331f" },
        paper: { DEFAULT: "#ece4cf", dim: "#a39b83" },
        moss: { DEFAULT: "#8fa98a", dim: "#5f7a5c" },
        rust: "#b6603f",
      },
    },
  },
  plugins: [],
};
export default config;
