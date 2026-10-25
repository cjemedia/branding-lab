/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverComponentsExternalPackages: ['@react-pdf/renderer'],
    outputFileTracingIncludes: {
      '/api/experiments/[id]/pdf': ['./assets/fonts/**'],
    },
  },
}

module.exports = nextConfig
