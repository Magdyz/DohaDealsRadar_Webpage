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
        primary: {
          DEFAULT: '#6750A4',
          light: '#7965AF',
          dark: '#553C8B',
        },
        accent: {
          hot: '#FF4B4B',
          cold: '#4BB3FF',
        },
        background: {
          DEFAULT: '#FFFFFF',
          secondary: '#F5F5F5',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          variant: '#E7E0EC',
        },
        text: {
          primary: '#1C1B1F',
          secondary: '#49454F',
          tertiary: '#79747E',
        },
      },
    },
  },
  plugins: [],
}
