import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

const currentDir = dirname(fileURLToPath(import.meta.url));
const backendProxyTarget = process.env.BACKEND_PROXY_TARGET ?? "http://127.0.0.1:4949";
const defaultAllowedDevOrigins = ["*.ngrok-free.app"];
const configuredAllowedDevOrigins = process.env.NEXT_ALLOWED_DEV_ORIGINS
  ?.split(",")
  .map((origin) => origin.trim())
  .filter((origin) => origin.length > 0);
const allowedDevOrigins = configuredAllowedDevOrigins?.length
  ? configuredAllowedDevOrigins
  : defaultAllowedDevOrigins;

const nextConfig: NextConfig = {
  reactStrictMode: true,
  allowedDevOrigins,
  turbopack: {
    root: join(currentDir, ".."),
  },
  async rewrites() {
    return [
      {
        source: "/backend/:path*",
        destination: `${backendProxyTarget}/:path*`,
      },
    ];
  },
};

export default nextConfig;
