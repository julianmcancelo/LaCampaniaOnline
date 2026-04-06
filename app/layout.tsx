import type { Metadata } from "next";
import { GAME_BRAND, loreGameDescription } from "../lib/lore";
import "./globals.css";

export const metadata: Metadata = {
  title: `${GAME_BRAND} — Juego Online`,
  description: loreGameDescription(),
  openGraph: {
    title: `${GAME_BRAND} — Juego Online`,
    description: loreGameDescription(),
    locale: "es_AR",
  },
};

export default function LayoutRaiz({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500;600;700;800;900&family=Cinzel+Decorative:wght@400;700;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className="antialiased min-h-screen"
        style={{
          background: "#061410",
          color: "#e8dcc4",
          fontFamily: "'Cinzel', Georgia, serif",
        }}
      >
        {children}
      </body>
    </html>
  );
}
