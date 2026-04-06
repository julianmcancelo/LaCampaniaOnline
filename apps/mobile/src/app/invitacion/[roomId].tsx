import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import type { RoomInvitePreview } from "../../../../../motor/tipos";
import { ActionButton } from "../../components/ui/ActionButton";
import { ProfileAvatar } from "../../components/ui/ProfileAvatar";
import { Screen } from "../../components/ui/Screen";
import { SectionCard } from "../../components/ui/SectionCard";
import {
  clearPendingInvite,
  getInviteStatusLabel,
  loadInvitePreview,
  savePendingInvite,
} from "../../lib/invitaciones";
import { getSocketUrl, obtenerSocket } from "../../lib/socket";
import { useMobileGameStore } from "../../store/game-store";
import { useProfileStore } from "../../store/profile-store";
import { palette, spacing } from "../../theme/tokens";

function canJoinInvite(preview: RoomInvitePreview | null): boolean {
  return preview?.status === "available";
}

export default function PantallaInvitacion() {
  const { roomId } = useLocalSearchParams<{ roomId: string }>();
  const profile = useProfileStore((state) => state.profile);
  const authStatus = useProfileStore((state) => state.authStatus);
  const { connection, currentRoom, error, setError, setInvitePreview, invitePreview } = useMobileGameStore();
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);

  const endpoint = useMemo(() => {
    try {
      return new URL(getSocketUrl()).host;
    } catch {
      return getSocketUrl();
    }
  }, []);

  useEffect(() => {
    if (!roomId) {
      return;
    }

    let active = true;
    void savePendingInvite({ roomId, source: "link" });

    if (authStatus !== "authenticated") {
      setLoading(false);
      router.replace("/acceso" as never);
      return;
    }

    if (!profile?.perfilCompleto) {
      setLoading(false);
      router.replace("/onboarding" as never);
      return;
    }

    setLoading(true);
    setError(null);
    void loadInvitePreview(roomId)
      .then((preview) => {
        if (!active) {
          return;
        }
        setInvitePreview(preview);
      })
      .catch(() => {
        if (!active) {
          return;
        }
        setInvitePreview({
          roomId,
          roomName: "Sala no disponible",
          status: "missing",
          modeLabel: "Duelo / 2 jugadores",
          playerCount: 0,
          maxPlayers: 2,
        });
        setError("No pudimos validar esta invitación en este momento.");
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [authStatus, profile?.perfilCompleto, roomId, setError, setInvitePreview]);

  useEffect(() => {
    if (!roomId || currentRoom?.id !== roomId) {
      return;
    }

    void clearPendingInvite();
    setInvitePreview(null);
    router.replace(`/sala/${roomId}` as never);
  }, [currentRoom?.id, roomId, setInvitePreview]);

  async function entrarASala() {
    if (!roomId || !profile?.displayName.trim()) {
      return;
    }

    setJoining(true);
    setError(null);
    const socket = await obtenerSocket();
    socket.emit("room:join", { roomId, displayName: profile.displayName.trim() });
    setTimeout(() => {
      setJoining(false);
    }, 2000);
  }

  return (
    <Screen>
      <View style={styles.wrap}>
        <SectionCard eyebrow="Invitacion" title="Unite a una sala">
          <View style={styles.header}>
            <ProfileAvatar
              size={56}
              displayName={profile?.displayName || "Jugador"}
              photoURL={profile?.photoURL}
              avatarKind={profile?.avatarKind ?? "crest"}
              crestId={profile?.crestId}
            />
            <View style={styles.headerText}>
              <Text style={styles.title}>{invitePreview?.roomName ?? "Revisando invitacion"}</Text>
              <Text style={styles.copy}>
                {loading
                  ? "Estamos verificando el estado de la sala y tu sesion."
                  : "Confirmá el ingreso cuando quieras entrar al duelo."}
              </Text>
            </View>
          </View>

          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator color={palette.goldSoft} />
              <Text style={styles.loadingText}>Consultando disponibilidad en Render...</Text>
            </View>
          ) : (
            <View style={styles.content}>
              <View style={styles.metaGrid}>
                <View style={styles.metaChip}>
                  <Text style={styles.metaLabel}>Estado</Text>
                  <Text style={styles.metaValue}>{getInviteStatusLabel(invitePreview?.status ?? "missing")}</Text>
                </View>
                <View style={styles.metaChip}>
                  <Text style={styles.metaLabel}>Modo</Text>
                  <Text style={styles.metaValue}>{invitePreview?.modeLabel ?? "Duelo / 2 jugadores"}</Text>
                </View>
                <View style={styles.metaChip}>
                  <Text style={styles.metaLabel}>Jugadores</Text>
                  <Text style={styles.metaValue}>
                    {invitePreview?.playerCount ?? 0}/{invitePreview?.maxPlayers ?? 2}
                  </Text>
                </View>
                <View style={styles.metaChip}>
                  <Text style={styles.metaLabel}>Backend</Text>
                  <Text style={styles.metaValue}>{connection === "connected" ? endpoint : "Render"}</Text>
                </View>
              </View>

              {error ? <Text style={styles.error}>{error}</Text> : null}

              <View style={styles.actions}>
                <ActionButton
                  label={joining ? "Entrando..." : "Entrar a la sala"}
                  onPress={() => void entrarASala()}
                  disabled={!canJoinInvite(invitePreview) || joining}
                />
                <ActionButton label="Volver a online" tone="secondary" onPress={() => router.replace("/online" as never)} />
              </View>
            </View>
          )}
        </SectionCard>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    justifyContent: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  headerText: {
    flex: 1,
    gap: 4,
  },
  title: {
    color: palette.parchment,
    fontSize: 22,
    fontWeight: "800",
  },
  copy: {
    color: palette.textSoft,
    fontSize: 13,
    lineHeight: 19,
  },
  loadingBox: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: "rgba(255,255,255,0.04)",
    padding: 18,
    gap: 12,
    alignItems: "center",
  },
  loadingText: {
    color: palette.textSoft,
    fontSize: 13,
    textAlign: "center",
  },
  content: {
    gap: spacing.md,
  },
  metaGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  metaChip: {
    minWidth: "47%",
    flexGrow: 1,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: "rgba(255,255,255,0.04)",
    gap: 4,
  },
  metaLabel: {
    color: palette.textMuted,
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  metaValue: {
    color: palette.parchment,
    fontSize: 14,
    fontWeight: "700",
  },
  actions: {
    gap: 10,
  },
  error: {
    color: "#f2b8b1",
    fontSize: 13,
    lineHeight: 18,
  },
});
