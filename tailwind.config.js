/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Vinted-inspired Purple Palette (matching Android)
        primary: {
          DEFAULT: '#C57AF7',
          light: '#E9E4FF',
          dark: '#9046CF',
        },
        action: {
          primary: '#9046CF',
        },
        // Backgrounds
        background: {
          DEFAULT: '#FAFBFC',
          secondary: '#F3F4F6',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          variant: '#F3F4F6',
        },
        // Text
        text: {
          primary: '#0F1419',
          secondary: '#5B7083',
          tertiary: '#8B96A3',
        },
        // Vote colors
        hot: {
          bg: '#FFF4ED',
          content: '#FF6B35',
        },
        cold: {
          bg: '#EFF6FF',
          content: '#4A90E2',
        },
        // Borders
        border: {
          DEFAULT: '#E8EAED',
          light: '#F3F4F6',
        },
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
