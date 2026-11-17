import { useMemo } from 'react';
import { useWindowDimensions } from 'react-native';
import type { CalendarEvent } from '@/types';
import { allDayEventsForDay } from '../utils/grid';

/**
 * Font scaling is useful up to a point in a dense time grid. Beyond this the
 * layout would need a completely different information hierarchy, so we clamp
 * instead of letting a 310% accessibility size blow the grid apart.
 */
export const MIN_FONT_SCALE = 1;
export const MAX_FONT_SCALE = 1.5;

/** Smallest comfortably tappable target, in points. */
export const MIN_TOUCH_TARGET = 44;

export interface CalendarDensity {
  fontScale: number;
  /** Height of one agenda day header. */
  agendaHeaderHeight: number;
  /** Height of one agenda event row, including its vertical margins. */
  agendaEventHeight: number;
  agendaDayBadgeSize: number;
  agendaDayNumberSize: number;
  agendaDayNameSize: number;
  agendaTodayLabelSize: number;
  agendaEventTitleSize: number;
  agendaEventMetaSize: number;
  agendaEventDetailSize: number;
  agendaNoEventsSize: number;
  /** Height of the day-number band in the time-grid header. */
  gridDayHeaderHeight: number;
  gridDayBadgeSize: number;
  gridDayNumberSize: number;
  gridDayWeekdaySize: number;
  hourRailWidth: number;
  hourRailFontSize: number;
  allDayChipHeight: number;
  allDayChipGap: number;
  allDayPad: number;
  allDayChipFontSize: number;
  allDayChipLineHeight: number;
}

export function clampFontScale(fontScale: number | null | undefined): number {
  if (typeof fontScale !== 'number' || !Number.isFinite(fontScale) || fontScale <= 0) {
    return MIN_FONT_SCALE;
  }
  return Math.min(MAX_FONT_SCALE, Math.max(MIN_FONT_SCALE, fontScale));
}

/**
 * Pure density calculation so components and tests can agree on every derived
 * height without going through React.
 */
export function calendarDensityFor(fontScale: number | null | undefined): CalendarDensity {
  const scale = clampFontScale(fontScale);
  const extra = scale - 1;
  const allDayChipHeight = Math.round(18 + extra * 14);

  return {
    fontScale: scale,
    agendaHeaderHeight: Math.round(57 + extra * 36),
    agendaEventHeight: Math.round(72 + extra * 36),
    agendaDayBadgeSize: Math.round(36 + extra * 12),
    agendaDayNumberSize: Math.round(16 * scale),
    agendaDayNameSize: Math.round(11 * scale),
    agendaTodayLabelSize: Math.round(10 * scale),
    agendaEventTitleSize: Math.round(14 * scale),
    agendaEventMetaSize: Math.round(12 * scale),
    agendaEventDetailSize: Math.round(11 * scale),
    agendaNoEventsSize: Math.round(13 * scale),
    gridDayHeaderHeight: Math.round(66 + extra * 28),
    gridDayBadgeSize: Math.round(36 + extra * 12),
    gridDayNumberSize: Math.round(20 * scale),
    gridDayWeekdaySize: Math.round(13 * scale),
    hourRailWidth: Math.round(50 + extra * 14),
    hourRailFontSize: Math.round(12 * scale),
    allDayChipHeight,
    allDayChipGap: Math.round(4 + extra * 2),
    allDayPad: Math.round(4 + extra * 4),
    allDayChipFontSize: Math.round(12 * scale),
    allDayChipLineHeight: Math.round(allDayChipHeight * 0.8),
  };
}

/**
 * Height of the all-day band for a page. Mirrors `allDayRowHeight` from
 * utils/grid but uses the font-scale-aware chip metrics; at scale 1 it returns
 * exactly the same value as the fixed-metric helper.
 */
export function allDaySectionHeight(
  dates: Date[],
  allDayEvents: CalendarEvent[],
  density: CalendarDensity,
): number {
  if (allDayEvents.length === 0) return 0;

  let maxPerDay = 0;
  for (const date of dates) {
    const count = allDayEventsForDay(date, allDayEvents).length;
    if (count > maxPerDay) maxPerDay = count;
  }

  if (maxPerDay === 0) return 0;
  return maxPerDay * (density.allDayChipHeight + density.allDayChipGap) + density.allDayPad;
}

export function useCalendarDensity(): CalendarDensity {
  const { fontScale } = useWindowDimensions();
  return useMemo(() => calendarDensityFor(fontScale), [fontScale]);
}
