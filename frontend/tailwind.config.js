/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        sjec: {
          navy: '#002B49',
          blue: '#005691',
          gold: '#E5A823',
          light: '#F4F7F9'
        }
      }
    },
  },
  plugins: [],
}
