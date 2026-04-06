import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { useEffect, type ReactNode } from "react";
import * as Device from "expo-device";
import * as ScreenOrientation from "expo-screen-orientation";
import { useSocketBootstrap } from "../hooks/useSocketBootstrap";
import { palette } from "../theme/tokens";
import { useProfileStore } from "../store/profile-store";

function BootGate({ children }: { children: ReactNode }) {
  const hydrated = useProfileStore((state) => state.hydrated);
  const initialize = useProfileStore((state) => state.initialize);

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
      await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
    }

    void syncOrientation();
  }, []);

  if (!hydrated) {
    return (
      <View style={styles.boot}>
        <ActivityIndicator color={palette.goldSoft} size="large" />
        <Text style={styles.bootTitle}>La Campania</Text>
        <Text style={styles.bootCopy}>Preparando tu perfil y la mesa movil.</Text>
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
