import React from 'react';
import { render as rtlRender } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import { ThemeWrapper } from '../helpers/theme';
import { GridLines } from '@/features/calendar/components/GridLines';

const render = (ui: React.ReactElement) => rtlRender(ui, { wrapper: ThemeWrapper });

describe('GridLines', () => {
  it('draws an hour rule at every boundary except midnight', () => {
    const { queryAllByTestId, queryByTestId } = render(<GridLines />);
    expect(queryAllByTestId(/^hour-line-/, { includeHiddenElements: true })).toHaveLength(23);
    expect(queryByTestId('hour-line-0', { includeHiddenElements: true })).toBeNull();
    expect(queryByTestId('hour-line-23', { includeHiddenElements: true })).toBeTruthy();
  });

  it('draws a half-hour rule inside every hour', () => {
    expect(render(<GridLines />).queryAllByTestId(/^half-hour-line-/, { includeHiddenElements: true })).toHaveLength(24);
  });

  it('positions rules as percentages of the day, so they follow a live zoom', () => {
    const { getByTestId } = render(<GridLines />);
    expect(StyleSheet.flatten(getByTestId('hour-line-6', { includeHiddenElements: true }).props.style).top).toBe('25%');
    expect(StyleSheet.flatten(getByTestId('hour-line-12', { includeHiddenElements: true }).props.style).top).toBe('50%');
    expect(StyleSheet.flatten(getByTestId('half-hour-line-0', { includeHiddenElements: true }).props.style).top)
      .toBe(`${(0.5 / 24) * 100}%`);
  });

  it('keeps the half-hour rule fainter than the hour rule', () => {
    const { getByTestId } = render(<GridLines />);
    const hour = StyleSheet.flatten(getByTestId('hour-line-6', { includeHiddenElements: true }).props.style).backgroundColor;
    const half = StyleSheet.flatten(getByTestId('half-hour-line-6', { includeHiddenElements: true }).props.style).backgroundColor;
    expect(half).not.toBe(hour);
  });

  it('never intercepts touches, so the column surface underneath stays tappable', () => {
    const { getByTestId } = render(<GridLines />);
    expect(getByTestId('grid-lines', { includeHiddenElements: true }).props.pointerEvents).toBe('none');
  });

  it('stays out of the accessibility tree', () => {
    const { getByTestId } = render(<GridLines />);
    const lines = getByTestId('grid-lines', { includeHiddenElements: true });
    expect(lines.props.accessibilityElementsHidden).toBe(true);
    expect(lines.props.importantForAccessibility).toBe('no-hide-descendants');
  });
});
