/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  i18n: {
    locales: ["vi", "en"],
    defaultLocale: "vi",
  },
  images: {
    remotePatterns: [
      {protocol: "https", hostname: "i0.wp.com"},
      {protocol: "https", hostname: "jolandblog.com"},
      {protocol: "https", hostname: "images.ctfassets.net"},
      {protocol: "https", hostname: "**.ctfassets.net"},
      {protocol: "https", hostname: "images.unsplash.com"},
      {protocol: "https", hostname: "res.cloudinary.com"},
      {protocol: "https", hostname: "lh3.googleusercontent.com"},
    ],
  },
  async rewrites() {
    return [
      {source: "/uploads/:path*", destination: "/api/uploads/:path*"},
    ];
  },
};

export default nextConfig;
