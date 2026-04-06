import { useWindowDimensions } from "react-native";
import { MesaTacticaCelular } from "./MesaTacticaCelular";
import { MesaTacticaTablet } from "./MesaTacticaTablet";
import type { MesaTacticaProps } from "./MesaTacticaTypes";
import { resolveGameViewport } from "./viewport";

export type { MesaTacticaProps } from "./MesaTacticaTypes";

export function MesaTactica(props: MesaTacticaProps) {
  const { width, height } = useWindowDimensions();
  const viewport = resolveGameViewport(width, height);

  if (viewport.mode === "tabletLandscape") {
    return <MesaTacticaTablet {...props} />;
  }

  return <MesaTacticaCelular {...props} variant={viewport.mode} />;
}
