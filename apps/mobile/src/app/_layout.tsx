import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, type ReactNode } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import * as Device from "expo-device";
import * as ScreenOrientation from "expo-screen-orientation";
import { useSocketBootstrap } from "../hooks/useSocketBootstrap";
import { useProfileStore } from "../store/profile-store";
import { palette } from "../theme/tokens";

function BootGate({ children }: { children: ReactNode }) {
  const hydrated = useProfileStore((state) => state.hydrated);
  const initialize = useProfileStore((state) => state.initialize);
  const orientationPreference = useProfileStore((state) => state.profile?.preferencias.phoneOrientationPreference);

  useEffect(() => {
    void initialize();
  }, [initialize]);

  useEffect(() => {
    async function syncOrientation() {
      const deviceType = Device.deviceType;
      if (deviceType === Device.DeviceType.TABLET) {
        await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
        return;
      }

      if (orientationPreference === "landscape") {
        await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
        return;
      }

      if (orientationPreference === "auto") {
        await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.DEFAULT);
        return;
      }

      await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
    }

    void syncOrientation();
  }, [orientationPreference]);

  if (!hydrated) {
    return (
      <View style={styles.boot}>
        <ActivityIndicator color={palette.goldSoft} size="large" />
        <Text style={styles.bootTitle}>La Campaña</Text>
        <Text style={styles.bootCopy}>Preparando tu perfil y la mesa móvil.</Text>
      </View>
    );
  }

  return <>{children}</>;
}

export default function RootLayout() {
  useSocketBootstrap();

  return (
    <>
      <StatusBar style="light" />
      <BootGate>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: {
              backgroundColor: palette.bg,
            },
            animation: "slide_from_right",
          }}
        />
      </BootGate>
    </>
  );
}

const styles = StyleSheet.create({
  boot: {
    flex: 1,
    backgroundColor: palette.bg,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingHorizontal: 24,
  },
  bootTitle: {
    color: palette.parchment,
    fontSize: 26,
    fontWeight: "800",
  },
  bootCopy: {
    color: palette.textSoft,
    fontSize: 14,
    textAlign: "center",
  },
});
