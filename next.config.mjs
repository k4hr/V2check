/** @type {import('next').NextConfig} */
const nextConfig = {
  // Собираем серверное приложение, без static export.
  output: 'standalone',

  // Можно оставить пустым, но добавлю пару безопасных плюшек.
  experimental: {
    typedRoutes: true,
  },

  // Если используешь basePath/headers — добавим позже; сейчас не нужно.
};

export default nextConfig;
