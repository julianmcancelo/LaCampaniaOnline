import { router } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, Text, TextInput, View, useWindowDimensions } from "react-native";
import { ActionButton } from "../components/ui/ActionButton";
import { Screen } from "../components/ui/Screen";
import { SectionCard } from "../components/ui/SectionCard";
import { useProfileStore } from "../store/profile-store";
import { palette, spacing } from "../theme/tokens";

export default function PantallaOnboarding() {
  const { width } = useWindowDimensions();
  const profile = useProfileStore((state) => state.profile);
  const saveDisplayName = useProfileStore((state) => state.saveDisplayName);
  const hydrated = useProfileStore((state) => state.hydrated);
  const [nombre, setNombre] = useState(profile?.displayName ?? "");
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (hydrated && profile?.perfilCompleto) {
      router.replace("/local" as never);
    }
  }, [hydrated, profile?.perfilCompleto]);

  return (
    <Screen>
      <View style={styles.wrap}>
        <View style={[styles.cardWrap, width > 900 ? styles.cardWrapWide : null]}>
          <SectionCard eyebrow="Bienvenido" title="Antes de jugar, elegí tu nombre">
            <Text style={styles.copy}>
              Lo vamos a usar para tus partidas, tu progreso y tu identidad dentro de la app.
            </Text>
            <TextInput
              value={nombre}
              onChangeText={setNombre}
              placeholder="Tu nombre de jugador"
              placeholderTextColor={palette.textMuted}
              style={styles.input}
              autoCapitalize="words"
              autoFocus
              maxLength={24}
            />
            <ActionButton
              label={guardando ? "Guardando..." : "Entrar a la app"}
              disabled={!nombre.trim() || guardando}
              onPress={async () => {
                setGuardando(true);
                await saveDisplayName(nombre);
                setGuardando(false);
                router.replace("/local" as never);
              }}
            />
          </SectionCard>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  cardWrap: {
    width: "100%",
  },
  cardWrapWide: {
    maxWidth: 620,
  },
  copy: {
    color: palette.textSoft,
    fontSize: 14,
    lineHeight: 20,
  },
  input: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: "rgba(255,248,239,0.05)",
    color: palette.parchment,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
});
