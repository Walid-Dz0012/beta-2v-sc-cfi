/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'https://beta-2v-sc-cfi.vercel.app/api/:path*'
      }
    ]
  }
}

module.exports = nextConfig
