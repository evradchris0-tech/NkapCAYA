const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  outputFileTracingRoot: path.join(__dirname, '../../'),
  experimental: {
    outputFileTracingIncludes: {
      '/**': ['./node_modules/next/**', './node_modules/react/**', './node_modules/react-dom/**'],
    },
  },
};

module.exports = nextConfig;
