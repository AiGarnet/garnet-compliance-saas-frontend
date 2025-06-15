/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // Remove static export for Railway deployment - we want SSR
  // output: 'export', // Commented out for Railway deployment
  trailingSlash: true,
  distDir: '.next',
  
  // Image optimization can be enabled for Railway
  images: {
    // Enable image optimization for Railway deployment
    unoptimized: false,
    domains: [], // Add your image domains here if needed
  },
  
  swcMinify: true,
  
  // Environment variables
  env: {
    // Remove static export flag for Railway
    // NEXT_PUBLIC_STATIC_EXPORT: 'true',
  },
  
  // Optimize bundle size
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  
  // ESLint configuration
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  
  // TypeScript configuration
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true,
  },
  
  // Experimental features
  experimental: {
    // Enable server components
    serverComponentsExternalPackages: ['lodash', 'uuid'],
    // Allow missing generate static params in development
    missingSuspenseWithCSRBailout: false,
  },

  // Configure webpack to properly handle lodash
  webpack: (config, { isServer }) => {
    // This ensures lodash is properly bundled
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        lodash: require.resolve('lodash'),
        uuid: require.resolve('uuid'),
      };
    }
    return config;
  },
  
  // Add headers for better performance and security
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },
}

module.exports = nextConfig 