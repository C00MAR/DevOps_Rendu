/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      colors: {
        'dark-bg': '#1a1a1a',
        'dark-card': '#2a2a2a',
        'dark-border': '#3a3a3a',
        'dark-text': '#e0e0e0',
        'dark-text-secondary': '#a0a0a0',
        'dark-hover': '#4a4a4a',
      }
    },
  },
  plugins: [],
}
