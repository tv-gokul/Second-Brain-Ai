/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverExternalPackages: ["pdf-parse", "@napi-rs/canvas"],
  },
};

export default nextConfig;
