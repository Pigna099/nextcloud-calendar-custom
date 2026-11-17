import React from 'react';
import { Dimensions, StyleSheet } from 'react-native';
import { act, fireEvent, render as rtlRender } from '@testing-library/react-native';
import { ThemeWrapper } from '../helpers/theme';
import dayjs from 'dayjs';

const render = (ui: React.ReactElement, opts?: Parameters<typeof rtlRender>[1]) =>
  rtlRender(ui, { wrapper: ThemeWrapper, ...opts });
import 'dayjs/locale/fr';
import { MonthDayView, buildMonthGrid, eventDayKeys } from '@/features/calendar/components/MonthDayView';
import type { CalendarEvent } from '../../src/types';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('react-native-safe-area-context', () =>
  require('react-native-safe-area-context/jest/mock').default
);

beforeEach(() => {
  jest.spyOn(Dimensions, 'get').mockReturnValue({
    width: 390,
    height: 844,
    scale: 3,
    fontScale: 1,
  });
});

afterEach(() => {
  jest.restoreAllMocks();
});

let mockCapturedPagerProps: any[] = [];

// Render the pager's current page directly; the real pager pulls Reanimated
// hooks the jest mock does not provide.
jest.mock('react-native-infinite-pager', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: React.forwardRef((props: any, _ref: any) => {
      mockCapturedPagerProps.push(props);
      return props.renderPage ? props.renderPage({ index: 0 }) : null;
    }),
  };
});

const june10 = new Date(2026, 5, 10);
const june15 = new Date(2026, 5, 15);

const event: CalendarEvent = {
  uid: 'e1', href: '/e1.ics', calendarId: 'c1', accountId: 'a1',
  summary: 'Birthday Party',
  dtstart: new Date(2026, 5, 15, 10, 0), dtend: new Date(2026, 5, 15, 11, 0),
  allDay: false, color: '#0082c9', attendees: [], isRecurring: false,
};

function monthListEventId(item: CalendarEvent) {
  return `month-list-event-${item.calendarId}-${item.uid}-${item.dtstart.getTime()}`;
}

function view(date: Date, over: Partial<React.ComponentProps<typeof MonthDayView>> = {}) {
  return (
    <MonthDayView
      date={date}
      events={[event]}
      weekStartsOn={0}
      jump={{ nonce: 0, target: date }}
      onSelectDate={jest.fn()}
      onMonthChange={jest.fn()}
      onPressEvent={jest.fn()}
      onPressCell={jest.fn()}
      {...over}
    />
  );
}

describe('buildMonthGrid', () => {
  afterEach(() => {
    dayjs.locale('en');
  });

  function expectColumnsMatchWeekdays(weekStartsOn: 0 | 1) {
    const grid = buildMonthGrid(2026, 5, weekStartsOn);
    for (const week of grid) {
      week.forEach((cell, col) => {
        if (cell === null) return;
        expect(cell.day()).toBe((weekStartsOn + col) % 7);
      });
    }
  }

  it('aligns dates with weekday columns when week starts on Sunday', () => {
    expectColumnsMatchWeekdays(0);
  });

  it('aligns dates with weekday columns when week starts on Monday', () => {
    expectColumnsMatchWeekdays(1);
  });

  it('stays aligned under a Monday-start locale (fr)', () => {
    dayjs.locale('fr');
    expectColumnsMatchWeekdays(0);
    expectColumnsMatchWeekdays(1);
  });

  it('places June 1, 2026 (a Monday) under the Monday column', () => {
    dayjs.locale('fr');
    const isJune1 = (d: dayjs.Dayjs | null) => d !== null && d.date() === 1 && d.month() === 5;
    for (const weekStartsOn of [0, 1] as const) {
      const grid = buildMonthGrid(2026, 5, weekStartsOn);
      const firstRow = grid.find((week) => week.some(isJune1))!;
      const col = firstRow.findIndex(isJune1);
      expect((weekStartsOn + col) % 7).toBe(1);
    }
  });
});

describe('eventDayKeys', () => {
  const make = (over: Partial<CalendarEvent>): CalendarEvent => ({
    uid: 'x', href: '/x.ics', calendarId: 'c1', accountId: 'a1', summary: 'x',
    dtstart: new Date(2026, 5, 15), dtend: new Date(2026, 5, 15),
    allDay: true, color: '#000', attendees: [], isRecurring: false, ...over,
  });

  it('returns one key for a single-day all-day event', () => {
    expect(eventDayKeys(make({ dtstart: new Date(2026, 5, 15), dtend: new Date(2026, 5, 15) })))
      .toEqual(['2026-06-15']);
  });

  it('returns every day across a multi-day all-day span (inclusive end)', () => {
    expect(eventDayKeys(make({ dtstart: new Date(2026, 5, 15), dtend: new Date(2026, 5, 17) })))
      .toEqual(['2026-06-15', '2026-06-16', '2026-06-17']);
  });

  it('spans across a month boundary', () => {
    expect(eventDayKeys(make({ dtstart: new Date(2026, 5, 30), dtend: new Date(2026, 6, 2) })))
      .toEqual(['2026-06-30', '2026-07-01', '2026-07-02']);
  });

  it('returns only the start day for a timed event inside one day', () => {
    expect(eventDayKeys(make({
      allDay: false, dtstart: new Date(2026, 5, 15, 9, 0), dtend: new Date(2026, 5, 15, 10, 0),
    }))).toEqual(['2026-06-15']);
  });

  it('spans a timed event that runs past midnight', () => {
    expect(eventDayKeys(make({
      allDay: false, dtstart: new Date(2026, 5, 15, 22, 0), dtend: new Date(2026, 5, 16, 9, 0),
    }))).toEqual(['2026-06-15', '2026-06-16']);
  });

  it('stops on the start day when a timed event ends exactly at midnight', () => {
    expect(eventDayKeys(make({
      allDay: false, dtstart: new Date(2026, 5, 15, 22, 0), dtend: new Date(2026, 5, 16, 0, 0),
    }))).toEqual(['2026-06-15']);
  });

  it('spans a timed event running over several nights', () => {
    expect(eventDayKeys(make({
      allDay: false, dtstart: new Date(2026, 5, 30, 20, 0), dtend: new Date(2026, 6, 2, 6, 0),
    }))).toEqual(['2026-06-30', '2026-07-01', '2026-07-02']);
  });
});

describe('MonthDayView', () => {
  it('renders event labels directly in the month grid', () => {
    const { getByText } = render(view(june10));
    expect(getByText('Birthday Party')).toBeTruthy();
  });

  it('renders a fixed six-week grid', () => {
    const { getByTestId } = render(view(june10));
    expect(getByTestId('month-week-5')).toBeTruthy();
  });

  it('clips long event titles without an ellipsis', () => {
    const longEvent: CalendarEvent = {
      ...event,
      summary: 'A very long event title that will not fit',
    };
    const { getByText } = render(
      <MonthDayView
        date={june10}
        events={[longEvent]}
        weekStartsOn={0}
        jump={{ nonce: 0, target: june10 }}
        onSelectDate={jest.fn()}
        onMonthChange={jest.fn()}
        onPressEvent={jest.fn()}
        onPressCell={jest.fn()}
      />
    );

    const title = getByText(longEvent.summary);
    expect(title.props.ellipsizeMode).toBe('clip');
    expect(title.props.numberOfLines).toBe(1);
  });

  it('opens an event when its month-grid label is pressed', () => {
    const onPressEvent = jest.fn();
    const { getByTestId } = render(
      <MonthDayView
        date={june10}
        events={[event]}
        weekStartsOn={0}
        jump={{ nonce: 0, target: june10 }}
        onSelectDate={jest.fn()}
        onMonthChange={jest.fn()}
        onPressEvent={onPressEvent}
        onPressCell={jest.fn()}
      />
    );

    fireEvent.press(getByTestId('month-event-e1-2'));
    expect(onPressEvent).toHaveBeenCalledWith(event);
  });

  it('selects a day when its cell is pressed', () => {
    const onSelectDate = jest.fn();
    const { getByTestId } = render(
      <MonthDayView
        date={june10}
        events={[event]}
        weekStartsOn={0}
        jump={{ nonce: 0, target: june10 }}
        onSelectDate={onSelectDate}
        onMonthChange={jest.fn()}
        onPressEvent={jest.fn()}
        onPressCell={jest.fn()}
      />
    );

    fireEvent.press(getByTestId('month-day-2026-06-15'));
    expect(onSelectDate).toHaveBeenCalled();
    expect(dayjs(onSelectDate.mock.calls[0][0]).format('YYYY-MM-DD')).toBe('2026-06-15');
  });

  it('opens the day sheet with all events when a populated day is pressed', () => {
    const onSelectDate = jest.fn();
    const second: CalendarEvent = {
      ...event,
      uid: 'e2',
      summary: 'Dinner',
      dtstart: new Date(2026, 5, 15, 19, 0),
      dtend: new Date(2026, 5, 15, 20, 0),
    };
    const { getByTestId } = render(view(june10, {
      events: [event, second],
      onSelectDate,
    }));

    fireEvent.press(getByTestId('month-day-2026-06-15'));

    expect(onSelectDate).toHaveBeenCalledWith(new Date(2026, 5, 15));
    expect(getByTestId('month-day-sheet')).toBeTruthy();
    expect(getByTestId(monthListEventId(event))).toBeTruthy();
    expect(getByTestId(monthListEventId(second))).toBeTruthy();
  });

  it('creates an event when an empty day is pressed', () => {
    const onPressCell = jest.fn();
    const onSelectDate = jest.fn();
    const { getByTestId } = render(view(june10, { onPressCell, onSelectDate }));

    fireEvent.press(getByTestId('month-day-2026-06-10'));

    expect(onPressCell).toHaveBeenCalledWith(new Date(2026, 5, 10));
    expect(onSelectDate).not.toHaveBeenCalled();
  });

  it('does not create from an apparently empty day while data is loading', () => {
    const onPressCell = jest.fn();
    const { getByTestId } = render(view(june10, { onPressCell, loading: true }));

    fireEvent.press(getByTestId('month-day-2026-06-10'));

    expect(onPressCell).not.toHaveBeenCalled();
  });

  it('offers creation from the day sheet for the selected date', () => {
    const onPressCell = jest.fn();
    const { getByTestId, queryByTestId } = render(view(june10, { onPressCell }));

    fireEvent.press(getByTestId('month-day-2026-06-15'));
    fireEvent.press(getByTestId('month-day-sheet-new'));

    expect(onPressCell).toHaveBeenCalledWith(new Date(2026, 5, 15));
    expect(queryByTestId('month-day-sheet')).toBeNull();
  });

  it('reports the first day of the paged-to month through onMonthChange', () => {
    mockCapturedPagerProps = [];
    const onMonthChange = jest.fn();
    render(
      <MonthDayView
        date={june10}
        events={[event]}
        weekStartsOn={0}
        jump={{ nonce: 0, target: june10 }}
        onSelectDate={jest.fn()}
        onMonthChange={onMonthChange}
        onPressEvent={jest.fn()}
        onPressCell={jest.fn()}
      />
    );

    const pager = mockCapturedPagerProps.find((p) => typeof p.onPageChange === 'function');

    // The pager echoes the current page (0) on mount; that is not a swipe and
    // must not report a month change (which would setState into the parent's
    // render and snap the selection to the 1st).
    pager.onPageChange(0);
    expect(onMonthChange).not.toHaveBeenCalled();

    act(() => pager.onPageChange(1));
    expect(onMonthChange).toHaveBeenCalledTimes(1);
    expect(dayjs(onMonthChange.mock.calls[0][0]).format('YYYY-MM-DD')).toBe('2026-07-01');

    act(() => pager.onPageChange(-2));
    expect(dayjs(onMonthChange.mock.calls[1][0]).format('YYYY-MM-DD')).toBe('2026-04-01');
  });
});

describe('MonthDayView multi-day all-day events', () => {
  const conference: CalendarEvent = {
    uid: 'e2', href: '/e2.ics', calendarId: 'c1', accountId: 'a1',
    summary: 'Conference',
    dtstart: new Date(2026, 5, 15), dtend: new Date(2026, 5, 17),
    allDay: true, color: '#e74c3c', attendees: [], isRecurring: false,
  };

  function allDayView(date: Date) {
    return (
      <MonthDayView
        date={date}
        events={[conference]}
        weekStartsOn={0}
        jump={{ nonce: 0, target: date }}
        onSelectDate={jest.fn()}
        onMonthChange={jest.fn()}
        onPressEvent={jest.fn()}
        onPressCell={jest.fn()}
      />
    );
  }

  it('renders a multi-day event once as a spanning bar', () => {
    expect(render(allDayView(new Date(2026, 5, 16))).getAllByText('Conference')).toHaveLength(1);
  });

  it('spans three day columns for a three-day event', () => {
    const { getByTestId } = render(allDayView(new Date(2026, 5, 16)));
    const bar = StyleSheet.flatten(getByTestId('month-event-e2-2').props.style);
    const expectedWidth = (100 / 7) * 3 - 4;
    expect(parseFloat(String(bar.width))).toBeCloseTo(expectedWidth, 5);
  });

  it('does not render the event in a later month', () => {
    expect(render(allDayView(new Date(2026, 6, 15))).queryByText('Conference')).toBeNull();
  });
});
