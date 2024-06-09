const tailwindcss = require("tailwindcss");
module.exports = {
  plugins: [
    "postcss-preset-env",
    tailwindcss,
    require("postcss-prefix-selector")({
      prefix: ".push",
      transform(prefix, selector, prefixedSelector, filePath, rule) {
      return selector;
        if (selector.match(/^(html|body)/)) {
          return selector;
        }
        if (selector.match(/^--/)) {
          return selector;
        }

        return prefixedSelector;
      },
    }),
  ],
};
