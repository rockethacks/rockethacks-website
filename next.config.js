/** @type {import('next').NextConfig} */
const nextConfig = {
  // Removed 'output: export' to enable API routes and SSR for authentication
  basePath: '',
  trailingSlash: true,
  
  // Performance optimizations
  reactStrictMode: true,
  swcMinify: true,
  
  // Disable ESLint during production builds
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Disable TypeScript errors during production builds
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // Optimize package imports
  modularizeImports: {
    '@radix-ui/react-icons': {
      transform: '@radix-ui/react-icons/{{member}}',
    },
    'lucide-react': {
      transform: 'lucide-react/dist/esm/icons/{{kebabCase member}}',
    },
  },
  
  // Image optimizations - CRITICAL FOR PERFORMANCE
  images: {
    unoptimized: false, // Enable Next.js image optimization
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'rockethacks.org',
      },
    ],
    formats: ['image/avif', 'image/webp'], // Modern formats for better compression
    deviceSizes: [640, 750, 828, 1080, 1200, 1920], // Responsive image sizes
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384], // Icon and small image sizes
    minimumCacheTTL: 60 * 60 * 24 * 365, // Cache images for 1 year
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  
  // Environment variables
  env: {
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  },
  
  // Experimental features for better performance
  experimental: {
    optimizePackageImports: ['framer-motion', 'react-icons', '@radix-ui/react-accordion', '@radix-ui/react-tabs'],
  },
  
  // Security headers for production
  async headers() {
    return [
      {
        // Apply security headers to all routes
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          }
        ],
      },
    ]
  },
  
  webpack(config, { dev, isServer }) {
    // SVG handling
    config.module.rules.push({
      test: /\.svg$/,
      use: ['@svgr/webpack'],
    });
    
    // Optimization for development
    if (dev && !isServer) {
      config.optimization = {
        ...config.optimization,
        removeAvailableModules: false,
        removeEmptyChunks: false,
        splitChunks: false,
      };
    }
    
    return config;
  }
};

module.exports = nextConfig;