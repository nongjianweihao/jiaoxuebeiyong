/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['index.html', './src/**/*.{ts,tsx,js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg: 'rgb(var(--bg) / <alpha-value>)',
        surface: 'rgb(var(--surface) / <alpha-value>)',
        card: 'rgb(var(--card) / <alpha-value>)',
        text: 'rgb(var(--text) / <alpha-value>)',
        mute: 'rgb(var(--mute) / <alpha-value>)',
        primary: 'rgb(var(--primary) / <alpha-value>)',
        accent: 'rgb(var(--accent) / <alpha-value>)',
        success: 'rgb(var(--success) / <alpha-value>)',
        warning: 'rgb(var(--warning) / <alpha-value>)',
        danger: 'rgb(var(--danger) / <alpha-value>)',
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
      backgroundImage: {
        'grad-primary': 'var(--grad-primary)',
      },
      borderRadius: {
        xl2: '1.25rem',
      },
    },
  },
  plugins: [],
};
