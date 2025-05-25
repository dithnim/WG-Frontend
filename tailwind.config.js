/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./client/src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      keyframes: {
        "slide-down": {
          "0%": { transform: "translate(-50%, -100%)" },
          "100%": { transform: "translate(-50%, 0)" },
        },
      },
      animation: {
        "slide-down": "slide-down 0.3s ease-out",
      },
    },
  },
  plugins: [],
};
