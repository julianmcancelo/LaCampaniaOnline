import { LinearGradient } from "expo-linear-gradient";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { palette, radius } from "../../theme/tokens";
import { ActionButton } from "../ui/ActionButton";
import { BitacoraBatalla } from "./BitacoraBatalla";
import { CastleHud } from "./CastleHud";
import { TiraCartas, TiraUnidades } from "./CartaJuego";
import { phaseTitle, useMesaTacticaModel } from "./mesaTacticaModel";
import type { MesaTacticaProps } from "./MesaTacticaTypes";
import type { GameViewportMode } from "./viewport";

function TopChip({ label }: { label: string }) {
  return (
    <View style={styles.chip}>
      <Text style={styles.chipText}>{label}</Text>
    </View>
  );
}

export function MesaTacticaCelular(props: MesaTacticaProps & { variant: GameViewportMode }) {
  const { battleView, scorePlayers, scoreByPlayer, privateSpyView, onAction, onExit, error, onClearError, variant } = props;
  const compactLandscape = variant === "phoneLandscape";
  const {
    me,
    rival,
    selectedCardIds,
    selectedSourceUnitId,
    selectedTargetUnitId,
    selectedCard,
    prompt,
    spyView,
    options,
    tradeAmount,
    tradeMax,
    setTradeAmount,
    setSelectedSourceUnitId,
    setSelectedTargetUnitId,
    toggleCard,
    execute,
  } = useMesaTacticaModel({
    battleView,
    privateSpyView,
    onAction,
    onClearError,
  });

  return (
    <View style={styles.root}>
      <LinearGradient colors={["#d8bf97", "#e8d5af", "#c9ab7e"]} style={styles.board}>
        <View style={styles.header}>
          <Text style={styles.title}>La Campaña</Text>
          <View style={styles.headerActions}>
            <TopChip label={phaseTitle[battleView.phase] ?? battleView.phase} />
            <TopChip label={`T${battleView.currentTurn}`} />
            {onExit ? <ActionButton label="Salir" onPress={onExit} tone="secondary" /> : null}
          </View>
        </View>

        <View style={styles.summaryRow}>
          <TopChip label={`${rival?.displayName ?? "Rival"} ${rival?.cardCount ?? 0}`} />
          <TopChip label={`${me.displayName} ${me.hand.length}`} />
        </View>

        <View style={styles.compactPanel}>
          <CastleHud me={battleView.me} opponents={battleView.opponents} compact />
        </View>

        <View style={styles.zone}>
          <TiraUnidades
            title=""
            units={rival?.field ?? []}
            selectedUnitId={selectedTargetUnitId}
            onUnitPress={(unit) => setSelectedTargetUnitId((current) => (current === unit.instanceId ? null : unit.instanceId))}
            emptyLabel="Espacio"
            variant={variant}
            showTitle={false}
          />
        </View>

        <View style={styles.centerRow}>
          <View style={styles.pileBox}>
            <Text style={styles.pileLabel}>Mazo</Text>
            <Text style={styles.pileValue}>{battleView.centralDeckCount}</Text>
          </View>
          <Text numberOfLines={compactLandscape ? 1 : 2} style={styles.promptText}>
            {prompt}
          </Text>
          <View style={styles.pileBox}>
            <Text style={styles.pileLabel}>Desc</Text>
            <Text style={styles.pileValue}>{battleView.discardCount}</Text>
          </View>
        </View>

        <View style={styles.zone}>
          <TiraUnidades
            title=""
            units={me.field}
            selectedUnitId={selectedSourceUnitId}
            onUnitPress={(unit) => setSelectedSourceUnitId((current) => (current === unit.instanceId ? null : unit.instanceId))}
            emptyLabel="Soltá"
            variant={variant}
            showTitle={false}
          />
        </View>

        <View style={styles.handArea}>
          <TiraCartas title="" cards={me.hand} selectedCardIds={selectedCardIds} onCardPress={toggleCard} variant={variant} showTitle={false} />
        </View>
      </LinearGradient>

      <View style={[styles.footerPanel, compactLandscape ? styles.footerPanelLandscape : null]}>
        <Text style={styles.panelTitle}>Jugada</Text>
        <Text style={styles.smallCopy}>{prompt}</Text>

        {battleView.phase === "TURN_TRADE" && selectedCard?.tipo === "oro" ? (
          <View style={styles.tradeRow}>
            <ActionButton label="-" onPress={() => setTradeAmount((current) => Math.max(1, current - 1))} tone="secondary" />
            <Text style={styles.tradeValue}>
              {tradeAmount}/{tradeMax}
            </Text>
            <ActionButton label="+" onPress={() => setTradeAmount((current) => Math.min(tradeMax, current + 1))} tone="secondary" />
          </View>
        ) : null}

        <View style={styles.actionStrip}>
          {options.length > 0 ? (
            options.slice(0, compactLandscape ? 3 : 2).map((item, index) => (
              <View key={`${item.label}-${index}`} style={[styles.actionCell, compactLandscape ? styles.actionCellLandscape : null]}>
                <ActionButton label={item.label} onPress={() => execute(item.action)} tone={item.tone ?? "primary"} />
              </View>
            ))
          ) : (
            <Text style={styles.smallCopy}>Sin acción lista.</Text>
          )}
        </View>

        <View style={styles.metaRow}>
          {scorePlayers.map((player) => (
            <View key={player.playerId} style={styles.metaPill}>
              <Text numberOfLines={1} style={styles.metaPillText}>
                {player.displayName}: {scoreByPlayer[player.playerId] ?? 0}
              </Text>
            </View>
          ))}
          {spyView ? (
            <Pressable style={styles.metaPill}>
              <Text numberOfLines={1} style={styles.metaPillText}>
                Espía: {spyView.targetLabel}
              </Text>
            </Pressable>
          ) : null}
          {error ? (
            <Pressable style={[styles.metaPill, styles.metaPillWarn]}>
              <Text numberOfLines={1} style={styles.metaPillText}>
                {error}
              </Text>
            </Pressable>
          ) : null}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.logRow}>
          <View style={styles.logCard}>
            <BitacoraBatalla eventos={battleView.log} limit={compactLandscape ? 2 : 3} compact />
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    gap: 6,
  },
  board: {
    flex: 1,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: "rgba(96,65,27,0.22)",
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: 6,
    gap: 6,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 6,
  },
  title: {
    color: "#fff4d9",
    fontSize: 15,
    fontWeight: "700",
    flex: 1,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  chip: {
    borderRadius: 999,
    paddingHorizontal: 7,
    paddingVertical: 4,
    backgroundColor: "rgba(61,81,52,0.68)",
    borderWidth: 1,
    borderColor: "rgba(109,92,51,0.3)",
  },
  chipText: {
    color: "#f7e8bf",
    fontSize: 8,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  summaryRow: {
    flexDirection: "row",
    gap: 4,
    flexWrap: "wrap",
  },
  compactPanel: {
    borderRadius: radius.md,
    backgroundColor: "rgba(255,255,255,0.09)",
    borderWidth: 1,
    borderColor: "rgba(128, 96, 46, 0.18)",
    padding: 5,
  },
  zone: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: "rgba(128, 96, 46, 0.18)",
    backgroundColor: "rgba(255,255,255,0.12)",
    padding: 4,
  },
  centerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  pileBox: {
    width: 38,
    borderRadius: radius.lg,
    backgroundColor: "#56715d",
    paddingVertical: 7,
    alignItems: "center",
    justifyContent: "center",
  },
  pileLabel: {
    color: "#fbf4e8",
    fontSize: 8,
    textTransform: "uppercase",
    fontWeight: "800",
  },
  pileValue: {
    color: "#fbf4e8",
    fontSize: 13,
    fontWeight: "800",
  },
  promptText: {
    flex: 1,
    color: "#745e38",
    fontSize: 10,
    fontWeight: "700",
  },
  handArea: {
    borderTopWidth: 1,
    borderTopColor: "rgba(128, 96, 46, 0.18)",
    paddingTop: 4,
  },
  footerPanel: {
    borderRadius: radius.lg,
    backgroundColor: "rgba(18, 35, 27, 0.92)",
    borderWidth: 1,
    borderColor: palette.border,
    padding: 8,
    gap: 6,
  },
  footerPanelLandscape: {
    paddingVertical: 6,
  },
  panelTitle: {
    color: palette.parchment,
    fontSize: 14,
    fontWeight: "700",
  },
  smallCopy: {
    color: palette.textSoft,
    fontSize: 11,
    lineHeight: 14,
  },
  tradeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 6,
  },
  tradeValue: {
    color: palette.parchment,
    fontSize: 12,
    fontWeight: "700",
  },
  actionStrip: {
    flexDirection: "row",
    gap: 6,
    flexWrap: "wrap",
  },
  actionCell: {
    minWidth: 126,
    flexGrow: 1,
  },
  actionCellLandscape: {
    minWidth: 136,
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  metaPill: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 5,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: palette.border,
  },
  metaPillWarn: {
    backgroundColor: "rgba(180,93,86,0.12)",
  },
  metaPillText: {
    color: palette.textSoft,
    fontSize: 10,
    fontWeight: "700",
  },
  logRow: {
    paddingRight: 6,
  },
  logCard: {
    minWidth: 220,
    maxWidth: 320,
  },
});
