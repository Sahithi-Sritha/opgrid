/** @type {import('next').NextConfig} */
const nextConfig = {
  output: process.env.STATIC_EXPORT === 'true' ? 'export' : 'standalone',
  trailingSlash: process.env.STATIC_EXPORT === 'true',
  typescript: {
    ignoreBuildErrors: false,
  },
  turbopack: {
    root: __dirname,
  },
}

module.exports = nextConfig
