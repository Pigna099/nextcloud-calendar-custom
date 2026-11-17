import {
  allDaySectionHeight,
  calendarDensityFor,
  clampFontScale,
  MAX_FONT_SCALE,
} from '@/features/calendar/hooks/useCalendarDensity';
import type { CalendarEvent } from '@/types';

const always = (uid: string, date: Date): CalendarEvent => ({
  uid, href: `/${uid}.ics`, calendarId: 'c1', accountId: 'a1', summary: uid,
  dtstart: date, dtend: date, allDay: true, color: '#0082c9', attendees: [], isRecurring: false,
});

describe('calendarDensityFor', () => {
  it('keeps the established base sizes at font scale 1', () => {
    const density = calendarDensityFor(1);
    expect(density.agendaHeaderHeight).toBe(57);
    expect(density.agendaEventHeight).toBe(72);
    expect(density.gridDayHeaderHeight).toBe(66);
    expect(density.hourRailWidth).toBe(50);
    expect(density.allDayChipHeight).toBe(18);
    expect(density.allDayChipGap).toBe(4);
    expect(density.allDayPad).toBe(4);
  });

  it('grows rows and touch targets as the font scale grows', () => {
    const base = calendarDensityFor(1);
    const large = calendarDensityFor(1.4);

    expect(large.agendaHeaderHeight).toBeGreaterThan(base.agendaHeaderHeight);
    expect(large.agendaEventHeight).toBeGreaterThan(base.agendaEventHeight);
    expect(large.gridDayHeaderHeight).toBeGreaterThan(base.gridDayHeaderHeight);
    expect(large.agendaEventHeight).toBeGreaterThanOrEqual(44);
    expect(large.hourRailWidth).toBeGreaterThan(base.hourRailWidth);
  });

  it('clamps font scales that would break the layout', () => {
    expect(clampFontScale(3.1)).toBe(MAX_FONT_SCALE);
    expect(clampFontScale(0.5)).toBe(1);
    expect(clampFontScale(Number.NaN)).toBe(1);
    expect(clampFontScale(undefined)).toBe(1);
    expect(calendarDensityFor(5)).toEqual(calendarDensityFor(MAX_FONT_SCALE));
  });

  it('computes the all-day band from the scaled chip height', () => {
    const date = new Date(2026, 7, 7);
    const events = [always('a', date), always('b', date)];
    const density = calendarDensityFor(1.25);

    expect(allDaySectionHeight([date], events, density)).toBe(
      2 * (density.allDayChipHeight + density.allDayChipGap) + density.allDayPad
    );
  });

  it('returns no all-day band without events or matching days', () => {
    const density = calendarDensityFor(1);
    expect(allDaySectionHeight([new Date(2026, 7, 7)], [], density)).toBe(0);
    expect(allDaySectionHeight(
      [new Date(2026, 7, 7)],
      [always('a', new Date(2026, 7, 8))],
      density,
    )).toBe(0);
  });
});
