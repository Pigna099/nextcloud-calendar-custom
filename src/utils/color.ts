/**
 * Small, dependency-free colour toolkit used by the theme, event chips and
 * widgets. Every function accepts the same permissive hex notation:
 *
 *   #rgb, #rgba, #rrggbb, #rrggbbaa (the leading "#" is optional)
 *
 * Invalid input never throws; callers get a predictable fallback instead of a
 * crash in a render pass. Alpha is carried through mixing, but ignored by the
 * WCAG contrast helpers (contrast is defined for opaque colours).
 */

export interface Rgba {
  /** 0-255 */
  r: number;
  /** 0-255 */
  g: number;
  /** 0-255 */
  b: number;
  /** 0-1 */
  a: number;
}

/** Deep ink used on light/high-luminance fills. */
export const DARK_INK = '#09101a';
/** Light ink used on dark/low-luminance fills. */
export const LIGHT_INK = '#ffffff';

const HEX_RE = /^#?([0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;

function clampChannel(value: number): number {
  return Math.min(255, Math.max(0, Math.round(value)));
}

function clampUnit(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function expandShorthand(hex: string): string {
  if (hex.length === 3 || hex.length === 4) {
    return hex
      .split('')
      .map((char) => char + char)
      .join('');
  }
  return hex;
}

/**
 * Parse a hex colour. Returns null for anything that is not a valid 3/4/6/8
 * digit hex value.
 */
export function parseHexColor(input: string | null | undefined): Rgba | null {
  if (typeof input !== 'string') return null;
  const match = HEX_RE.exec(input.trim());
  if (!match) return null;

  const expanded = expandShorthand(match[1]);
  const hasAlpha = expanded.length === 8;
  const rgb = parseInt(expanded.slice(0, 6), 16);
  const alpha = hasAlpha ? parseInt(expanded.slice(6, 8), 16) : 255;

  return {
    r: (rgb >> 16) & 255,
    g: (rgb >> 8) & 255,
    b: rgb & 255,
    a: alpha / 255,
  };
}

export function isHexColor(input: string | null | undefined): input is string {
  return parseHexColor(input) !== null;
}

/** Alias for callers that prefer the shorter name. */
export const parseHex = parseHexColor;

/** Serialize to #rrggbb, or #rrggbbaa when the colour is translucent. */
export function toHexColor({ r, g, b, a }: Rgba): string {
  const channel = (value: number) => clampChannel(value).toString(16).padStart(2, '0');
  const base = `#${channel(r)}${channel(g)}${channel(b)}`;
  return a < 1 ? `${base}${channel(a * 255)}` : base;
}

/** Alias for callers that prefer the shorter name. */
export const toHex = toHexColor;

/**
 * Mix `color` into `base`. `amount` 0 returns the base, 1 returns the colour.
 * Invalid colours fall back to the other operand, which keeps malformed
 * calendar colours from turning a chip transparent.
 */
export function mix(color: string, base: string, amount: number): string {
  const foreground = parseHexColor(color);
  const background = parseHexColor(base);

  if (!foreground) return background ? toHexColor(background) : base;
  if (!background) return toHexColor(foreground);

  const ratio = clampUnit(amount);
  return toHexColor({
    r: background.r + (foreground.r - background.r) * ratio,
    g: background.g + (foreground.g - background.g) * ratio,
    b: background.b + (foreground.b - background.b) * ratio,
    a: background.a + (foreground.a - background.a) * ratio,
  });
}

/** Alias kept for the calendar event helpers. */
export const mixColor = mix;

/** Apply opacity to a colour, returning an rgba() string. */
export function alpha(color: string, opacity: number): string {
  const parsed = parseHexColor(color);
  if (!parsed) return 'transparent';
  const a = Math.round(clampUnit(parsed.a * clampUnit(opacity)) * 1000) / 1000;
  return `rgba(${clampChannel(parsed.r)}, ${clampChannel(parsed.g)}, ${clampChannel(parsed.b)}, ${a})`;
}

function linearize(channel: number): number {
  const srgb = clampChannel(channel) / 255;
  return srgb <= 0.04045 ? srgb / 12.92 : Math.pow((srgb + 0.055) / 1.055, 2.4);
}

/** WCAG 2.x relative luminance (0 = black, 1 = white). Invalid input = 0. */
export function relativeLuminance(color: string): number {
  const parsed = parseHexColor(color);
  if (!parsed) return 0;
  return (
    0.2126 * linearize(parsed.r) +
    0.7152 * linearize(parsed.g) +
    0.0722 * linearize(parsed.b)
  );
}

/** WCAG contrast ratio between two colours (1-21). Invalid input = 1. */
export function contrastRatio(a: string, b: string): number {
  if (!isHexColor(a) || !isHexColor(b)) return 1;
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const lighter = Math.max(la, lb);
  const darker = Math.min(la, lb);
  return (lighter + 0.05) / (darker + 0.05);
}

/** Alias for callers that use "luminance" without the WCAG qualifier. */
export const luminance = relativeLuminance;

export function meetsContrast(foreground: string, background: string, minimum = 4.5): boolean {
  return contrastRatio(foreground, background) >= minimum;
}

export interface PickInkOptions {
  /** Ink used on light/high-luminance backgrounds. */
  dark?: string;
  /** Ink used on dark/low-luminance backgrounds. */
  light?: string;
}

/**
 * Pick readable ink for a background. Chooses the candidate with the better
 * contrast ratio, so white is only used when it actually wins.
 */
export function pickInk(background: string, options: PickInkOptions = {}): string {
  const { dark = DARK_INK, light = LIGHT_INK } = options;
  if (!isHexColor(background)) return light;

  const darkRatio = contrastRatio(background, dark);
  const lightRatio = contrastRatio(background, light);
  return darkRatio >= lightRatio ? dark : light;
}
