module.exports = {
  content: [
    "./index.html",
    "./standalone.html",
    "./src/*.js",
    "./src/*.ts",
    "./src/*.js",
  ],
  theme: {
    extend: {},
  },
  variants: {
    extend: {},
  },
  plugins: [
  	require("daisyui"), 
  	require("@tailwindcss/typography")],
  darkMode: "light",

};
