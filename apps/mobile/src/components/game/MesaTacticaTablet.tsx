import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, Text, View } from "react-native";
import { CASTLE_LABEL, GAME_BRAND, displayPlayerName } from "../../../../../lib/lore";
import { palette, radius } from "../../theme/tokens";
import { ActionButton } from "../ui/ActionButton";
import { SectionCard } from "../ui/SectionCard";
import { BitacoraBatalla } from "./BitacoraBatalla";
import { CastleHud } from "./CastleHud";
import { TiraCartas, TiraUnidades } from "./CartaJuego";
import { phaseTitle, useMesaTacticaModel } from "./mesaTacticaModel";
import type { MesaTacticaProps } from "./MesaTacticaTypes";

function BarraJugador({ name, cards, active }: { name: string; cards: number; active: boolean }) {
  return (
    <View style={[styles.playerBar, active ? styles.playerBarActive : null]}>
      <View style={styles.playerBadge}>
        <Text style={styles.playerBadgeText}>{cards}</Text>
      </View>
      <View style={styles.playerInfo}>
        <Text numberOfLines={1} style={styles.playerName}>
          {name}
        </Text>
        <View style={styles.playerTrack}>
          <View style={styles.playerTrackFill} />
        </View>
      </View>
    </View>
  );
}

export function MesaTacticaTablet(props: MesaTacticaProps) {
  const { battleView, scorePlayers, scoreByPlayer, privateSpyView, onAction, onExit, error, onClearError } = props;
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
      <LinearGradient colors={["#d4bb91", "#ead8b7", "#bb8750"]} style={styles.board}>
        <View style={styles.header}>
          <Text style={styles.title}>{GAME_BRAND}</Text>
          <View style={styles.headerRight}>
            <View style={styles.chip}>
              <Text style={styles.chipText}>{phaseTitle[battleView.phase] ?? battleView.phase}</Text>
            </View>
            <View style={styles.chip}>
              <Text style={styles.chipText}>T{battleView.currentTurn}</Text>
            </View>
            {onExit ? <ActionButton label="Salir" onPress={onExit} tone="secondary" /> : null}
          </View>
        </View>

        <BarraJugador
          name={displayPlayerName(rival?.displayName, "rival")}
          cards={rival?.cardCount ?? 0}
          active={battleView.activePlayerId === rival?.playerId}
        />

        <View style={styles.zone}>
          <TiraUnidades
            title=""
            units={rival?.field ?? []}
            selectedUnitId={selectedTargetUnitId}
            onUnitPress={(unit) => setSelectedTargetUnitId((current) => (current === unit.instanceId ? null : unit.instanceId))}
            emptyLabel="Hueco"
            variant="tabletLandscape"
            showTitle={false}
          />
        </View>

        <View style={styles.centerRow}>
          <View style={styles.pileBox}>
            <Text style={styles.pileLabel}>Mazo</Text>
            <Text style={styles.pileValue}>{battleView.centralDeckCount}</Text>
          </View>
          <View style={styles.promptBox}>
            <Text numberOfLines={1} style={styles.promptText}>
              {prompt}
            </Text>
          </View>
          <View style={styles.pileBox}>
            <Text style={styles.pileLabel}>Descarte</Text>
            <Text style={styles.pileValue}>{battleView.discardCount}</Text>
          </View>
        </View>

        <View style={styles.zone}>
          <TiraUnidades
            title=""
            units={me.field}
            selectedUnitId={selectedSourceUnitId}
            onUnitPress={(unit) => setSelectedSourceUnitId((current) => (current === unit.instanceId ? null : unit.instanceId))}
            emptyLabel="Bajar"
            variant="tabletLandscape"
            showTitle={false}
          />
        </View>

        <BarraJugador name={displayPlayerName(me.displayName)} cards={me.hand.length} active={battleView.activePlayerId === me.playerId} />

        <View style={styles.handBox}>
          <View style={styles.handInner}>
            <TiraCartas title="" cards={me.hand} selectedCardIds={selectedCardIds} onCardPress={toggleCard} variant="tabletLandscape" showTitle={false} />
          </View>
        </View>
      </LinearGradient>

      <View style={styles.sidebar}>
        <SectionCard eyebrow="Rueda" title="Orden" compact>
          <Text style={styles.sideText}>{prompt}</Text>
          {battleView.phase === "TURN_TRADE" && selectedCard?.tipo === "oro" ? (
            <View style={styles.tradeRow}>
              <ActionButton label="-" onPress={() => setTradeAmount((current) => Math.max(1, current - 1))} tone="secondary" />
              <Text style={styles.tradeValue}>
                {tradeAmount}/{tradeMax}
              </Text>
              <ActionButton label="+" onPress={() => setTradeAmount((current) => Math.min(tradeMax, current + 1))} tone="secondary" />
            </View>
          ) : null}
          <View style={styles.stack}>
            {options.length > 0 ? (
              options.map((item, index) => (
                <ActionButton key={`${item.label}-${index}`} label={item.label} onPress={() => execute(item.action)} tone={item.tone ?? "primary"} />
              ))
            ) : (
              <Text style={styles.sideText}>Sin accion lista.</Text>
            )}
          </View>
        </SectionCard>

        <SectionCard eyebrow="Tanteador" title="Marca" compact>
          <View style={styles.stackTight}>
            {scorePlayers.map((player) => (
              <View key={player.playerId} style={styles.scoreRow}>
                <Text style={styles.scoreName}>{displayPlayerName(player.displayName, player.playerId === me.playerId ? "player" : "rival")}</Text>
                <Text style={styles.scoreValue}>{scoreByPlayer[player.playerId] ?? 0}</Text>
              </View>
            ))}
          </View>
        </SectionCard>

        <SectionCard eyebrow={CASTLE_LABEL} title="Progreso" compact>
          <CastleHud me={battleView.me} opponents={battleView.opponents} compact />
        </SectionCard>

        {spyView ? (
          <SectionCard eyebrow="Baqueano" title={spyView.targetLabel} compact>
            <Text style={styles.sideText}>{spyView.cards.map((card) => card.nombre).join(" | ") || "Sin cartas visibles."}</Text>
          </SectionCard>
        ) : null}

        {error ? (
          <SectionCard eyebrow="Aviso" title="No se pudo ejecutar" compact>
            <Text style={styles.errorText}>{error}</Text>
          </SectionCard>
        ) : null}

        <SectionCard eyebrow="Fogon" title="Novedades" compact>
          <BitacoraBatalla eventos={battleView.log} limit={3} compact />
        </SectionCard>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    flexDirection: "row",
    alignItems: "stretch",
    gap: 10,
  },
  board: {
    flex: 1,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: "rgba(92,56,24,0.28)",
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 8,
    gap: 6,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  title: {
    color: "#fff4d9",
    fontSize: 16,
    fontWeight: "700",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  chip: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: "rgba(95,58,28,0.8)",
    borderWidth: 1,
    borderColor: "rgba(241,201,139,0.28)",
  },
  chipText: {
    color: "#f7e5c0",
    fontSize: 8,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  playerBar: {
    alignSelf: "center",
    minWidth: 170,
    maxWidth: 244,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: radius.lg,
    backgroundColor: "rgba(103,61,31,0.8)",
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  playerBarActive: {
    shadowColor: "#f0c77e",
    shadowOpacity: 0.28,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
  },
  playerBadge: {
    width: 24,
    height: 24,
    borderRadius: 8,
    backgroundColor: "#f7ecd9",
    alignItems: "center",
    justifyContent: "center",
  },
  playerBadgeText: {
    color: "#5d3818",
    fontSize: 12,
    fontWeight: "800",
  },
  playerInfo: {
    flex: 1,
    gap: 3,
  },
  playerName: {
    color: "#fff2d6",
    fontSize: 13,
    fontWeight: "700",
  },
  playerTrack: {
    height: 5,
    borderRadius: 999,
    backgroundColor: "rgba(252,240,219,0.18)",
    overflow: "hidden",
  },
  playerTrackFill: {
    width: "55%",
    height: "100%",
    backgroundColor: "#7dcc72",
  },
  zone: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: "rgba(132,88,40,0.22)",
    backgroundColor: "rgba(255,246,229,0.16)",
    padding: 5,
  },
  centerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  pileBox: {
    width: 50,
    borderRadius: radius.lg,
    backgroundColor: "#6d4d31",
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
    fontSize: 14,
    fontWeight: "800",
  },
  promptBox: {
    flex: 1,
    minHeight: 28,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(139,96,48,0.28)",
    backgroundColor: "rgba(255,248,233,0.18)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
  },
  promptText: {
    color: "#704825",
    fontSize: 10,
    fontWeight: "700",
  },
  handBox: {
    borderTopWidth: 1,
    borderTopColor: "rgba(128,96,46,0.2)",
    paddingTop: 4,
    flexGrow: 1,
    justifyContent: "center",
  },
  handInner: {
    alignSelf: "center",
    width: "100%",
    maxWidth: 1120,
  },
  sidebar: {
    width: 224,
    gap: 8,
    justifyContent: "flex-start",
  },
  sideText: {
    color: palette.textSoft,
    fontSize: 11,
    lineHeight: 15,
  },
  tradeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  tradeValue: {
    color: palette.parchment,
    fontSize: 12,
    fontWeight: "700",
  },
  stack: {
    gap: 6,
  },
  stackTight: {
    gap: 4,
  },
  scoreRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    paddingVertical: 2,
  },
  scoreName: {
    color: palette.parchment,
    fontSize: 12,
    flex: 1,
  },
  scoreValue: {
    color: palette.gold,
    fontSize: 13,
    fontWeight: "800",
  },
  errorText: {
    color: palette.danger,
    fontSize: 11,
    lineHeight: 15,
  },
});
