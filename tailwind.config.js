import forms from '@tailwindcss/forms'

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#f2f7ff',
          100: '#e5efff',
          200: '#c5ddff',
          300: '#94c1ff',
          400: '#5da1ff',
          500: '#2e7fff',
          600: '#1561e5',
          700: '#114cc0',
          800: '#123f97',
          900: '#133577',
        },
      },
      boxShadow: {
        card: '0 10px 30px -15px rgba(15, 23, 42, 0.25)',
      },
    },
  },
  plugins: [forms],
}

