const { addWebpackAlias } = require('customize-cra');
const path = require('path');

module.exports = function override(config, env) {
  return addWebpackAlias({
  })(config, env);
};