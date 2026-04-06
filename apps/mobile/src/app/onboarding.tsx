import { router } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, Text, TextInput, View, useWindowDimensions } from "react-native";
import { BrandHero } from "../components/ui/BrandHero";
import { ActionButton } from "../components/ui/ActionButton";
import { Screen } from "../components/ui/Screen";
import { SectionCard } from "../components/ui/SectionCard";
import { getPendingInvite } from "../lib/invitaciones";
import { useProfileStore } from "../store/profile-store";
import { palette } from "../theme/tokens";

export default function PantallaOnboarding() {
  const { width } = useWindowDimensions();
  const profile = useProfileStore((state) => state.profile);
  const saveDisplayName = useProfileStore((state) => state.saveDisplayName);
  const hydrated = useProfileStore((state) => state.hydrated);
  const [nombre, setNombre] = useState(profile?.displayName ?? "");
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (!(hydrated && profile?.perfilCompleto)) {
      return;
    }

    let active = true;
    void getPendingInvite().then((invite) => {
      if (!active) return;
      if (invite?.roomId) {
        router.replace(`/invitacion/${invite.roomId}` as never);
        return;
      }
      router.replace("/local" as never);
    });

    return () => {
      active = false;
    };
  }, [hydrated, profile?.perfilCompleto]);

  return (
    <Screen>
      <View style={styles.wrap}>
        <View style={[styles.cardWrap, width > 900 ? styles.cardWrapWide : null]}>
          <BrandHero
            eyebrow="Nombre de frontera"
            title="Sangre y Plata"
            subtitle="Antes de pisar la mesa, elegi como te van a nombrar en la rueda, el ranking y las salas."
          />

          <SectionCard eyebrow="Bienvenido" title="Elegi tu nombre de juego">
            <Text style={styles.copy}>
              Lo usamos para tus partidas, tu perfil, tus invitaciones y tu progreso.
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
                const invite = await getPendingInvite();
                if (invite?.roomId) {
                  router.replace(`/invitacion/${invite.roomId}` as never);
                  return;
                }
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
    gap: 14,
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
