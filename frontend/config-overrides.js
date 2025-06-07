const webpack = require('webpack');

module.exports = function override(config) {
  // Add fallbacks for node modules
  const fallback = config.resolve.fallback || {};
  Object.assign(fallback, {
    assert: require.resolve('assert'),
    buffer: require.resolve('buffer'),
    crypto: require.resolve('crypto-browserify'),
    http: require.resolve('stream-http'),
    https: require.resolve('https-browserify'),
    os: require.resolve('os-browserify/browser'),
    path: require.resolve('path-browserify'),
    process: require.resolve('process/browser'),
    stream: require.resolve('stream-browserify'),
    url: require.resolve('url'),
    util: require.resolve('util'),
    zlib: require.resolve('browserify-zlib'),
  });
  config.resolve.fallback = fallback;

  // Add plugins
  config.plugins = (config.plugins || []).concat([
    new webpack.ProvidePlugin({
      process: 'process/browser',
      Buffer: ['buffer', 'Buffer'],
    }),
    new webpack.DefinePlugin({
      'process.env': JSON.stringify(process.env),
    }),
  ]);

  // Add resolve extensions
  config.resolve.extensions = [...(config.resolve.extensions || []), '.ts', '.js', '.mjs'];

  // Add module rules for .mjs files
  config.module.rules.push({
    test: /\.m?js/,
    resolve: {
      fullySpecified: false,
    },
  });

  return config;
}; 