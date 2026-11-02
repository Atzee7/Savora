/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
          950: '#022c22',
        },
        accent: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
        },
        ink: {
          50: '#f2f5f3',
          100: '#e3e9e4',
          200: '#c7d3cb',
          300: '#a5b7aa',
          400: '#7f9786',
          500: '#5f7b68',
          600: '#4a6252',
          700: '#3a4f42',
          800: '#24382d',
          900: '#14261c',
          950: '#0b1711',
        },
        sage: {
          50: '#f6f7f4',
          100: '#eef1ec',
          200: '#e0e6de',
          300: '#cbd5c9',
          400: '#b0bfae',
          500: '#93a692',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 18px 45px -24px rgba(6, 78, 59, 0.35)',
        float: '0 24px 60px -32px rgba(20, 38, 28, 0.45)',
      },
    },
  },
  plugins: [],
}
