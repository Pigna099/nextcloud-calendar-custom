import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, useWindowDimensions } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { drawerWidthFor } from '../constants';
import { useReduceMotion } from './useReduceMotion';

export function useCalendarDrawer() {
  const { width: screenWidth } = useWindowDimensions();
  const drawerWidth = drawerWidthFor(screenWidth);
  const reduceMotion = useReduceMotion();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const drawerAnim = useRef(new Animated.Value(-drawerWidth)).current;
  const overlayAnim = useRef(new Animated.Value(0)).current;
  const drawerAnimation = useRef<Animated.CompositeAnimation | null>(null);
  const openRef = useRef(false);

  useEffect(() => {
    if (!openRef.current) drawerAnim.setValue(-drawerWidth);
  }, [drawerWidth, drawerAnim]);

  const openDrawer = useCallback(() => {
    drawerAnimation.current?.stop();
    openRef.current = true;
    setDrawerOpen(true);

    if (reduceMotion) {
      drawerAnim.setValue(0);
      overlayAnim.setValue(1);
      return;
    }

    drawerAnimation.current = Animated.parallel([
      Animated.timing(drawerAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
      Animated.timing(overlayAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
    ]);
    drawerAnimation.current.start();
  }, [drawerAnim, overlayAnim, reduceMotion]);

  const closeDrawer = useCallback(() => {
    drawerAnimation.current?.stop();
    openRef.current = false;
    setDrawerOpen(false);

    if (reduceMotion) {
      drawerAnim.setValue(-drawerWidth);
      overlayAnim.setValue(0);
      return;
    }

    drawerAnimation.current = Animated.parallel([
      Animated.timing(drawerAnim, { toValue: -drawerWidth, duration: 250, useNativeDriver: true }),
      Animated.timing(overlayAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]);
    drawerAnimation.current.start();
  }, [drawerAnim, overlayAnim, drawerWidth, reduceMotion]);

  const resetDrawer = useCallback(() => {
    drawerAnimation.current?.stop();
    openRef.current = false;
    drawerAnim.setValue(-drawerWidth);
    overlayAnim.setValue(0);
    setDrawerOpen(false);
  }, [drawerAnim, overlayAnim, drawerWidth]);

  useFocusEffect(useCallback(() => {
    resetDrawer();
  }, [resetDrawer]));

  return { drawerOpen, drawerAnim, overlayAnim, drawerWidth, openDrawer, closeDrawer };
}
