"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { ArrowRight, Download, QrCode, Smartphone } from "lucide-react";
import type { RoomInvitePreview } from "../../../motor/tipos";
import {
  buildAppInviteUrl,
  buildPreviewUrl,
  getInviteStatusLabel,
  resolveWebInviteBaseUrl,
} from "../../../lib/invitaciones";

type PageProps = {
  params: {
    roomId: string;
  };
};

const installUrl = process.env.NEXT_PUBLIC_ANDROID_APP_URL?.trim() || resolveWebInviteBaseUrl();

export default function PaginaInvitacion({ params }: PageProps) {
  const [roomId] = useState<string>(params.roomId);
  const [preview, setPreview] = useState<RoomInvitePreview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!roomId) {
      return;
    }

    let active = true;
    const appUrl = buildAppInviteUrl(roomId);

    fetch(buildPreviewUrl(roomId))
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("preview");
        }
        return (await response.json()) as RoomInvitePreview;
      })
      .then((nextPreview) => {
        if (!active) {
          return;
        }
        setPreview(nextPreview);
        if (nextPreview.status === "available") {
          window.setTimeout(() => {
            window.location.href = appUrl;
          }, 200);
        }
      })
      .catch(() => {
        if (!active) {
          return;
        }
        setPreview({
          roomId,
          roomName: "Sala no encontrada",
          status: "missing",
          modeLabel: "Duelo / 2 jugadores",
          playerCount: 0,
          maxPlayers: 2,
        });
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [roomId]);

  const appUrl = useMemo(() => (roomId ? buildAppInviteUrl(roomId) : "#"), [roomId]);

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background:
          "radial-gradient(circle at top, rgba(212,160,23,0.08), transparent 32%), linear-gradient(180deg, #07130f 0%, #050e09 100%)",
        padding: "24px",
      }}
    >
      <section
        style={{
          width: "100%",
          maxWidth: 760,
          borderRadius: 28,
          border: "1px solid rgba(212,160,23,0.12)",
          background: "rgba(10,26,19,0.78)",
          backdropFilter: "blur(18px)",
          padding: "28px",
          boxShadow: "0 24px 80px rgba(0,0,0,0.35)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
          <div style={{ width: 18, height: 1, background: "rgba(212,160,23,0.5)" }} />
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.24em",
              textTransform: "uppercase",
              color: "#d4a017",
            }}
          >
            Invitacion mobile
          </span>
        </div>

        <h1
          style={{
            fontFamily: "'Cinzel Decorative', Georgia, serif",
            fontSize: "clamp(2rem, 6vw, 3.8rem)",
            color: "#f5d98a",
            lineHeight: 1,
            marginBottom: 12,
          }}
        >
          Unite a la sala
        </h1>

        <p style={{ color: "#aab8b0", lineHeight: 1.75, maxWidth: 560, marginBottom: 22 }}>
          Si ya tenés la app instalada, vamos a intentar abrirla y llevarte directo a la confirmación de ingreso. Si no la
          tenés, podés instalarla y volver a este mismo enlace.
        </p>

        <div
          style={{
            display: "grid",
            gap: 14,
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            marginBottom: 22,
          }}
        >
          <div style={cardStyle}>
            <div style={labelStyle}>Sala</div>
            <div style={valueStyle}>{preview?.roomName ?? "Consultando..."}</div>
          </div>
          <div style={cardStyle}>
            <div style={labelStyle}>Estado</div>
            <div style={valueStyle}>{loading ? "Verificando..." : getInviteStatusLabel(preview?.status ?? "missing")}</div>
          </div>
          <div style={cardStyle}>
            <div style={labelStyle}>Jugadores</div>
            <div style={valueStyle}>
              {preview?.playerCount ?? 0}/{preview?.maxPlayers ?? 2}
            </div>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gap: 12,
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          }}
        >
          <a href={appUrl} style={primaryButtonStyle}>
            <Smartphone size={16} />
            Abrir en la app
          </a>
          <a href={installUrl} style={secondaryButtonStyle}>
            <Download size={16} />
            Instalar app
          </a>
          <Link href="/" style={ghostButtonStyle}>
            <ArrowRight size={16} />
            Ir al sitio
          </Link>
        </div>

        <div
          style={{
            marginTop: 20,
            borderRadius: 18,
            padding: "14px 16px",
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(212,160,23,0.08)",
            color: "#8fa096",
            fontSize: 13,
            lineHeight: 1.65,
            display: "flex",
            alignItems: "flex-start",
            gap: 10,
          }}
        >
          <QrCode size={16} style={{ flexShrink: 0, marginTop: 2 }} />
          <span>
            Este mismo enlace también puede compartirse como QR desde la app mobile. Si la sala ya comenzó o se completó, te lo
            vamos a informar antes de entrar.
          </span>
        </div>
      </section>
    </main>
  );
}

const cardStyle: CSSProperties = {
  borderRadius: 18,
  padding: "14px 16px",
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(212,160,23,0.08)",
};

const labelStyle: CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: "0.18em",
  textTransform: "uppercase",
  color: "#d4a017",
  marginBottom: 8,
};

const valueStyle: CSSProperties = {
  color: "#f2ead4",
  fontSize: 18,
  fontWeight: 800,
};

const primaryButtonStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 10,
  minHeight: 52,
  borderRadius: 14,
  background: "linear-gradient(160deg, rgba(36,94,74,0.95), rgba(18,54,38,0.98))",
  border: "1px solid rgba(212,160,23,0.28)",
  color: "#f5d98a",
  fontWeight: 800,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
};

const secondaryButtonStyle: CSSProperties = {
  ...primaryButtonStyle,
  background: "rgba(255,255,255,0.04)",
  color: "#d8caa6",
};

const ghostButtonStyle: CSSProperties = {
  ...primaryButtonStyle,
  background: "transparent",
  color: "#8fa096",
  border: "1px solid rgba(255,255,255,0.08)",
};
