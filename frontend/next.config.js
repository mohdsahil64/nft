/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [],
  },
  // Vercel handles this automatically, but good to be explicit
  output: 'standalone',
};

module.exports = nextConfig;
