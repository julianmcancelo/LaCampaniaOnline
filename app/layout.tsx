/**
 * layout.tsx — Layout raíz de La Campaña Online.
 * Carga las fuentes medievales de Google Fonts y aplica el fondo global.
 */

import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "La Campaña — Juego Online",
  description:
    "El juego estratégico de cartas argentino, ahora en línea. Reclutá guerreros, combatí y dominá el campo de batalla.",
  openGraph: {
    title: "La Campaña — Juego Online",
    description: "El juego estratégico de La Campaña, ahora online.",
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
        {/* Fuentes medievales: Cinzel (texto cuerpo) y Cinzel Decorative (títulos) */}
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
