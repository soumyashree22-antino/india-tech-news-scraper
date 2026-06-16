/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        'app-bg':      '#080808',
        'app-surface': '#111111',
        'app-surface2':'#1a1a1a',
        'app-border':  '#222222',
        primary:       '#6366f1',
        'primary-glow':'rgba(99,102,241,0.25)',
      },
      animation: {
        'spin-slow': 'spin 2s linear infinite',
      },
    },
  },
  plugins: [],
}
