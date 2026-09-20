/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./client/src/**/*.{js,ts,jsx,tsx}", "./client/public/index.html"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#d900ff", // brand magenta
          light: "#00d2ff", // brand cyan
          dark: "#d900ff", // brand magenta
        },
        accent: {
          DEFAULT: "#00d2ff", // brand cyan
        },
        slate: require("tailwindcss/colors").slate,
        zinc: require("tailwindcss/colors").zinc,
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui"],
        heading: ["Inter", "ui-sans-serif", "system-ui"],
      },
    },
  },
  plugins: [
    require("@tailwindcss/forms"),
    require("@tailwindcss/typography"),
    require("@tailwindcss/aspect-ratio"),
    require("tailwindcss-animate"),
  ],
};
