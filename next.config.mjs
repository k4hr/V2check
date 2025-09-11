/** @type {import('next').NextConfig} */
const nextConfig = {
  // Собираем серверный бандл, БЕЗ static export.
  output: 'standalone',
  experimental: { typedRoutes: true },
};
export default nextConfig;
