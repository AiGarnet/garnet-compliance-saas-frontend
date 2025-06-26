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

    // Optimize chunks for static export and fix MIME type issues
    if (!dev && !isServer) {
      // Ensure proper file extensions for chunks
      config.output = {
        ...config.output,
        filename: 'static/js/[name]-[contenthash].js',
        chunkFilename: 'static/chunks/[name]-[contenthash].js',
      };

      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          maxSize: 244000, // ~240KB chunks to ensure better caching
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
            // Separate chunk for React/Next.js framework
            framework: {
              test: /[\\/]node_modules[\\/](react|react-dom|next)[\\/]/,
              name: 'framework',
              priority: 40,
              chunks: 'all',
            },
            // Common chunk for utilities
            commons: {
              name: 'commons',
              minChunks: 2,
              priority: 5,
              chunks: 'all',
            },
          },
        },
      };
    }

    // Remove the CSS rule that might conflict with Next.js built-in CSS handling
    // config.module.rules.push({
    //   test: /\.css$/,
    //   use: [
    //     'style-loader',
    //     {
    //       loader: 'css-loader',
    //       options: {
    //         modules: {
    //           auto: true,
    //           localIdentName: '[name]__[local]__[hash:base64:5]',
    //         },
    //       },
    //     },
    //   ],
    // });

    return config;
  },

  // Improve static asset handling
  assetPrefix: process.env.NODE_ENV === 'production' ? '' : '',
  
  // Disable x-powered-by header
  poweredByHeader: false,
  
  // Optimize for static export
  distDir: '.next',
  
  // Add proper rewrites for missing static files (fallback to 404, not index.html)
  async rewrites() {
    return {
      beforeFiles: [
        // These rewrites are checked first and will not be overridden by filesystem routes
      ],
      afterFiles: [
        // These rewrites are checked after pages/public files are checked
        // but before dynamic routes
      ],
      fallback: [
        // These rewrites are checked after both pages and public files
        // are checked but before dynamic routes
        {
          source: '/_next/static/:path*',
          destination: '/404', // Don't redirect static assets to index.html
        },
      ],
    };
  },
  
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