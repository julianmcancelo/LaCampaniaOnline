import { useState } from "react";
import { StyleSheet, Text, TextInput, View, useWindowDimensions } from "react-native";
import { ActionButton } from "../../components/ui/ActionButton";
import { Screen } from "../../components/ui/Screen";
import { SectionCard } from "../../components/ui/SectionCard";
import { useProfileStore } from "../../store/profile-store";
import { palette, spacing } from "../../theme/tokens";

export default function PantallaAjustes() {
  const { width, height } = useWindowDimensions();
  const profile = useProfileStore((state) => state.profile);
  const authStatus = useProfileStore((state) => state.authStatus);
  const saveDisplayName = useProfileStore((state) => state.saveDisplayName);
  const [draft, setDraft] = useState(profile?.displayName ?? "");
  const [saved, setSaved] = useState(false);
  const esHorizontal = width > height;

  return (
    <Screen scroll>
      <View style={[styles.columns, esHorizontal ? styles.columnsHorizontal : null]}>
        <View style={styles.column}>
          <SectionCard eyebrow="Perfil" title="Nombre del jugador">
            <Text style={styles.copy}>
              Este nombre se usa en la app, en el modo local y en las partidas online.
            </Text>
            <TextInput
              value={draft}
              onChangeText={(value) => {
                setDraft(value);
                setSaved(false);
              }}
              placeholder="Ingresá tu nombre"
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
            {saved ? <Text style={styles.saved}>Nombre guardado correctamente.</Text> : null}
          </SectionCard>
        </View>

        <View style={styles.column}>
          <SectionCard eyebrow="Cuenta" title="Estado de sesión">
            <View style={styles.row}>
              <Text style={styles.label}>Identidad</Text>
              <Text style={styles.value}>{profile?.uid ?? "Sin sesión"}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Modo</Text>
              <Text style={styles.value}>{authStatus === "ready" ? "Firebase activo" : "Solo local"}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Partidas locales</Text>
              <Text style={styles.value}>{profile?.progreso.localMatchesPlayed ?? 0}</Text>
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
  },
  columnsHorizontal: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  column: {
    flex: 1,
    gap: spacing.md,
  },
  copy: {
    color: palette.textSoft,
    fontSize: 13,
    lineHeight: 19,
  },
  input: {
    borderRadius: 14,
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
});
