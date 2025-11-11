/** @type {import('tailwindcss').Config} */
module.exports = {
  // Tailwind v4 uses CSS-first configuration via @theme in globals.css
  // This file is kept minimal for compatibility
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
}
