import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View, useWindowDimensions } from "react-native";
import { ActionButton } from "../../components/ui/ActionButton";
import { Screen } from "../../components/ui/Screen";
import { SectionCard } from "../../components/ui/SectionCard";
import { useProfileStore, type PreferenciaOrientacionCelular } from "../../store/profile-store";
import { palette, radius, spacing } from "../../theme/tokens";

const orientationOptions: Array<{ value: PreferenciaOrientacionCelular; title: string; icon: string }> = [
  { value: "portrait", title: "Vertical", icon: "▯" },
  { value: "landscape", title: "Horizontal", icon: "▬" },
  { value: "auto", title: "Auto", icon: "◌" },
];

export default function PantallaAjustes() {
  const { width, height } = useWindowDimensions();
  const wide = width >= 900 && width > height;
  const profile = useProfileStore((state) => state.profile);
  const authStatus = useProfileStore((state) => state.authStatus);
  const saveDisplayName = useProfileStore((state) => state.saveDisplayName);
  const setPhoneOrientationPreference = useProfileStore((state) => state.setPhoneOrientationPreference);
  const [draft, setDraft] = useState(profile?.displayName ?? "");
  const [saved, setSaved] = useState(false);

  return (
    <Screen scroll={!wide}>
      <View style={[styles.columns, wide ? styles.columnsHorizontal : null]}>
        <View style={styles.column}>
          <SectionCard eyebrow="Perfil" title="Jugador">
            <Text style={styles.copy}>Tu nombre se usa en partidas locales, online y progreso.</Text>
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
          <SectionCard eyebrow="Cuenta" title="Sesion y progreso">
            <View style={styles.row}>
              <Text style={styles.label}>UID</Text>
              <Text style={styles.value}>{profile?.uid ?? "Sin sesion"}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Modo</Text>
              <Text style={styles.value}>{authStatus === "ready" ? "Firebase activo" : "Solo local"}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Partidas locales</Text>
              <Text style={styles.value}>{profile?.progreso.localMatchesPlayed ?? 0}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Puntos</Text>
              <Text style={styles.value}>{profile?.progreso.puntos ?? 0}</Text>
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
    fontSize: 20,
    width: 24,
    textAlign: "center",
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
});
