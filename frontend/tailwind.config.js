/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        border: "hsl(214 18% 88%)",
        background: "hsl(42 24% 97%)",
        foreground: "hsl(220 20% 12%)",
        muted: "hsl(210 18% 94%)",
        primary: "hsl(166 58% 27%)",
        accent: "hsl(28 86% 54%)",
      },
      boxShadow: {
        soft: "0 12px 32px rgba(20, 24, 31, 0.08)",
      },
    },
  },
  plugins: [],
};
