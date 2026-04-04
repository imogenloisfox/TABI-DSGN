import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TABI DSGN | Engraving Customiser",
  description:
    "Personalise your TABI DSGN jewellery. Choose a ring or pendant, select your engraving, gemstone, and finish.",
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
      </body>
    </html>
  );
}
