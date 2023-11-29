const { addWebpackAlias } = require('customize-cra');
const path = require('path');

module.exports = function override(config, env) {
  return addWebpackAlias({
    'crypto': require.resolve('./node_modules/crypto-browserify'),
    'stream': require.resolve('./node_modules/stream-browserify')
  })(config, env);
};