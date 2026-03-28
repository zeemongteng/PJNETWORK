import type { NextConfig } from 'next'

const isDev = process.env.NODE_ENV === 'development'

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  allowedDevOrigins: ['*.vusercontent.net'],
  // Proxy /api/* to the local FastAPI server only in development.
  // In production Vercel routes /api/* directly to the Python function.
  ...(isDev && {
    async rewrites() {
      return [
        {
          source: '/api/:path*',
          destination: 'http://localhost:8000/:path*',
        },
      ]
    },
  }),
}

export default nextConfig
