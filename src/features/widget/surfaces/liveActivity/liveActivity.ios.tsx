import React from 'react';
import { HStack, Image, ProgressView, RoundedRectangle, Spacer, Text, VStack, ZStack } from '@expo/ui/swift-ui';
import { clipShape, font, foregroundStyle, frame, opacity, padding, progressViewStyle, tint, widgetURL } from '@expo/ui/swift-ui/modifiers';
import { after, createLiveActivity, type LiveActivity } from 'expo-widgets';

import type { LiveEventState, WidgetSurface } from '../../core/types';
import { readLiveEvent, writeLiveEvent } from '../../storage/widgetStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { formatTime, resolveUse24h } from '@/utils/timeFormat';

const ACTIVITY_NAME = 'NextcloudCalendarLiveActivity';

interface ActivityProps {
  title: string;
  timeRange: string;
  startLabel: string;
  location: string;
  color: string;
  startMs: number;
  endMs: number;
  link: string;
}

function toProps(state: LiveEventState): ActivityProps {
  const { timeFormat, language } = useSettingsStore.getState();
  const use24h = resolveUse24h(timeFormat, language);
  return {
    title: state.title,
    timeRange: `${formatTime(state.startIso, use24h)} – ${formatTime(state.endIso, use24h)}`,
    startLabel: formatTime(state.startIso, use24h),
    location: state.location,
    color: state.color,
    startMs: new Date(state.startIso).getTime(),
    endMs: new Date(state.endIso).getTime(),
    link: state.link,
  };
}

const CalendarLiveActivity = (props: ActivityProps) => {
  'widget';

  const TYPE = { time: 12, caption: 13, body: 15, title: 17, heading: 22 };

  function parseHex(hex: string): [number, number, number] {
    const h = (hex ? String(hex) : '#3b82f6').trim().replace('#', '');
    const expanded = h.length === 3 || h.length === 4 ? h.split('').map((c) => c + c).join('') : h;
    const n = parseInt(expanded.slice(0, 6), 16);
    if (isNaN(n) || !/^[0-9a-f]{6}(?:[0-9a-f]{2})?$/i.test(expanded)) return [59, 130, 246];
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }

  function toHex(n: number): string {
    const s = Math.max(0, Math.min(255, Math.round(n))).toString(16);
    return s.length === 1 ? `0${s}` : s;
  }

  function mixColor(hex: string, base: string, amount: number): string {
    const rgb = parseHex(hex);
    const bg = parseHex(base);
    const t = Math.min(1, Math.max(0, amount));
    return `#${toHex(bg[0] + (rgb[0] - bg[0]) * t)}${toHex(bg[1] + (rgb[1] - bg[1]) * t)}${toHex(bg[2] + (rgb[2] - bg[2]) * t)}`;
  }

  function relativeLuminance(hex: string): number {
    const rgb = parseHex(hex);
    const linear = rgb.map((value) => {
      const c = value / 255;
      return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
  }

  function displayColor(hex: string): string {
    const luminance = relativeLuminance(hex);
    if (luminance < 0.25) return '#ffffff';
    return hex || '#3b82f6';
  }

  const dc = displayColor(props.color);

  function CountdownRing({ size, ring }: { size: number; ring: string }) {
    return (
      <ProgressView
        timerInterval={{ lower: new Date(props.startMs), upper: new Date(props.endMs) }}
        countsDown
        modifiers={[progressViewStyle('circular'), tint(ring), frame({ width: size, height: size })]}
      />
    );
  }

  function InfoRow({ symbol, text, fg, size }: { symbol: React.ComponentProps<typeof Image>['systemName']; text: string; fg: string; size: number }) {
    return (
      <HStack modifiers={[padding({ top: 3 })]}>
        <Image systemName={symbol} size={size} modifiers={[foregroundStyle(fg), opacity(0.9), padding({ trailing: 5 })]} />
        <Text modifiers={[font({ size }), foregroundStyle(fg), opacity(0.9)]}>{text}</Text>
      </HStack>
    );
  }

  function Banner() {
    // Keep the event hue but pull it toward the same calm, deep surface used by
    // the widgets. Both gradient stops stay dark enough for WCAG AA white ink.
    const tintBase = '#0e1114';
    const tintStart = mixColor(props.color, tintBase, 0.34);
    const tintEnd = mixColor(props.color, tintBase, 0.2);
    const fg = '#ffffff';
    const bg = {
      type: 'linearGradient' as const,
      colors: [tintStart, tintEnd],
      startPoint: { x: 0, y: 0 },
      endPoint: { x: 1, y: 1 },
    };
    return (
      <ZStack modifiers={[widgetURL(props.link), frame({ maxWidth: Infinity }), clipShape('roundedRectangle', 24)]}>
        <RoundedRectangle cornerRadius={24} modifiers={[foregroundStyle(bg), frame({ maxWidth: Infinity, maxHeight: Infinity })]} />
        <Image
          systemName="calendar"
          size={104}
          modifiers={[foregroundStyle(fg), opacity(0.12), frame({ maxWidth: Infinity, maxHeight: Infinity, alignment: 'trailing' }), padding({ trailing: -3 })]}
        />
        <HStack modifiers={[frame({ maxWidth: Infinity }), padding({ horizontal: 16, vertical: 14 })]}>
          <CountdownRing size={66} ring={fg} />
          <VStack alignment="leading" modifiers={[frame({ maxWidth: Infinity, alignment: 'leading' }), padding({ leading: 14 })]}>
            <Text modifiers={[font({ weight: 'bold', size: TYPE.heading }), foregroundStyle(fg)]}>{props.title}</Text>
            <InfoRow symbol="clock.fill" text={props.timeRange} fg={fg} size={TYPE.caption} />
            {props.location ? <InfoRow symbol="mappin.circle.fill" text={props.location} fg={fg} size={TYPE.caption} /> : null}
          </VStack>
        </HStack>
      </ZStack>
    );
  }

  return {
    banner: <Banner />,
    compactLeading: <CountdownRing size={22} ring={dc} />,
    compactTrailing: (
      <Text modifiers={[font({ weight: 'semibold', size: TYPE.time }), foregroundStyle(dc)]}>{props.startLabel}</Text>
    ),
    minimal: <CountdownRing size={18} ring={dc} />,
    expandedLeading: (
      <HStack modifiers={[padding({ leading: 10, top: 2 })]}>
        <CountdownRing size={52} ring={dc} />
      </HStack>
    ),
    expandedTrailing: (
      <HStack modifiers={[padding({ trailing: 10, top: 2 })]}>
        <Spacer />
        <Image systemName="calendar" size={22} modifiers={[foregroundStyle(dc), opacity(0.9)]} />
      </HStack>
    ),
    expandedCenter: (
      <VStack alignment="leading" modifiers={[frame({ maxWidth: Infinity, alignment: 'leading' })]}>
        <Text modifiers={[font({ weight: 'bold', size: TYPE.title })]}>{props.title}</Text>
      </VStack>
    ),
    expandedBottom: (
      <HStack modifiers={[frame({ maxWidth: Infinity }), padding({ top: 6, bottom: 4, horizontal: 12 })]}>
        <InfoRow symbol="clock.fill" text={props.timeRange} fg={dc} size={TYPE.caption} />
        <Spacer />
        {props.location ? <InfoRow symbol="mappin.circle.fill" text={props.location} fg={dc} size={TYPE.caption} /> : null}
      </HStack>
    ),
  };
};

const activity = createLiveActivity<ActivityProps>(ACTIVITY_NAME, CalendarLiveActivity);

const DISMISS_WINDOW_MS = 4 * 60 * 60 * 1000;

let instance: LiveActivity<ActivityProps> | null = null;
let scheduledEnd = false;

function trackedInstance(): LiveActivity<ActivityProps> | null {
  if (!instance) instance = activity.getInstances()[0] ?? null;
  return instance;
}

function sameContent(a: LiveEventState, b: LiveEventState): boolean {
  return a.title === b.title
    && a.startIso === b.startIso
    && a.endIso === b.endIso
    && a.location === b.location
    && a.color === b.color;
}

export const liveActivity: WidgetSurface<LiveEventState> = {
  id: 'liveActivity',
  isSupported: () => typeof activity?.start === 'function',
  update: async (state) => {
    const previous = readLiveEvent();
    const props = toProps(state);
    const sameEvent = !!previous && previous.link === state.link;
    let current = trackedInstance();

    if (sameEvent && current) {
      if (scheduledEnd) {
        if (!previous || sameContent(previous, state)) return;
        try {
          await current.end('immediate');
        } catch {
        }
        instance = null;
        current = null;
      } else {
        try {
          await current.update(props);
          writeLiveEvent(state);
          return;
        } catch {
          instance = null;
          current = null;
        }
      }
    } else if (current) {
      try {
        await current.end('immediate');
      } catch {
      }
      instance = null;
      current = null;
    }

    writeLiveEvent(state);
    const now = Date.now();
    const canSchedule = props.endMs > now && props.endMs - now <= DISMISS_WINDOW_MS;
    try {
      const started = activity.start(props, state.link);
      instance = started;
      if (canSchedule) {
        await started.end(after(new Date(props.endMs)), props, new Date(props.endMs));
        scheduledEnd = true;
      } else {
        scheduledEnd = false;
      }
    } catch (error) {
      instance = null;
      scheduledEnd = false;
      throw error;
    }
  },
  clear: async () => {
    writeLiveEvent(null);
    const current = trackedInstance();
    scheduledEnd = false;
    if (!current) return;
    try {
      await current.end('immediate');
    } finally {
      instance = null;
    }
  },
};
