// config-overrides.js

const webpack = require('webpack');

module.exports = function override(config, env) {
  config.resolve.fallback = {
    ...config.resolve.fallback,
    "stream": require.resolve('stream-browserify'),
    "https": require.resolve("https-browserify"),
    "crypto": require.resolve("crypto-browserify"),
    "http": require.resolve("stream-http")
  };

  return config;
};