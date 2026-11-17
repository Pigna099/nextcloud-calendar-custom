import { alpha, LIGHT_INK, mix, parseHexColor, pickInk, toHexColor } from '@/utils/color';

export { mix as mixColor } from '@/utils/color';

/**
 * Tinted event surface. The hue stays recognisable in the rail and border, but
 * the fill is pulled toward the surrounding surface so rows read as calendar
 * colour instead of solid paint. Shape is unchanged for existing callers.
 */
export function eventChipColors(color: string, surface: string, dark: boolean) {
  // Google Calendar-like event pills: noticeably tinted with the calendar hue,
  // not full saturation. Dark mode needs a higher mix to stay vivid on grey.
  const background = mix(color, surface, dark ? 0.52 : 0.38);
  const border = mix(color, background, dark ? 0.58 : 0.46);
  const parsed = parseHexColor(color);
  const rail = parsed ? toHexColor(parsed) : surface;

  return { background, border, rail };
}

/** WCAG ink for a tinted chip fill. */
export function eventChipInk(background: string) {
  const text = pickInk(background);
  return {
    text,
    textSecondary: mix(text, background, 0.86),
  };
}

/** Convenience for surfaces that need both the tint and its readable ink. */
export function eventChipColorsWithInk(color: string, surface: string, dark: boolean) {
  const chip = eventChipColors(color, surface, dark);
  return { ...chip, ...eventChipInk(chip.background) };
}

/**
 * Ink for a solid event-coloured surface. Kept for callers that treat an event
 * colour as a full fill; the shape is unchanged, but the ink is now chosen by
 * WCAG contrast rather than a perceived-brightness cutoff.
 */
export function contrastFor(hex: string) {
  const ink = pickInk(hex);
  const light = ink === LIGHT_INK;
  return {
    text: ink,
    subtext: alpha(ink, light ? 0.85 : 0.62),
    border: alpha(ink, light ? 0.35 : 0.16),
  };
}
