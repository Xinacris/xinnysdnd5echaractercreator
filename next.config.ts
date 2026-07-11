import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/karakter/yeni", destination: "/character/new", permanent: true },
      { source: "/karakter/:id", destination: "/character/:id", permanent: true },
    ];
  },
};

export default nextConfig;
