/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === 'production';

const nextConfig = {
  // компактный билд для Docker: можно запускать "next start" или .next/standalone
  output: 'standalone',

  reactStrictMode: true,
  compress: true,
  poweredByHeader: false,

  // уменьшаем размер образа и билд-артефактов
  productionBrowserSourceMaps: false,

  // чтобы не тащить sharp в slim-образ
  images: { unoptimized: true },

  // в проде выпиливаем лишние console.* (кроме ошибок/ворнингов)
  compiler: isProd
    ? { removeConsole: { exclude: ['error', 'warn'] } }
    : {},

  // экономим на бандле
  experimental: {
    typedRoutes: true,
    optimizePackageImports: ['react', 'react-dom', 'framer-motion'],
  },

  // не стопим билд, если типы/eslint не настроены
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },

  // мелкие заголовки (не трогаем CSP/XFO — этим заведует middleware.ts)
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-DNS-Prefetch-Control', value: 'on' }
        ],
      },
    ];
  },

  // немного стабильности для исходящих запросов
  httpAgentOptions: { keepAlive: true },
};

export default nextConfig;
