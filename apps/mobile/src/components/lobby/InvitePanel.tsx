import * as Clipboard from "expo-clipboard";
import { useMemo, useState } from "react";
import { Modal, Pressable, Share, StyleSheet, Text, View } from "react-native";
import QRCode from "react-native-qrcode-svg";
import { GAME_BRAND } from "../../../../../lib/lore";
import { buildMobileInviteUrl } from "../../lib/invitaciones";
import { palette, radius, spacing } from "../../theme/tokens";
import { ActionButton } from "../ui/ActionButton";

export function InvitePanel({ roomId }: { roomId: string }) {
  const [feedback, setFeedback] = useState<string | null>(null);
  const [showQr, setShowQr] = useState(false);
  const inviteUrl = useMemo(() => buildMobileInviteUrl(roomId), [roomId]);
  const shortCode = roomId.slice(0, 8).toUpperCase();

  async function copyInviteLink() {
    await Clipboard.setStringAsync(inviteUrl);
    setFeedback("Enlace copiado");
    setTimeout(() => setFeedback(null), 1800);
  }

  async function copyInviteCode() {
    await Clipboard.setStringAsync(shortCode);
    setFeedback("Codigo copiado");
    setTimeout(() => setFeedback(null), 1800);
  }

  async function shareInvite() {
    await Share.share({
      title: GAME_BRAND,
      message: `Sumate a mi rueda en ${GAME_BRAND}: ${inviteUrl}`,
      url: inviteUrl,
    });
  }

  return (
    <View style={styles.card}>
      <Text style={styles.eyebrow}>Invitacion</Text>
      <Text style={styles.title}>Invita por enlace o QR</Text>
      <Text style={styles.copy}>Comparte este acceso directo. Si la app esta instalada, abrira la invitacion y validara la rueda.</Text>

      <View style={styles.codeRow}>
        <View style={styles.codeBadge}>
          <Text style={styles.codeLabel}>Codigo</Text>
          <Text style={styles.codeValue}>{shortCode}</Text>
        </View>
        <ActionButton label="Copiar codigo" tone="secondary" onPress={() => void copyInviteCode()} />
      </View>

      <View style={styles.linkBox}>
        <Text style={styles.linkLabel}>Enlace</Text>
        <Text numberOfLines={2} style={styles.linkValue}>
          {inviteUrl}
        </Text>
      </View>

      <View style={styles.actions}>
        <ActionButton label="Copiar enlace" tone="secondary" onPress={() => void copyInviteLink()} />
        <ActionButton label="Compartir" onPress={() => void shareInvite()} />
        <ActionButton label="Mostrar QR" tone="secondary" onPress={() => setShowQr(true)} />
      </View>

      {feedback ? <Text style={styles.feedback}>{feedback}</Text> : null}

      <Modal visible={showQr} transparent animationType="fade" onRequestClose={() => setShowQr(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>QR de invitacion</Text>
            <Text style={styles.modalCopy}>Escanealo con la app abierta o con la camara del telefono.</Text>
            <View style={styles.qrWrap}>
              <QRCode value={inviteUrl} size={210} color="#173126" backgroundColor="#f7edd0" />
            </View>
            <Text style={styles.modalUrl}>{inviteUrl}</Text>
            <Pressable style={styles.closeButton} onPress={() => setShowQr(false)}>
              <Text style={styles.closeText}>Cerrar</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: "rgba(255,255,255,0.04)",
    padding: spacing.md,
    gap: 10,
  },
  eyebrow: {
    color: palette.goldSoft,
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  title: {
    color: palette.parchment,
    fontSize: 18,
    fontWeight: "800",
  },
  copy: {
    color: palette.textSoft,
    fontSize: 12,
    lineHeight: 18,
  },
  codeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  codeBadge: {
    flex: 1,
    borderRadius: 14,
    backgroundColor: "rgba(212,160,23,0.1)",
    borderWidth: 1,
    borderColor: "rgba(212,160,23,0.22)",
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 2,
  },
  codeLabel: {
    color: palette.textMuted,
    fontSize: 10,
    textTransform: "uppercase",
    fontWeight: "700",
  },
  codeValue: {
    color: palette.parchment,
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: 2,
  },
  linkBox: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: "rgba(255,255,255,0.03)",
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 4,
  },
  linkLabel: {
    color: palette.textMuted,
    fontSize: 10,
    textTransform: "uppercase",
    fontWeight: "700",
  },
  linkValue: {
    color: palette.parchment,
    fontSize: 12,
    lineHeight: 17,
  },
  actions: {
    gap: 8,
  },
  feedback: {
    color: "#8ad7b2",
    fontSize: 12,
    fontWeight: "700",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(4,10,7,0.82)",
    alignItems: "center",
    justifyContent: "center",
    padding: 22,
  },
  modalCard: {
    width: "100%",
    maxWidth: 380,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: "#0b1813",
    padding: 18,
    alignItems: "center",
    gap: 10,
  },
  modalTitle: {
    color: palette.parchment,
    fontSize: 22,
    fontWeight: "800",
  },
  modalCopy: {
    color: palette.textSoft,
    fontSize: 13,
    textAlign: "center",
    lineHeight: 18,
  },
  qrWrap: {
    borderRadius: 24,
    backgroundColor: "#f7edd0",
    padding: 16,
    marginTop: 8,
  },
  modalUrl: {
    color: palette.textSoft,
    fontSize: 11,
    textAlign: "center",
    lineHeight: 16,
  },
  closeButton: {
    width: "100%",
    marginTop: 4,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: "rgba(255,255,255,0.04)",
    paddingVertical: 12,
    alignItems: "center",
  },
  closeText: {
    color: palette.parchment,
    fontSize: 13,
    fontWeight: "800",
  },
});
