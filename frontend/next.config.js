// SECURED NEXT.JS CONFIGURATION
const nextConfig = {
  reactStrictMode: true,

  // Security Headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          // DNS Prefetch Control
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          // Frame Options
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          // Content Type Options
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          // XSS Protection
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          // Referrer Policy
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          },
          // Permissions Policy
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()'
          },
          // Content Security Policy
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://clerk.anurag.edu.in https://*.clerk.accounts.dev",
              "worker-src 'self' blob:",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https: blob:",
              "font-src 'self' data: https://fonts.gstatic.com",
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.clerk.accounts.dev https://clerk-telemetry.com https://api.clerk.dev https://*.clerk.dev",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'"
            ].join('; ')
          }
        ]
      }
    ]
  },

  // Image Optimization Configuration
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'img.clerk.com',
      }
    ],
    // Limit image sizes for security
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    formats: ['image/webp'],
  },

  // Webpack Configuration
  webpack: (config, { isServer }) => {
    // Prevent bundling certain modules on server side
    if (isServer) {
      config.externals.push({
        'utf-8-validate': 'commonjs utf-8-validate',
        'bufferutil': 'commonjs bufferutil',
      })
    }

    return config
  },

  // Experimental Features
  experimental: {
    // strictMode is now default or moved
  },

  // Environment Variables (client-side)
  env: {
    NEXT_PUBLIC_APP_NAME: 'Anurag Dattes',
    NEXT_PUBLIC_APP_VERSION: '1.0.0',
  },

  // Disable X-Powered-By header
  poweredByHeader: false,

  // Production optimizations
  swcMinify: true,
  compress: true,

  // Typescript Configuration
  typescript: {
    // Recommended: Set to false in production
    ignoreBuildErrors: false,
  },

  // ESLint Configuration
  eslint: {
    // Recommended: Don't ignore during builds
    ignoreDuringBuilds: false,
  },

  // Output Configuration
  output: 'standalone',

  // Redirects
  async redirects() {
    return [
      // Redirect old URLs if any
      {
        source: '/login',
        destination: '/sign-in',
        permanent: true,
      },
      {
        source: '/register',
        destination: '/sign-up',
        permanent: true,
      }
    ]
  },
}

module.exports = nextConfig
