export type GameViewportMode = "phonePortrait" | "phoneLandscape" | "tabletLandscape";

export interface GameViewportInfo {
  mode: GameViewportMode;
  isTablet: boolean;
  isLandscape: boolean;
  shortSide: number;
  longSide: number;
}

export function resolveGameViewport(width: number, height: number): GameViewportInfo {
  const shortSide = Math.min(width, height);
  const longSide = Math.max(width, height);
  const isLandscape = width > height;
  const isTablet = shortSide >= 700 || longSide >= 1100;

  if (isTablet && isLandscape) {
    return {
      mode: "tabletLandscape",
      isTablet,
      isLandscape,
      shortSide,
      longSide,
    };
  }

  return {
    mode: isLandscape ? "phoneLandscape" : "phonePortrait",
    isTablet,
    isLandscape,
    shortSide,
    longSide,
  };
}
