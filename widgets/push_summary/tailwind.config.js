'use strict';

  module.exports = {
    content: [`./app/**/*.{html,js,ts,hbs}`, `./addon/**/*.{html,js,ts,hbs}`],
    theme: {
      extend: {  },
    },
    plugins: [
        require('daisyui'),
    ],
  };
