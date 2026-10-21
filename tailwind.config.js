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
        chinese: {
          red: '#dc2626',
          gold: '#eab308',
          jade: '#059669',
          ink: '#18181b',
        }
      },
      fontFamily: {
        chinese: ['"PingFang SC"', '"Noto Sans SC"', '"Microsoft YaHei"', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
