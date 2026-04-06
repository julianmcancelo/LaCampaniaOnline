import { LinearGradient } from "expo-linear-gradient";
import { Image, StyleSheet, Text, View } from "react-native";
import { crestGlyph, crestPalette, type AvatarKind } from "../../lib/profile-avatar";

export function ProfileAvatar({
  size = 42,
  displayName,
  photoURL,
  avatarKind = "crest",
  crestId,
}: {
  size?: number;
  displayName: string;
  photoURL?: string | null;
  avatarKind?: AvatarKind;
  crestId?: string;
}) {
  const palette = crestPalette(crestId ?? displayName);
  const glyph = crestGlyph(displayName);
  const radius = Math.max(14, Math.round(size * 0.34));

  if (avatarKind === "google" && photoURL) {
    return <Image source={{ uri: photoURL }} style={{ width: size, height: size, borderRadius: radius }} />;
  }

  return (
    <LinearGradient
      colors={[palette.start, palette.end]}
      style={[
        styles.crest,
        {
          width: size,
          height: size,
          borderRadius: radius,
          borderColor: `${palette.accent}55`,
        },
      ]}
    >
      <View style={[styles.crestInner, { borderColor: `${palette.accent}66` }]}>
        <Text style={[styles.crestGlyph, { color: palette.accent, fontSize: Math.max(14, Math.round(size * 0.34)) }]}>{glyph}</Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  crest: {
    overflow: "hidden",
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  crestInner: {
    width: "72%",
    height: "72%",
    borderRadius: 999,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  crestGlyph: {
    fontWeight: "900",
    letterSpacing: 0.4,
  },
});
