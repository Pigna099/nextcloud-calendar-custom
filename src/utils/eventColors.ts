import { CSS3_BY_NAME } from './cssColorNames';

export { CSS3_BY_NAME };

/**
 * Per-event colors must map to CSS3 color names because the Nextcloud Calendar
 * web app resolves `COLOR` through its CSS3 color-name table. The app itself
 * stores/displays hex colors.
 */
export const EVENT_COLORS = [
  '#1e90ff', // dodgerblue
  '#3cb371', // mediumseagreen
  '#ffd700', // gold
  '#dc143c', // crimson
  '#ff8c00', // darkorange
  '#c71585', // mediumvioletred
  '#6a5acd', // slateblue
  '#008080', // teal
  '#ff69b4', // hotpink
  '#708090', // slategray
] as const;

export const CSS3_NAME_BY_HEX: Record<string, string> = Object.fromEntries(
  Object.entries(CSS3_BY_NAME).map(([name, hex]) => [hex, name]),
);

export function hexForColorName(name: string): string | undefined {
  return CSS3_BY_NAME[name.trim().toLowerCase()];
}

function rgb(hex: string): [number, number, number] | null {
  let h = hex.trim().replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  if (!/^[0-9a-f]{6}$/i.test(h)) return null;
  const n = parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** Nextcloud web only accepts CSS3 names, so map arbitrary hex to the nearest one. */
export function colorNameForHex(hex: string): string {
  const exact = CSS3_NAME_BY_HEX[hex.trim().toLowerCase()];
  if (exact) return exact;

  const target = rgb(hex);
  if (!target) return hex;

  let bestName = hex;
  let bestDistance = Infinity;
  for (const [name, value] of Object.entries(CSS3_BY_NAME)) {
    const candidate = rgb(value);
    if (!candidate) continue;
    const distance =
      (target[0] - candidate[0]) ** 2 +
      (target[1] - candidate[1]) ** 2 +
      (target[2] - candidate[2]) ** 2;
    if (distance < bestDistance) {
      bestDistance = distance;
      bestName = name;
    }
  }
  return bestName;
}
