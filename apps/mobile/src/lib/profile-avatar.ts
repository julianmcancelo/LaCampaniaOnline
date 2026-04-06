export type AvatarKind = "google" | "crest";

const crestPalettes = [
  { start: "#5d7f6f", end: "#203b31", accent: "#f2d484" },
  { start: "#6b5c87", end: "#2f2440", accent: "#efe2c9" },
  { start: "#8f5d4f", end: "#3f221d", accent: "#f2d484" },
  { start: "#5d748f", end: "#1d3143", accent: "#efe2c9" },
  { start: "#7f6b4c", end: "#392d18", accent: "#f2d484" },
  { start: "#6f8a56", end: "#29391a", accent: "#efe2c9" },
];

function hashSeed(seed: string): number {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) >>> 0;
  }
  return hash;
}

export function buildCrestId(seed: string): string {
  const normalized = seed.trim().toLowerCase() || "viajero";
  return `crest-${hashSeed(normalized).toString(36)}`;
}

export function crestPalette(crestId: string) {
  const hash = hashSeed(crestId);
  return crestPalettes[hash % crestPalettes.length];
}

export function crestGlyph(seed: string): string {
  const trimmed = seed.trim();
  if (!trimmed) {
    return "C";
  }

  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    return parts[0].slice(0, 1).toUpperCase();
  }

  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}
