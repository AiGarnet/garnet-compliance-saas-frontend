/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // Enable static export for Netlify deployment
  output: 'export',
  trailingSlash: true,
  
  // Static export requires unoptimized images
  images: {
    unoptimized: true,
  },
  
  swcMinify: true,
  
  // Environment variables for static export
  env: {
    NEXT_PUBLIC_STATIC_EXPORT: 'true',
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'https://garnet-compliance-saas-production.up.railway.app',
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
  
  // Experimental features for better Netlify compatibility
  experimental: {
    // Enable server components
    serverComponentsExternalPackages: ['lodash', 'uuid'],
    // Allow missing generate static params in development
    missingSuspenseWithCSRBailout: false,
  },

  // Configure webpack to properly handle dependencies and static exports
  webpack: (config, { isServer, dev }) => {
    // This ensures lodash and other dependencies are properly bundled
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        lodash: require.resolve('lodash'),
        uuid: require.resolve('uuid'),
      };
    }

    // Optimize chunks for static export
    if (!dev && !isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            default: {
              minChunks: 2,
              priority: -20,
              reuseExistingChunk: true,
            },
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              priority: -10,
              chunks: 'all',
            },
          },
        },
      };
    }

    // Handle CSS modules properly in static export
    config.module.rules.push({
      test: /\.css$/,
      use: [
        'style-loader',
        {
          loader: 'css-loader',
          options: {
            modules: {
              auto: true,
              localIdentName: '[name]__[local]__[hash:base64:5]',
            },
          },
        },
      ],
    });

    return config;
  },

  // Improve static asset handling
  assetPrefix: process.env.NODE_ENV === 'production' ? '' : '',
  
  // Disable x-powered-by header
  poweredByHeader: false,
  
  // Optimize for static export
  distDir: '.next',
  
  // Handle redirects properly for static export
  async redirects() {
    return [
      {
        source: '/',
        destination: '/dashboard',
        permanent: false,
        has: [
          {
            type: 'cookie',
            key: 'authToken',
          },
        ],
      },
    ];
  },
}

module.exports = nextConfig 