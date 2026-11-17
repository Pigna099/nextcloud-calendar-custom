import React from 'react';
import { Dimensions, FlatList, StyleSheet } from 'react-native';
import { render as rtlRender } from '@testing-library/react-native';
import dayjs from 'dayjs';
import { ThemeWrapper } from '../helpers/theme';
import { AgendaView } from '@/features/calendar/components/AgendaView';
import { calendarDensityFor } from '@/features/calendar/hooks/useCalendarDensity';
import { useSettingsStore } from '@/stores/settingsStore';
import type { CalendarEvent } from '@/types';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

const render = (ui: React.ReactElement) => rtlRender(ui, { wrapper: ThemeWrapper });

function todayEvent(over: Partial<CalendarEvent> = {}): CalendarEvent {
  const day = dayjs().startOf('day');
  return {
    uid: 'a1', href: '/a1.ics', calendarId: 'c1', accountId: 'a1',
    summary: 'Standup',
    dtstart: day.add(9, 'hour').toDate(),
    dtend: day.add(10, 'hour').toDate(),
    allDay: false, color: '#0082c9', attendees: [], isRecurring: false,
    ...over,
  };
}

const agenda = (events: CalendarEvent[]) => (
  <AgendaView events={events} date={new Date()} onPressEvent={jest.fn()} onPressCell={jest.fn()} />
);

describe('AgendaView', () => {
  beforeEach(() => {
    useSettingsStore.setState({ timeFormat: '24h', language: 'en' });
    dayjs.locale('en');
  });

  it('labels each day header as a button with its full date and today state', () => {
    const { getByLabelText } = render(agenda([todayEvent()]));
    const label = `${dayjs().format('dddd, D MMMM')}, Today`;
    const header = getByLabelText(label);
    expect(header.props.accessibilityRole).toBe('button');
  });

  it('mentions that a day has no events in its header label', () => {
    const { getByLabelText } = render(agenda([]));
    expect(getByLabelText(`${dayjs().format('dddd, D MMMM')}, Today, No events`)).toBeTruthy();
  });

  it('labels an event row with title, time, duration and location', () => {
    const { getByLabelText } = render(
      agenda([todayEvent({ location: 'Room 1' })])
    );
    const row = getByLabelText('Standup, 09:00 – 10:00, 1h, Room 1');
    expect(row.props.accessibilityRole).toBe('button');
  });

  it('uses the same font-scale-aware heights for layout and scrolling', () => {
    const { UNSAFE_getByType } = render(agenda([todayEvent()]));
    const density = calendarDensityFor(Dimensions.get('window').fontScale);
    const list = UNSAFE_getByType(FlatList) as unknown as {
      props: {
        data: Array<{ type: 'header' | 'item' }>;
        getItemLayout: (data: unknown[], index: number) => { length: number; offset: number };
      };
    };
    const data = list.props.data;
    const itemIndex = data.findIndex((row) => row.type === 'item');
    expect(itemIndex).toBeGreaterThan(0);

    const header = list.props.getItemLayout(data, itemIndex - 1);
    const item = list.props.getItemLayout(data, itemIndex);

    expect(header.length).toBe(density.agendaHeaderHeight);
    expect(item.length).toBe(density.agendaEventHeight);
    expect(item.offset).toBe(header.offset + header.length);
  });

  it('starts at the selected date instead of forcing today', () => {
    const tomorrow = dayjs().add(1, 'day').startOf('day');
    const event = todayEvent({
      uid: 'tomorrow',
      dtstart: tomorrow.add(9, 'hour').toDate(),
      dtend: tomorrow.add(10, 'hour').toDate(),
    });
    const { UNSAFE_getByType } = render(
      <AgendaView
        events={[todayEvent(), event]}
        date={tomorrow.toDate()}
        onPressEvent={jest.fn()}
        onPressCell={jest.fn()}
      />
    );
    const list = UNSAFE_getByType(FlatList) as unknown as {
      props: {
        data: Array<{ type: 'header'; key: string }>;
        initialScrollIndex: number;
      };
    };
    const index = list.props.data.findIndex(
      (row) => row.type === 'header' && row.key === tomorrow.format('YYYY-MM-DD'),
    );
    expect(index).toBeGreaterThan(0);
    expect(list.props.initialScrollIndex).toBe(index);
  });
});
