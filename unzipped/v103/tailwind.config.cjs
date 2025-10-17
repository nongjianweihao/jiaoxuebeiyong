module.exports = {
  darkMode: ['class'],
  content: ['index.html', './src/**/*.{ts,tsx,js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f5fbff',
          100: '#e0f2ff',
          200: '#b9e5ff',
          300: '#83d1ff',
          400: '#38b4ff',
          500: '#0a96f0',
          600: '#0074c5',
          700: '#005a9b',
          800: '#004576',
          900: '#02375d',
        },
      },
    },
  },
  plugins: [],
};
