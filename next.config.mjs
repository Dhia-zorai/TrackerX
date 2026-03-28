/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'media.valorant-api.com' },
    ],
  },
  experimental: {
    forceSwcTransforms: true,
  },
};
export default nextConfig;
