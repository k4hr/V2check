/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // Не выполнять проверку типов во время `next build`
    ignoreBuildErrors: true,
  },
  eslint: {
    // Не запускать ESLint во время `next build`
    ignoreDuringBuilds: true,
  },
  experimental: {
    typedRoutes: true,
  },
};

export default nextConfig;
