import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Several lockfiles exist above this folder; pin the root so Next doesn't
  // infer the wrong one and mis-resolve modules.
  turbopack: { root: __dirname },
  poweredByHeader: false,
  reactStrictMode: true,
  serverExternalPackages: ["mongoose", "bcryptjs", "exceljs"],
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-DNS-Prefetch-Control", value: "on" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(self), payment=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
