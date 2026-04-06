import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Hides the floating route dev badge; reduces stray <nextjs-portal> noise in dev tools.
  // Error overlay still works when something breaks.
  devIndicators: false,

  // Enable gzip/brotli compression for all responses.
  compress: true,

  // `VERCEL` is not available in the browser bundle; inline so FPS overlay can enable on deploys.
  env: {
    NEXT_PUBLIC_VERCEL_DEPLOY: process.env.VERCEL === "1" ? "1" : "0",
  },

  async headers() {
    return [
      {
        // Prevent bfcache on the main page — on mobile Safari, bfcache destroys
        // the WebGL context and the page restores frozen/blank. no-store opt-out
        // forces a fresh load on back/forward navigation.
        source: "/",
        headers: [{ key: "Cache-Control", value: "no-store" }],
      },
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
