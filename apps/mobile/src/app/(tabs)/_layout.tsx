import { Redirect, Tabs } from "expo-router";
import { Text } from "react-native";
import { reachedAnonymousLimit, useProfileStore } from "../../store/profile-store";
import { palette } from "../../theme/tokens";

export default function TabsLayout() {
  const hydrated = useProfileStore((state) => state.hydrated);
  const authStatus = useProfileStore((state) => state.authStatus);
  const profile = useProfileStore((state) => state.profile);

  if (hydrated && authStatus !== "authenticated") {
    return <Redirect href={"/acceso" as never} />;
  }

  if (hydrated && reachedAnonymousLimit(profile)) {
    return <Redirect href={"/acceso" as never} />;
  }

  if (hydrated && profile && !profile.perfilCompleto) {
    return <Redirect href="/onboarding" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: palette.goldSoft,
        tabBarInactiveTintColor: palette.textMuted,
        tabBarStyle: {
          backgroundColor: "#0b1712",
          borderTopColor: "rgba(212, 160, 23, 0.12)",
          height: 58,
          paddingTop: 6,
          paddingBottom: 6,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "700",
        },
      }}
    >
      <Tabs.Screen
        name="local"
        options={{
          title: "Local",
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 16 }}>L</Text>,
        }}
      />
      <Tabs.Screen
        name="online"
        options={{
          title: "Online",
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 16 }}>O</Text>,
        }}
      />
      <Tabs.Screen
        name="ajustes"
        options={{
          title: "Ajustes",
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 16 }}>A</Text>,
        }}
      />
      <Tabs.Screen
        name="jugar"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
