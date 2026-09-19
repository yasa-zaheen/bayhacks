import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Required for ngrok / LAN phone demos — otherwise dev JS bundles are blocked
  // and the page looks fine but buttons do nothing.
  allowedDevOrigins: [
    "10.2.1.4",
    "*.ngrok-free.app",
    "*.ngrok.io",
    "*.ngrok.app",
  ],
  async rewrites() {
    return [
      {
        source: "/poseidon-api/:path*",
        destination: "http://127.0.0.1:8000/:path*",
      },
    ];
  },
};

export default nextConfig;
