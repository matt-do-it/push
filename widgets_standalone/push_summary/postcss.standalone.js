const tailwindcss = require("tailwindcss");
module.exports = {
  plugins: [
    "postcss-preset-env",
    tailwindcss,
    require("postcss-prefix-selector")({
      prefix: ".push",
      transform(prefix, selector, prefixedSelector, filePath, rule) {
      	if (!selector.startsWith(".")) {
	      	console.log(selector, " / ", prefixedSelector, " / ", filePath);
      	}
      	if (selector == "html" || selector == "body") {
      		return ".push";
      	}
      	if (selector == ":root") {
      		return ".push";
      	}
      	return prefixedSelector;
      },
    }),
  ],
};
