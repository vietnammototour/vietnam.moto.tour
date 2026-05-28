/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  i18n: {
    locales: ["vi", "en"],
    defaultLocale: "vi",
  },
  images: {
    remotePatterns: [
      {protocol: "https", hostname: "**"},
    ],
  },
  async rewrites() {
    return [
      {source: "/uploads/:path*", destination: "/api/uploads/:path*"},
    ];
  },
};

export default nextConfig;
