import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useState } from "react";
import { Image, Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { GAME_BRAND } from "../../../../lib/lore";
import { ProfileAvatar } from "../components/ui/ProfileAvatar";
import { Screen } from "../components/ui/Screen";
import { getPendingInvite } from "../lib/invitaciones";
import { reachedAnonymousLimit, useProfileStore } from "../store/profile-store";
import { palette, radius } from "../theme/tokens";

function AccessButton({
  icon,
  title,
  subtitle,
  onPress,
  disabled,
  tone = "light",
}: {
  icon: string;
  title: string;
  subtitle: string;
  onPress: () => void;
  disabled?: boolean;
  tone?: "light" | "dark";
}) {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.accessButton,
        tone === "dark" ? styles.accessButtonDark : styles.accessButtonLight,
        disabled ? styles.accessButtonDisabled : null,
        pressed && !disabled ? styles.accessButtonPressed : null,
      ]}
    >
      <View style={[styles.accessIconWrap, tone === "dark" ? styles.accessIconWrapDark : null]}>
        <Text style={[styles.accessIcon, tone === "dark" ? styles.accessIconDark : null]}>{icon}</Text>
      </View>
      <View style={styles.accessText}>
        <Text style={[styles.accessTitle, tone === "dark" ? styles.accessTitleDark : null]}>{title}</Text>
        <Text style={[styles.accessSubtitle, tone === "dark" ? styles.accessSubtitleDark : null]}>{subtitle}</Text>
      </View>
    </Pressable>
  );
}

export default function PantallaAcceso() {
  const { width, height } = useWindowDimensions();
  const hydrated = useProfileStore((state) => state.hydrated);
  const authStatus = useProfileStore((state) => state.authStatus);
  const profile = useProfileStore((state) => state.profile);
  const continueAsGuest = useProfileStore((state) => state.continueAsGuest);
  const signInWithGoogle = useProfileStore((state) => state.signInWithGoogle);
  const error = useProfileStore((state) => state.error);
  const [loadingGuest, setLoadingGuest] = useState(false);
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const blockedGuest = reachedAnonymousLimit(profile);
  const compact = width < 440 || height < 760;
  const guestMatches = Math.min((profile?.progreso.localMatchesPlayed ?? 0) + (profile?.progreso.onlineMatchesPlayed ?? 0), 4);

  useEffect(() => {
    if (!(hydrated && authStatus === "authenticated" && profile)) {
      return;
    }

    let active = true;
    void getPendingInvite().then((invite) => {
      if (!active) {
        return;
      }

      if (!profile.perfilCompleto) {
        router.replace("/onboarding" as never);
        return;
      }

      if (invite?.roomId) {
        router.replace(`/invitacion/${invite.roomId}` as never);
        return;
      }

      router.replace("/local" as never);
    });

    return () => {
      active = false;
    };
  }, [authStatus, hydrated, profile]);

  return (
    <Screen>
      <LinearGradient colors={["#07130f", "#10251c", "#0b1813"]} style={styles.root}>
        <View style={[styles.hero, compact ? styles.heroCompact : null]}>
          <View style={styles.brandColumn}>
            <Image source={require("../../assets/images/logo-gaucho-puro.png")} style={styles.logo} resizeMode="contain" />
            <Text style={styles.eyebrow}>Acceso a la frontera</Text>
            <Text style={styles.brand}>{GAME_BRAND}</Text>
            <Text style={styles.copy}>
              Entra con Google para guardar tu identidad, tu foto, tu plata y tu progreso. Si queres probar primero, podes usar
              modo invitado por hasta 4 partidas.
            </Text>
          </View>

          <View style={[styles.panel, compact ? styles.panelCompact : null]}>
            <View style={styles.panelHeader}>
              <View style={styles.identityRow}>
                <ProfileAvatar
                  size={56}
                  displayName={profile?.displayName || "Paisano"}
                  photoURL={profile?.photoURL}
                  avatarKind={profile?.avatarKind ?? "crest"}
                  crestId={profile?.crestId}
                />
                <View style={styles.identityText}>
                  <Text style={styles.panelTitle}>{blockedGuest ? "Se termino el modo invitado" : "Elegi como entrar"}</Text>
                  <Text style={styles.panelCopy}>
                    {blockedGuest
                      ? "Ya usaste tus 4 partidas de prueba. Entra con Google para seguir sin perder tu avance."
                      : "Google es la opcion recomendada. Invitado sirve para una rodada rapida."}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.buttonStack}>
              <AccessButton
                icon="G"
                title={loadingGoogle ? "Abriendo Google..." : "Entrar con Google"}
                subtitle="Sincroniza foto, nombre, estadisticas y puntaje."
                onPress={async () => {
                  setLoadingGoogle(true);
                  await signInWithGoogle();
                  setLoadingGoogle(false);
                }}
                disabled={loadingGoogle}
              />

              <AccessButton
                icon="A"
                title={loadingGuest ? "Creando invitado..." : "Seguir como invitado"}
                subtitle={blockedGuest ? "Bloqueado hasta iniciar con Google." : "Disponible por 4 partidas."}
                onPress={async () => {
                  setLoadingGuest(true);
                  await continueAsGuest();
                  setLoadingGuest(false);
                }}
                disabled={loadingGuest || blockedGuest}
                tone="dark"
              />
            </View>

            <View style={styles.metaRow}>
              <View style={styles.metaChip}>
                <Text style={styles.metaLabel}>Puntaje</Text>
                <Text style={styles.metaValue}>{profile?.progreso.puntos ?? 0}</Text>
              </View>
              <View style={styles.metaChip}>
                <Text style={styles.metaLabel}>Invitado</Text>
                <Text style={styles.metaValue}>{guestMatches}/4</Text>
              </View>
            </View>

            {error ? <Text style={styles.error}>{error}</Text> : null}
          </View>
        </View>
      </LinearGradient>
    </Screen>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: "center",
    padding: 18,
    borderRadius: radius.xl,
    overflow: "hidden",
  },
  hero: {
    flexDirection: "row",
    gap: 18,
    alignItems: "stretch",
    justifyContent: "space-between",
  },
  heroCompact: {
    flexDirection: "column",
  },
  brandColumn: {
    flex: 1,
    justifyContent: "center",
    gap: 12,
    paddingHorizontal: 10,
  },
  logo: {
    width: 124,
    height: 124,
    marginBottom: 4,
  },
  eyebrow: {
    color: palette.goldSoft,
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 2,
  },
  brand: {
    color: "#f8edcf",
    fontSize: 52,
    fontWeight: "900",
    lineHeight: 56,
  },
  copy: {
    maxWidth: 460,
    color: "#cfbf95",
    fontSize: 16,
    lineHeight: 24,
  },
  panel: {
    width: 440,
    borderRadius: 28,
    padding: 20,
    gap: 18,
    justifyContent: "space-between",
    backgroundColor: "rgba(244,230,194,0.08)",
    borderWidth: 1,
    borderColor: "rgba(227,194,112,0.18)",
  },
  panelCompact: {
    width: "100%",
  },
  panelHeader: {
    gap: 8,
  },
  identityRow: {
    flexDirection: "row",
    gap: 14,
    alignItems: "center",
  },
  identityText: {
    flex: 1,
    gap: 6,
  },
  panelTitle: {
    color: "#fff5dc",
    fontSize: 24,
    fontWeight: "800",
  },
  panelCopy: {
    color: "#d7c8a0",
    fontSize: 14,
    lineHeight: 20,
  },
  buttonStack: {
    gap: 12,
  },
  accessButton: {
    minHeight: 86,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderWidth: 1,
  },
  accessButtonLight: {
    backgroundColor: "#efe1bb",
    borderColor: "#d8be82",
  },
  accessButtonDark: {
    backgroundColor: "rgba(15,32,24,0.84)",
    borderColor: "rgba(220,190,122,0.24)",
  },
  accessButtonDisabled: {
    opacity: 0.55,
  },
  accessButtonPressed: {
    transform: [{ scale: 0.99 }],
  },
  accessIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#1f2e26",
    alignItems: "center",
    justifyContent: "center",
  },
  accessIconWrapDark: {
    backgroundColor: "#f1e0b7",
  },
  accessIcon: {
    color: "#f5e6bf",
    fontSize: 22,
    fontWeight: "900",
  },
  accessIconDark: {
    color: "#173126",
  },
  accessText: {
    flex: 1,
    gap: 4,
  },
  accessTitle: {
    color: "#173126",
    fontSize: 16,
    fontWeight: "800",
  },
  accessTitleDark: {
    color: "#f7edd0",
  },
  accessSubtitle: {
    color: "#31453a",
    fontSize: 13,
    lineHeight: 18,
  },
  accessSubtitleDark: {
    color: "#c7ba97",
  },
  metaRow: {
    flexDirection: "row",
    gap: 10,
  },
  metaChip: {
    flex: 1,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(221,190,117,0.16)",
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 4,
  },
  metaLabel: {
    color: "#baa877",
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  metaValue: {
    color: "#f8edcf",
    fontSize: 18,
    fontWeight: "800",
  },
  error: {
    color: "#ffb5a5",
    fontSize: 13,
    lineHeight: 18,
  },
});
