import { Appearance } from 'react-native';
import { HStack, Link, RoundedRectangle, Text, VStack, ZStack } from '@expo/ui/swift-ui';
import { containerBackground, font, foregroundStyle, frame, padding } from '@expo/ui/swift-ui/modifiers';
import type { WidgetEnvironment } from 'expo-widgets';
import { createWidget } from 'expo-widgets';

import i18n from '@/utils/i18n';

import type { AgendaEventItem, AgendaSnapshot, AgendaTimelineEntry, WidgetSurface } from '../../core/types';
import { openAppLink } from '../../core/types';

const WIDGET_NAME = 'NextcloudCalendarWidget';

function CalendarWidget(props: { snapshot: AgendaSnapshot | null }, env: WidgetEnvironment) {
  'widget';

  const WIDGET_TYPE = { time: 12, caption: 13, body: 15, title: 17, heading: 22 };
  const WIDGET_SPACING = { xs: 4, sm: 8, md: 12, lg: 16 };
  const LIGHT_PALETTE = {
    background: '#f5f7f9',
    surface: '#ffffff',
    surfaceRaised: '#ffffff',
    text: '#171b20',
    textSecondary: '#4d5761',
    textTertiary: '#626d79',
    border: '#e2e7ec',
    borderStrong: '#7f8791',
    primary: '#08679c',
    onPrimary: '#ffffff',
    primarySoft: '#e7eff5',
    primarySoftBorder: '#c5d9e6',
    primarySoftText: '#0a5d8c',
    talk: '#0077b8',
    danger: '#b8322a',
    onDanger: '#ffffff',
    warning: '#9a5700',
    onWarning: '#ffffff',
  };
  const DARK_PALETTE = {
    background: '#0e1114',
    surface: '#171b20',
    surfaceRaised: '#20262d',
    text: '#edf1f4',
    textSecondary: '#b3bec8',
    textTertiary: '#8e9aa5',
    border: '#2b333c',
    borderStrong: '#68727e',
    primary: '#6cc7f5',
    onPrimary: '#0b1220',
    primarySoft: '#152a36',
    primarySoftBorder: '#244554',
    primarySoftText: '#9dd4f3',
    talk: '#5bb9e8',
    danger: '#f08a84',
    onDanger: '#2a0b09',
    warning: '#f0c37a',
    onWarning: '#2a1c05',
  };

  const LARGE_BUDGET = 4;
  const ACCESSORY_FAMILIES = ['accessoryInline', 'accessoryCircular', 'accessoryRectangular'];

  // The widget function is evaluated away from the app bundle, so the WCAG
  // helpers are mirrored here instead of importing @/utils/color.
  const DARK_INK = '#09101a';
  const LIGHT_INK = '#ffffff';

  function parseHex(hex: string): [number, number, number] | null {
    const h = (hex ? String(hex) : '').trim().replace('#', '');
    const expanded = h.length === 3 || h.length === 4 ? h.split('').map((c) => c + c).join('') : h;
    if (!/^[0-9a-f]{6}([0-9a-f]{2})?$/i.test(expanded)) return null;
    const n = parseInt(expanded.slice(0, 6), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }

  function channel(n: number): string {
    const s = Math.max(0, Math.min(255, Math.round(n))).toString(16);
    return s.length === 1 ? `0${s}` : s;
  }

  function mixColor(color: string, base: string, amount: number): string {
    const fg = parseHex(color);
    const bg = parseHex(base);
    if (!fg) return base;
    if (!bg) return color;
    const t = Math.min(1, Math.max(0, amount));
    return `#${channel(bg[0] + (fg[0] - bg[0]) * t)}${channel(bg[1] + (fg[1] - bg[1]) * t)}${channel(bg[2] + (fg[2] - bg[2]) * t)}`;
  }

  function luminance(hex: string): number {
    const rgb = parseHex(hex);
    if (!rgb) return 0;
    const linear = rgb.map((value) => {
      const c = value / 255;
      return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
  }

  function contrast(a: string, b: string): number {
    const la = luminance(a);
    const lb = luminance(b);
    return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
  }

  function pickInk(background: string): string {
    if (!parseHex(background)) return LIGHT_INK;
    return contrast(background, DARK_INK) >= contrast(background, LIGHT_INK) ? DARK_INK : LIGHT_INK;
  }

  function eventChip(color: string, palette: typeof LIGHT_PALETTE, dark: boolean) {
    const background = mixColor(color, palette.surface, dark ? 0.24 : 0.1);
    const text = pickInk(background);
    return {
      background,
      border: mixColor(color, background, dark ? 0.48 : 0.38),
      rail: parseHex(color) ? color : palette.surface,
      text,
      textSecondary: mixColor(text, background, 0.78),
    };
  }

  function agendaPalette(snapshot: AgendaSnapshot | null) {
    return (snapshot?.scheme ?? 'light') === 'dark' ? DARK_PALETTE : LIGHT_PALETTE;
  }

  function agendaHeader(snapshot: AgendaSnapshot | null) {
    return { dayLabel: snapshot?.dayLabel ?? '', dayNumber: snapshot?.dayNumber ?? '--' };
  }

  function emptyLabel(snapshot: AgendaSnapshot | null) {
    return snapshot?.relativeLabel || i18n.t('widget.emptyAgenda', { lng: snapshot?.locale });
  }

  function compactEvents(snapshot: AgendaSnapshot | null, limit: number) {
    return snapshot?.events.slice(0, limit) ?? [];
  }

  function agendaGroups(snapshot: AgendaSnapshot | null, budget: number) {
    const groups: { key: string; header: string; isToday: boolean; items: AgendaEventItem[] }[] = [];
    let left = budget;
    for (const section of snapshot?.sections ?? []) {
      if (left <= 0) break;
      if (section.items.length === 0) continue;
      const items = section.items.slice(0, left);
      left -= items.length;
      groups.push({ key: section.dayKey, header: `${section.weekdayLong} ${section.dayNumber}`, isToday: section.isToday, items });
    }
    return groups;
  }

  function EventRow({ event, palette, dark }: { event: AgendaEventItem; palette: typeof LIGHT_PALETTE; dark: boolean }) {
    const chip = eventChip(event.color, palette, dark);
    return (
      <Link destination={event.deepLink}>
        <ZStack alignment="leading" modifiers={[frame({ maxWidth: Infinity, alignment: 'leading' })]}>
          <RoundedRectangle cornerRadius={8} modifiers={[foregroundStyle(chip.background), frame({ maxWidth: Infinity, maxHeight: Infinity })]} />
          <HStack alignment="center" modifiers={[frame({ maxWidth: Infinity, alignment: 'leading' }), padding({ all: 4 })]}>
            <RoundedRectangle cornerRadius={2} modifiers={[foregroundStyle(chip.rail), frame({ width: 3, height: 24 })]} />
            <VStack alignment="leading" modifiers={[frame({ maxWidth: Infinity, alignment: 'leading' }), padding({ leading: 7 })]}>
              <Text modifiers={[font({ weight: 'medium', size: WIDGET_TYPE.body }), foregroundStyle(chip.text)]}>{event.title}</Text>
              <Text modifiers={[font({ size: WIDGET_TYPE.time }), foregroundStyle(chip.textSecondary)]}>{event.timeLabel}</Text>
            </VStack>
          </HStack>
        </ZStack>
      </Link>
    );
  }

  function EmptyState({ snapshot, palette }: { snapshot: AgendaSnapshot | null; palette: typeof LIGHT_PALETTE }) {
    return <Text modifiers={[font({ size: WIDGET_TYPE.caption }), foregroundStyle(palette.textTertiary)]}>{emptyLabel(snapshot)}</Text>;
  }

  function LargeWidget({ snapshot, palette }: { snapshot: AgendaSnapshot | null; palette: typeof LIGHT_PALETTE }) {
    const groups = agendaGroups(snapshot, LARGE_BUDGET);
    const dark = (snapshot?.scheme ?? 'light') === 'dark';
    const cells = [];
    for (const group of groups) {
      cells.push(
        <Text key={`h-${group.key}`} modifiers={[font({ weight: 'semibold', size: WIDGET_TYPE.caption }), foregroundStyle(group.isToday ? palette.primary : palette.textSecondary)]}>{group.header}</Text>
      );
      for (const event of group.items) {
        cells.push(<EventRow key={`${group.key}-${event.uid}-${event.startIso}`} event={event} palette={palette} dark={dark} />);
      }
    }
    return (
      <VStack alignment="leading" spacing={WIDGET_SPACING.sm} modifiers={[frame({ maxWidth: Infinity, maxHeight: Infinity, alignment: 'top' }), padding({ all: WIDGET_SPACING.md }), containerBackground(palette.background, 'widget')]}>
        {cells.length === 0 ? (
          <EmptyState snapshot={snapshot} palette={palette} />
        ) : cells}
      </VStack>
    );
  }

  function AccessoryWidget({ snapshot, family }: { snapshot: AgendaSnapshot | null; family: string }) {
    const next = snapshot?.nextEvent ?? null;
    if (!next) {
      return <Text modifiers={[font({ size: WIDGET_TYPE.caption })]}>{i18n.t('widget.emptyAgenda', { lng: snapshot?.locale })}</Text>;
    }
    if (family === 'accessoryInline') {
      return <Text modifiers={[font({ size: WIDGET_TYPE.caption })]}>{`${next.timeLabel} ${next.title}`}</Text>;
    }
    if (family === 'accessoryCircular') {
      return (
        <VStack>
          <Text modifiers={[font({ weight: 'semibold', size: WIDGET_TYPE.time })]}>{next.timeLabel}</Text>
        </VStack>
      );
    }
    return (
      <VStack modifiers={[frame({ maxWidth: Infinity })]}>
        <Text modifiers={[font({ weight: 'semibold', size: WIDGET_TYPE.body })]}>{next.title}</Text>
        <Text modifiers={[font({ size: WIDGET_TYPE.caption })]}>{next.timeLabel}</Text>
      </VStack>
    );
  }

  function SmallWidget({ snapshot, palette }: { snapshot: AgendaSnapshot | null; palette: typeof LIGHT_PALETTE }) {
    const header = agendaHeader(snapshot);
    const events = compactEvents(snapshot, 2);
    const dark = (snapshot?.scheme ?? 'light') === 'dark';
    const cells = [];
    cells.push(
      <VStack key="hdr" alignment="leading" modifiers={[padding({ bottom: 2 })]}>
        <Text modifiers={[font({ weight: 'semibold', size: WIDGET_TYPE.caption }), foregroundStyle(palette.primary)]}>{header.dayLabel}</Text>
        <Text modifiers={[font({ weight: 'bold', size: WIDGET_TYPE.title }), foregroundStyle(palette.text)]}>{header.dayNumber}</Text>
      </VStack>
    );
    if (events.length === 0) {
      cells.push(<EmptyState key="empty" snapshot={snapshot} palette={palette} />);
    } else {
      for (const event of events) {
        cells.push(<EventRow key={`${event.uid}-${event.startIso}`} event={event} palette={palette} dark={dark} />);
      }
    }
    return (
      <VStack alignment="leading" spacing={WIDGET_SPACING.sm} modifiers={[frame({ maxWidth: Infinity, maxHeight: Infinity, alignment: 'top' }), padding({ all: WIDGET_SPACING.md }), containerBackground(palette.background, 'widget')]}>
        {cells}
      </VStack>
    );
  }

  function MediumWidget({ snapshot, palette }: { snapshot: AgendaSnapshot | null; palette: typeof LIGHT_PALETTE }) {
    const header = agendaHeader(snapshot);
    const events = compactEvents(snapshot, 3);
    const dark = (snapshot?.scheme ?? 'light') === 'dark';
    return (
      <HStack alignment="top" modifiers={[frame({ maxWidth: Infinity, maxHeight: Infinity }), padding({ all: WIDGET_SPACING.md }), containerBackground(palette.background, 'widget')]}>
        <VStack alignment="leading" modifiers={[frame({ width: 52 })]}>
          <Text modifiers={[font({ weight: 'semibold', size: WIDGET_TYPE.caption }), foregroundStyle(palette.primary)]}>{header.dayLabel}</Text>
          <Text modifiers={[font({ weight: 'bold', size: WIDGET_TYPE.heading }), foregroundStyle(palette.text)]}>{header.dayNumber}</Text>
        </VStack>
        <VStack alignment="leading" spacing={WIDGET_SPACING.sm} modifiers={[frame({ maxWidth: Infinity, maxHeight: Infinity, alignment: 'top' }), padding({ leading: WIDGET_SPACING.sm })]}>
          {events.length === 0 ? (
            <EmptyState snapshot={snapshot} palette={palette} />
          ) : (
            events.map((event) => <EventRow key={`${event.uid}-${event.startIso}`} event={event} palette={palette} dark={dark} />)
          )}
        </VStack>
      </HStack>
    );
  }

  const snapshot = props.snapshot;
  const palette = agendaPalette(snapshot);
  const family = env.widgetFamily;

  if (ACCESSORY_FAMILIES.includes(family)) {
    return <AccessoryWidget snapshot={snapshot} family={family} />;
  }
  if (family === 'systemLarge') {
    return <LargeWidget snapshot={snapshot} palette={palette} />;
  }
  if (family === 'systemSmall') {
    return <SmallWidget snapshot={snapshot} palette={palette} />;
  }
  return <MediumWidget snapshot={snapshot} palette={palette} />;
}

const widget = createWidget<{ snapshot: AgendaSnapshot | null }>(WIDGET_NAME, CalendarWidget);

function emptySnapshot(): AgendaSnapshot {
  return {
    generatedAtIso: new Date().toISOString(),
    timeZone: '',
    scheme: Appearance.getColorScheme() === 'dark' ? 'dark' : 'light',
    dayLabel: '',
    dayNumber: '',
    relativeLabel: '',
    events: [],
    sections: [],
  };
}

export const homeWidget: WidgetSurface<AgendaTimelineEntry[]> = {
  id: 'homeWidget',
  isSupported: () => true,
  update: async (entries) => {
    if (entries.length === 0) return;
    widget.updateTimeline(entries.map((e) => ({ date: new Date(e.atIso), props: { snapshot: e.snapshot } })));
  },
  clear: async () => {
    widget.updateTimeline([{ date: new Date(), props: { snapshot: emptySnapshot() } }]);
  },
};

export { openAppLink };
