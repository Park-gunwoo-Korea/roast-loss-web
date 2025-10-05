/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        cream: "#F4EFE8",
        mocha: "#D5BDA4",
        roast: "#4B2E2B",
      },
      fontFamily: {
        sans: ['Pretendard Variable','system-ui','Segoe UI','Noto Sans KR','Arial','sans-serif'],
      },
      boxShadow: { soft: "0 6px 20px rgba(0,0,0,0.08)" },
      borderRadius: { "2xl": "1rem" },
    },
  },
  plugins: [],
};