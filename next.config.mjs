/** @type {import('next').NextConfig} */
const nextConfig = {
  // Собираем серверный бандл для `next start`, без static export:
  output: 'standalone',
  experimental: { typedRoutes: true },
};

export default nextConfig;
