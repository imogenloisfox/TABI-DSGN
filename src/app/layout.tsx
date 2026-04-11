import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TABI DSGN TOOLS",
  description:
    "Customise your TABI DSGN jewellery. Choose a ring, pendant or earrings, type your engraving, select your gemstone, and choose your finish.",
  openGraph: {
    title: "TABI DSGN TOOLS",
    description: "Customise your TABI DSGN jewellery — engraving, gemstone, finish.",
    url: "https://tabidsgn.tools",
    siteName: "TABI DSGN",
    images: [{ url: "https://tabidsgn.tools/og-image.jpg", width: 1200, height: 630 }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "TABI DSGN TOOLS",
    description: "Customise your TABI DSGN jewellery — engraving, gemstone, finish.",
    images: ["https://tabidsgn.tools/og-image.jpg"],
  },
  manifest: "/site.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-48x48.png", sizes: "48x48", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        {/* Preload the default ring body so it's ready before the homepage canvas mounts.
            HDRI preload removed — 1.5 MB is too costly on mobile networks and the file
            is cached permanently (max-age=31536000, immutable) after first load anyway. */}
        <link rel="preload" href="/models/RING-MOI.glb" as="fetch" crossOrigin="anonymous" />
      </head>
      <body className="font-sans antialiased">
        {/* Instant loading screen — visible before JS hydrates, hidden once React mounts */}
        <div
          id="initial-loader"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#ffffff",
          }}
        >
          <span
            style={{
              fontSize: "14px",
              fontWeight: 500,
              fontFamily: '"ABC Diatype", ui-sans-serif, system-ui, sans-serif',
              color: "#2a2c2d",
              letterSpacing: "-0.3px",
              textTransform: "lowercase" as const,
              animation: "initialPulse 1.8s ease-in-out infinite",
            }}
          >
            tabi dsgn
          </span>
          <style
            dangerouslySetInnerHTML={{
              __html: `@keyframes initialPulse{0%,100%{transform:scale(1);opacity:.85}50%{transform:scale(1.12);opacity:1}}`,
            }}
          />
        </div>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
