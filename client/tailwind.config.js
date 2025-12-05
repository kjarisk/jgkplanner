/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        weekend: '#F4B183',
        primary: '#0F766E',
        'primary-dark': '#0D5D56',
      }
    },
  },
  plugins: [],
}

