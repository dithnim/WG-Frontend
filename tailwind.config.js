/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./client/src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      keyframes: {
        "slide-down": {
          "0%": { transform: "translate(-50%, -100%)", opacity: 0 },
          "20%": { transform: "translate(-50%, 0)", opacity: 1 },
          "80%": { transform: "translate(-50%, 0)", opacity: 1 },
          "100%": { transform: "translate(-50%, -100%)", opacity: 0 },
        },
      },
      animation: {
        "slide-down": "slide-down 2.5s ease-in-out forwards",
      },
    },
  },
  plugins: [],
};
