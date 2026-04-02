import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Hides the floating route dev badge; reduces stray <nextjs-portal> noise in dev tools.
  // Error overlay still works when something breaks.
  devIndicators: false,

  // Enable gzip/brotli compression for all responses.
  compress: true,

  async headers() {
    return [
      {
        // 3D model files — content-addressed by filename convention; safe to cache forever.
        source: "/:path*.glb",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
      {
        // HDRI environment maps — large files that never change at a given path.
        source: "/:path*.hdr",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
      {
        // Web fonts.
        source: "/:path*.woff",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
      {
        source: "/:path*.woff2",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
    ];
  },
};

export default nextConfig;
