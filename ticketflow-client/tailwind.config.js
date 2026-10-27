/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
        },
        surface: {
          950: '#0a0a0f',
          900: '#0f0f1a',
          800: '#161625',
          700: '#1e1e32',
          600: '#2a2a40',
          500: '#3a3a55',
          400: '#94a3b8',
          300: '#cbd5e1',
        },
        accent: {
          400: '#2dd4bf',
          500: '#14b8a6',
          600: '#0d9488',
        },
        danger: {
          400: '#fb7185',
          500: '#f43f5e',
          600: '#e11d48',
        },
        warning: {
          400: '#fbbf24',
          500: '#f59e0b',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
