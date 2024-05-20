'use strict';

const EmberApp = require('ember-cli/lib/broccoli/ember-app');

module.exports = function (defaults) {
  const app = new EmberApp(defaults, {
    'ember-cli-babel': { enableTypeScriptTransform: true },
    storeConfigInMeta: false,
    fingerprint: {
      enabled: false
    },
    'ember-cli-terser': {
      enabled: false
    }
  });

  return app.toTree();
};
