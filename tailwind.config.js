/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'clevr-blue': '#0090FF',
        // Optional: override indigo to match if needed, but safer to use custom class
        indigo: {
          50: '#eef8ff',
          100: '#dcf1ff',
          200: '#bce4ff',
          300: '#8ed1ff',
          400: '#59b5ff',
          500: '#0090FF', // Primary Brand Color
          600: '#0070db',
          700: '#0058b7',
          800: '#004b95',
          900: '#063e73',
          950: '#04274d',
        }
      }
    },
  },
  plugins: [],
}
