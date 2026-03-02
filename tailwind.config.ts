import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        gold: "#CFB991",
        "gold-light": "#F5EDDE",
        boiler: "#000000",
        dust: "#8E6F3E",
        steel: "#555960",
        steam: "#9D9795",
        rail: "#C4BFC0",
        campus: "#6F727B",
        moon: "#BAA892",
      },
      fontFamily: {
        display: ['"DM Serif Display"', "Georgia", "serif"],
        body: ['"DM Sans"', "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
