/** @type {import('next').NextConfig} */
const { i18n } = require('./next-i18next.config');

const nextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: ['192.168.56.1', 'localhost'],
  i18n,
}

module.exports = nextConfig