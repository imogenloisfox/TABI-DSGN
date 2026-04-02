import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TABI DSGN | Engraving Customiser",
  description:
    "Personalise your TABI DSGN jewellery. Choose a ring or pendant, select your engraving, gemstone, and finish.",
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
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
