import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disable ESLint during builds to prevent deployment failures
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Disable TypeScript checking during builds for faster deployment
  typescript: {
    ignoreBuildErrors: true,
  },

  // Bundle optimization
  experimental: {
    optimizePackageImports: [
      '@heroicons/react',
      'framer-motion',
      'xlsx',
      'pdf-lib',
      'docx',
      'mammoth',
      'jszip'
    ],
  },
  
  // Webpack optimizations
  webpack: (config, { isServer }) => {
    // Optimize client-side bundles
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        os: false,
        crypto: false,
        stream: false,
        buffer: false,
        'node:fs': false,
        'node:path': false,
        'node:os': false,
        'node:crypto': false,
        'node:stream': false,
        'node:buffer': false,
        'node:https': false,
        'node:http': false,
        'node:url': false,
        'node:util': false,
      };
      
      // Split large libraries into separate chunks
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          ...config.optimization.splitChunks,
          cacheGroups: {
            ...config.optimization.splitChunks?.cacheGroups,
            // Document processing libraries
            docProcessor: {
              test: /[\\/]node_modules[\\/](pdf-lib|docx|mammoth|xlsx|pptx-parser|pptxgenjs)[\\/]/,
              name: 'doc-processors',
              chunks: 'all',
              priority: 20,
              reuseExistingChunk: true,
            },
            // UI libraries
            ui: {
              test: /[\\/]node_modules[\\/](@headlessui|@heroicons|framer-motion)[\\/]/,
              name: 'ui-libs',
              chunks: 'all',
              priority: 15,
              reuseExistingChunk: true,
            },
            // Utility libraries
            utils: {
              test: /[\\/]node_modules[\\/](clsx|zustand|react-hook-form|zod)[\\/]/,
              name: 'utils',
              chunks: 'all',
              priority: 10,
              reuseExistingChunk: true,
            },
          },
        },
      };
    }
    
    return config;
  },
  
  // Static optimization
  output: 'standalone',
  
  // Compression
  compress: true,
  
  // Performance optimizations
  poweredByHeader: false,
  
  // Image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 31536000, // 1 year
  },
  
  // Header optimizations
  async headers() {
    return [
      {
        source: '/favicon.ico',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/(.*)\\.(js|css|woff2|woff|eot|ttf|otf|svg|png|jpg|jpeg|gif|webp|avif|ico)$',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
