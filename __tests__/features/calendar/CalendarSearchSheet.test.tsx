import { type ReactElement } from 'react';
import { Platform } from 'react-native';
import { fireEvent, render as rtlRender } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { CalendarSearchSheet } from '@/features/calendar/components/CalendarSearchSheet';
import { useEventSearch } from '@/features/calendar/hooks/useEventSearch';
import i18n from '@/utils/i18n';
import type { CalendarEvent } from '@/types';

import { ThemeWrapper } from '../../helpers/theme';

jest.mock('@/features/calendar/hooks/useEventSearch', () => ({
  useEventSearch: jest.fn(),
}));

jest.mock('@react-native-community/datetimepicker', () => {
  const React = require('react');
  const { View } = require('react-native');
  const MockDateTimePicker = (props: any) => React.createElement(View, {
    testID: props.testID ?? 'calendar-search-date-picker',
    onChange: props.onChange,
  });
  return { __esModule: true, default: MockDateTimePicker };
});

const mockedUseEventSearch = useEventSearch as jest.MockedFunction<typeof useEventSearch>;

const initialMetrics = {
  insets: { top: 0, left: 0, right: 0, bottom: 0 },
  frame: { x: 0, y: 0, width: 0, height: 0 },
};

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <ThemeWrapper>
      <SafeAreaProvider initialMetrics={initialMetrics}>{children}</SafeAreaProvider>
    </ThemeWrapper>
  );
}

const render = (ui: ReactElement) => rtlRender(ui, { wrapper: Wrapper });

const event: CalendarEvent = {
  uid: 'event-1',
  href: '/calendar-1/event-1.ics',
  calendarId: 'calendar-1',
  accountId: 'account-1',
  summary: 'Team meeting',
  location: 'Room 1',
  dtstart: new Date(2026, 10, 17, 11, 0, 0),
  dtend: new Date(2026, 10, 17, 12, 0, 0),
  allDay: false,
  color: '#0082c9',
  attendees: [],
  isRecurring: false,
};

function baseProps() {
  return {
    visible: true,
    onClose: jest.fn(),
    onSelectDate: jest.fn(),
    onPressEvent: jest.fn(),
  };
}

describe('CalendarSearchSheet', () => {
  beforeEach(async () => {
    mockedUseEventSearch.mockReset();
    mockedUseEventSearch.mockReturnValue({ results: [], loading: false, error: false });
    await i18n.changeLanguage('en');
  });

  it('renders an autofocused search field, a jump-to-date row, and a hint', () => {
    const props = baseProps();
    const { getByTestId, getByText } = render(<CalendarSearchSheet {...props} />);

    const input = getByTestId('calendar-search-input');
    expect(input.props.autoFocus).toBe(true);
    expect(input.props.placeholder).toBe('Search events');
    expect(getByTestId('calendar-search-jump')).toBeTruthy();
    expect(getByText('Jump to date')).toBeTruthy();
    expect(getByText("Search this account's events by title or location.")).toBeTruthy();
  });

  it('shows a result and opens the pressed event', () => {
    mockedUseEventSearch.mockReturnValue({ results: [event], loading: false, error: false });
    const props = baseProps();
    const { getByTestId, getByText } = render(<CalendarSearchSheet {...props} />);

    fireEvent.changeText(getByTestId('calendar-search-input'), 'team');

    expect(getByText('Team meeting')).toBeTruthy();
    expect(getByText('Room 1')).toBeTruthy();

    fireEvent.press(getByTestId('calendar-search-result-event-1'));

    expect(props.onPressEvent).toHaveBeenCalledWith(event);
    expect(props.onClose).toHaveBeenCalled();
  });

  it('shows a calm empty state when nothing matches', () => {
    const props = baseProps();
    const { getByTestId } = render(<CalendarSearchSheet {...props} />);

    fireEvent.changeText(getByTestId('calendar-search-input'), 'no-such-event');

    expect(getByTestId('calendar-search-empty')).toBeTruthy();
  });

  it('shows a loading state while the debounced query runs', () => {
    mockedUseEventSearch.mockReturnValue({ results: [], loading: true, error: false });
    const props = baseProps();
    const { getByTestId, getByText } = render(<CalendarSearchSheet {...props} />);

    fireEvent.changeText(getByTestId('calendar-search-input'), 'team');

    expect(getByText('Searching…')).toBeTruthy();
  });

  it('shows an error state when the local search fails', () => {
    mockedUseEventSearch.mockReturnValue({ results: [], loading: false, error: true });
    const props = baseProps();
    const { getByTestId } = render(<CalendarSearchSheet {...props} />);

    fireEvent.changeText(getByTestId('calendar-search-input'), 'team');

    expect(getByTestId('calendar-search-error')).toBeTruthy();
  });

  it('jumps to the selected date and closes the sheet', () => {
    const props = baseProps();
    const { getByTestId } = render(<CalendarSearchSheet {...props} />);

    if (Platform.OS !== 'ios') {
      fireEvent.press(getByTestId('calendar-search-jump'));
    }

    const selected = new Date(2026, 0, 15, 9, 30, 0);
    fireEvent(
      getByTestId('calendar-search-date-picker'),
      'onChange',
      { type: 'set' },
      selected,
    );

    expect(props.onSelectDate).toHaveBeenCalledWith(new Date(2026, 0, 15));
    expect(props.onClose).toHaveBeenCalled();
  });
});
