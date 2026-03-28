import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "api.dicebear.com",
      },
      {
        protocol: "https",
        hostname: "**.vkuserphoto.ru",
      },
    ],
  },
  allowedDevOrigins: ["f63c-79-127-145-30.ngrok-free.app"],
};

export default nextConfig;
