/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        limestone: '#F2F1EC',
        chalk: '#FAFAF7',
        ink: '#151513',
        graphite: '#5C5B55',
        mist: '#D9D7CF',
        oak: { DEFAULT: '#1D5C3F', dark: '#144330', light: '#DDE6DA' },
      },
      fontFamily: {
        serif: ['"Instrument Serif"', 'Georgia', 'serif'],
        sans: ['"Geist Variable"', 'system-ui', 'sans-serif'],
      },
      letterSpacing: { label: '0.14em' },
      maxWidth: { page: '88rem' },
      borderColor: { rule: 'rgba(21,21,19,0.14)' },
    },
  },
  plugins: [],
}
