import { useCallback, useEffect, useRef, useState } from 'react';
import { useCalendarStore } from '@/stores/calendarStore';
import { trailingDebounce } from '@/utils/debounce';
import type { AgendaViewHandle } from '@/features/calendar/components/AgendaView';
import type { ViewMode } from '@/types';
import { isCalMode } from '../constants';

const FETCH_DATE_DEBOUNCE_MS = 300;

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function sameMonth(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

export function useCalendarNavigation() {
  const viewMode = useCalendarStore((s) => s.viewMode);
  const setViewMode = useCalendarStore((s) => s.setViewMode);
  const isCalendarMode = isCalMode(viewMode);

  const [date, setDateState] = useState(() => new Date());
  const [visibleMonth, setVisibleMonthState] = useState(() => startOfMonth(date));
  const [anchorDate, setAnchorDate] = useState(date);
  const [fetchDate, setFetchDate] = useState(date);
  const [agendaVisibleDate, setAgendaVisibleDate] = useState(date);
  const [jump, setJump] = useState<{ nonce: number; target: Date }>(() => ({ nonce: 0, target: date }));
  const agendaRef = useRef<AgendaViewHandle>(null);

  const fetchDebounce = useRef(
    trailingDebounce((d: Date) => setFetchDate(d), FETCH_DATE_DEBOUNCE_MS)
  ).current;

  const dateRef = useRef(date); dateRef.current = date;
  const visibleMonthRef = useRef(visibleMonth); visibleMonthRef.current = visibleMonth;
  const viewModeRef = useRef(viewMode); viewModeRef.current = viewMode;
  const agendaVisibleDateRef = useRef(agendaVisibleDate);
  agendaVisibleDateRef.current = agendaVisibleDate;

  const setDate = useCallback((d: Date) => {
    fetchDebounce.cancel();
    setDateState(d);
    setVisibleMonthState(startOfMonth(d));
    setFetchDate(d);
    setJump((j) => ({ nonce: j.nonce + 1, target: d }));
  }, [fetchDebounce]);

  const onPageChange = useCallback((d: Date) => {
    setDateState(d);
    setVisibleMonthState(startOfMonth(d));
    fetchDebounce.call(d);
  }, [fetchDebounce]);

  const onMonthPageChange = useCallback((d: Date) => {
    setVisibleMonthState(startOfMonth(d));
    fetchDebounce.call(d);
  }, [fetchDebounce]);

  useEffect(() => { if (viewMode === 'schedule') setAgendaVisibleDate(date); }, [date, viewMode]);

  useEffect(() => {
    if (viewMode !== 'schedule') return;
    fetchDebounce.call(agendaVisibleDate);
  }, [viewMode, agendaVisibleDate, fetchDebounce]);

  const switchMode = useCallback((target: ViewMode) => {
    const sourceMode = viewModeRef.current;
    if (target === sourceMode) return;
    const focus = sourceMode === 'schedule'
      ? agendaVisibleDateRef.current
      : sourceMode === 'month'
        ? (sameMonth(dateRef.current, visibleMonthRef.current) ? dateRef.current : visibleMonthRef.current)
        : dateRef.current;
    if (target !== 'schedule') {
      setAnchorDate(focus);
      setDate(focus);
    } else if (sourceMode === 'month') {
      setDate(focus);
      setAgendaVisibleDate(focus);
    }
    setViewMode(target);
  }, [setViewMode, setDate]);

  const goToday = useCallback(() => {
    const now = new Date();
    setDate(now);
    if (viewModeRef.current === 'schedule') {
      setAgendaVisibleDate(now);
      agendaRef.current?.scrollToToday();
    }
  }, [setDate]);

  return {
    viewMode,
    isCalendarMode,
    date,
    visibleMonth,
    anchorDate,
    jump,
    fetchDate,
    setDate,
    agendaVisibleDate,
    setAgendaVisibleDate,
    agendaRef,
    switchMode,
    goToday,
    onPageChange,
    onMonthPageChange,
  };
}
