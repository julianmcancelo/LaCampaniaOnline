import { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View, useWindowDimensions } from "react-native";
import { resolveGameViewport } from "../../components/game/viewport";
import { ActionButton } from "../../components/ui/ActionButton";
import { BrandHero } from "../../components/ui/BrandHero";
import { ProfileAvatar } from "../../components/ui/ProfileAvatar";
import { Screen } from "../../components/ui/Screen";
import { SectionCard } from "../../components/ui/SectionCard";
import { useProfileStore, type PreferenciaOrientacionCelular } from "../../store/profile-store";
import { palette, radius, spacing } from "../../theme/tokens";

const orientationOptions: Array<{ value: PreferenciaOrientacionCelular; title: string; icon: string }> = [
  { value: "portrait", title: "Vertical", icon: "V" },
  { value: "landscape", title: "Horizontal", icon: "H" },
  { value: "auto", title: "Auto", icon: "A" },
];

export default function PantallaAjustes() {
  const { width, height } = useWindowDimensions();
  const viewport = resolveGameViewport(width, height);
  const wide = viewport.mode === "tabletLandscape";
  const profile = useProfileStore((state) => state.profile);
  const authStatus = useProfileStore((state) => state.authStatus);
  const leaderboard = useProfileStore((state) => state.leaderboard);
  const refreshLeaderboard = useProfileStore((state) => state.refreshLeaderboard);
  const saveDisplayName = useProfileStore((state) => state.saveDisplayName);
  const setPhoneOrientationPreference = useProfileStore((state) => state.setPhoneOrientationPreference);
  const [draft, setDraft] = useState(profile?.displayName ?? "");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    void refreshLeaderboard();
  }, [refreshLeaderboard]);

  const totalMatches = (profile?.progreso.localMatchesPlayed ?? 0) + (profile?.progreso.onlineMatchesPlayed ?? 0);
  const totalWins = (profile?.progreso.localWins ?? 0) + (profile?.progreso.onlineWins ?? 0);
  const winRate = totalMatches > 0 ? Math.round((totalWins / totalMatches) * 100) : 0;
  const myRank = useMemo(() => leaderboard.findIndex((entry) => entry.uid === profile?.uid) + 1, [leaderboard, profile?.uid]);

  return (
    <Screen scroll={!wide}>
      <View style={[styles.columns, wide ? styles.columnsHorizontal : null]}>
        <View style={styles.heroBox}>
          <BrandHero
            eyebrow="Perfil y progreso"
            title="Tu rueda"
            subtitle="Foto, nombre, posicion y orientacion del campo en una sola posta."
            compact={!wide}
          />
        </View>

        <View style={styles.column}>
          <SectionCard eyebrow="Perfil" title="Jugador">
            <View style={styles.profileHeader}>
              <ProfileAvatar
                size={62}
                displayName={profile?.displayName || "Jugador"}
                photoURL={profile?.photoURL}
                avatarKind={profile?.avatarKind ?? "crest"}
                crestId={profile?.crestId}
              />
              <View style={styles.profileHeaderText}>
                <Text style={styles.profileName}>{profile?.displayName || "Sin nombre"}</Text>
                <Text style={styles.copy}>Tu nombre se usa en partidas locales, online, ranking y progreso.</Text>
              </View>
            </View>

            <TextInput
              value={draft}
              onChangeText={(value) => {
                setDraft(value);
                setSaved(false);
              }}
              placeholder="Ingresa tu nombre"
              placeholderTextColor={palette.textMuted}
              style={styles.input}
              autoCapitalize="words"
            />
            <ActionButton
              label="Guardar nombre"
              onPress={async () => {
                await saveDisplayName(draft);
                setSaved(true);
              }}
              disabled={!draft.trim()}
            />
            {saved ? <Text style={styles.saved}>Nombre guardado.</Text> : null}
          </SectionCard>

          <SectionCard eyebrow="Pantalla" title="Orientacion del celular">
            <View style={styles.optionList}>
              {orientationOptions.map((option) => {
                const selected = profile?.preferencias.phoneOrientationPreference === option.value;
                return (
                  <Pressable
                    key={option.value}
                    onPress={() => void setPhoneOrientationPreference(option.value)}
                    style={({ pressed }) => [styles.option, selected ? styles.optionSelected : null, pressed ? styles.optionPressed : null]}
                  >
                    <Text style={styles.optionIcon}>{option.icon}</Text>
                    <Text style={[styles.optionText, selected ? styles.optionTextSelected : null]}>{option.title}</Text>
                  </Pressable>
                );
              })}
            </View>
          </SectionCard>
        </View>

        <View style={styles.column}>
          <SectionCard eyebrow="Cuenta" title="Sesion y estadisticas">
            <View style={styles.row}>
              <Text style={styles.label}>UID</Text>
              <Text style={styles.value}>{profile?.uid ?? "Sin sesion"}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Modo</Text>
              <Text style={styles.value}>{authStatus === "authenticated" ? "Firebase activo" : "Sin acceso activo"}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Puntos</Text>
              <Text style={styles.value}>{profile?.progreso.puntos ?? 0}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Partidas</Text>
              <Text style={styles.value}>{totalMatches}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Victorias</Text>
              <Text style={styles.value}>{totalWins}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Winrate</Text>
              <Text style={styles.value}>{winRate}%</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Racha</Text>
              <Text style={styles.value}>{profile?.progreso.winStreak ?? 0}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>CPU mas alta</Text>
              <Text style={styles.value}>{profile?.progreso.highestCpuDifficultyWon ?? "-"}</Text>
            </View>
          </SectionCard>

          <SectionCard eyebrow="Ranking" title="Tabla de posiciones">
            <View style={styles.rankHeader}>
              <Text style={styles.copy}>Top global simple por puntos. Google Play Games entra en una etapa posterior.</Text>
              <ActionButton label="Actualizar" tone="secondary" onPress={() => void refreshLeaderboard()} />
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Tu posicion</Text>
              <Text style={styles.value}>{myRank > 0 ? `#${myRank}` : "Fuera del top"}</Text>
            </View>
            <View style={styles.rankList}>
              {leaderboard.slice(0, 8).map((entry, index) => (
                <View key={entry.uid} style={styles.rankRow}>
                  <Text style={styles.rankPosition}>#{index + 1}</Text>
                  <ProfileAvatar size={34} displayName={entry.displayName} photoURL={entry.photoURL} avatarKind={entry.avatarKind} crestId={entry.crestId} />
                  <Text numberOfLines={1} style={styles.rankName}>
                    {entry.displayName}
                  </Text>
                  <Text style={styles.rankScore}>{entry.puntos}</Text>
                </View>
              ))}
            </View>
          </SectionCard>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  columns: {
    gap: spacing.md,
    flex: 1,
  },
  columnsHorizontal: {
    flexDirection: "row",
    alignItems: "flex-start",
    flexWrap: "wrap",
  },
  heroBox: {
    width: "100%",
  },
  column: {
    flex: 1,
    gap: spacing.md,
    minWidth: 0,
  },
  profileHeader: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  profileHeaderText: {
    flex: 1,
    gap: 4,
  },
  profileName: {
    color: palette.parchment,
    fontSize: 18,
    fontWeight: "800",
  },
  copy: {
    color: palette.textSoft,
    fontSize: 13,
    lineHeight: 19,
  },
  input: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: "rgba(255, 248, 239, 0.05)",
    color: palette.parchment,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  saved: {
    color: palette.success,
    fontSize: 13,
    fontWeight: "600",
  },
  optionList: {
    gap: 10,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: palette.border,
  },
  optionSelected: {
    backgroundColor: "rgba(212,160,23,0.16)",
    borderColor: palette.borderStrong,
  },
  optionPressed: {
    opacity: 0.92,
  },
  optionIcon: {
    color: palette.goldSoft,
    fontSize: 18,
    width: 24,
    textAlign: "center",
    fontWeight: "800",
  },
  optionText: {
    color: palette.parchment,
    fontSize: 14,
    fontWeight: "700",
  },
  optionTextSelected: {
    color: palette.goldSoft,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 16,
  },
  label: {
    color: palette.textMuted,
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  value: {
    color: palette.parchment,
    fontSize: 14,
    fontWeight: "700",
    flexShrink: 1,
    textAlign: "right",
  },
  rankHeader: {
    gap: 10,
  },
  rankList: {
    gap: 8,
  },
  rankRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: radius.md,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: palette.border,
  },
  rankPosition: {
    width: 28,
    color: palette.goldSoft,
    fontSize: 12,
    fontWeight: "800",
  },
  rankName: {
    flex: 1,
    color: palette.parchment,
    fontSize: 13,
    fontWeight: "700",
  },
  rankScore: {
    color: palette.goldSoft,
    fontSize: 13,
    fontWeight: "900",
  },
});
