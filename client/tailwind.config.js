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
        primary: {
          DEFAULT: '#003092',
          50: '#e6eeff',
          100: '#c0d4ff',
          200: '#9ab9ff',
          300: '#749eff',
          400: '#4e83ff',
          500: '#2868ff',
          600: '#0e4dff',
          700: '#003092', // Main primary color
          800: '#002878',
          900: '#001f5e',
          950: '#00153f',
        },
        secondary: {
          DEFAULT: '#00879E',
          50: '#e6f7fa',
          100: '#c0eaf2',
          200: '#9adce9',
          300: '#74cfe1',
          400: '#4ec1d8',
          500: '#28b4cf',
          600: '#00a7c7',
          700: '#00879E', // Main secondary color
          800: '#006b7e',
          900: '#00505e',
          950: '#00353f',
        },
        accent: {
          DEFAULT: '#FFAB5B',
          50: '#fff8f0',
          100: '#ffecd8',
          200: '#ffe0c0',
          300: '#ffd4a8',
          400: '#ffc790',
          500: '#ffbb78',
          600: '#ffaf60',
          700: '#FFAB5B', // Main accent color
          800: '#cc8949',
          900: '#996737',
          950: '#664525',
        },
        neutral: {
          DEFAULT: '#FFF2DB',
          50: '#fffefb',
          100: '#fffcf7',
          200: '#fffaf3',
          300: '#fff8ef',
          400: '#fff6eb',
          500: '#fff4e7',
          600: '#fff3e3',
          700: '#FFF2DB', // Main neutral color
          800: '#ccc2af',
          900: '#999183',
          950: '#666158',
        },
        dark: {
          100: '#d1d5db',
          200: '#9ca3af',
          300: '#6b7280',
          400: '#4b5563',
          500: '#374151',
          600: '#1f2937',
          700: '#111827',
          800: '#0f172a',
          900: '#030712',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['Fira Code', 'monospace'],
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
      },
    },
  },
  plugins: [],
}
