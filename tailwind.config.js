/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)'],
        display: ['var(--font-display)'],
      },
      colors: {
        purdue: {
          gold: '#CEB888',
          black: '#000000',
          rush: '#DAAA00',
          field: '#DDB945',
          dust: '#EBD99F',
          aged: '#8E6F3E',
          steel: '#555960',
          cool: '#6F727B',
          moon: '#C4BFC0',
        }
      }
    },
  },
  plugins: [],
}
