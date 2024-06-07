const tailwindcss = require("tailwindcss");
module.exports = {
  plugins: [
    "postcss-preset-env",
    tailwindcss,
    require("postcss-prefix-selector")({
      prefix: ".push",
      transform(prefix, selector, prefixedSelector, filePath, rule) {
        if (selector.match(/^(html|body)/)) {
          return selector;
        }

        return prefixedSelector;
      },
    }),
  ],
};
