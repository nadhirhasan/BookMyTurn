import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { AccessibilityInfo, Animated, Easing, Platform } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { motion } from '@/theme';
export function useReduceMotion() {
  const [reduced, setReduced] = useState(true);
  useEffect(() => { let active = true; void AccessibilityInfo.isReduceMotionEnabled().then(value => { if (active) setReduced(value); }); const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduced); return () => { active = false; sub.remove(); }; }, []);
  return reduced;
}
// Native stacks own iOS/Android movement. Web receives the same short glide.
export function RouteMotion({ children }: { children: ReactNode }) {
  const reduced = useReduceMotion(), [progress] = useState(() => new Animated.Value(1));
  useFocusEffect(useCallback(() => {
    if (Platform.OS !== 'web' || reduced) { progress.setValue(1); return; }
    progress.setValue(0);
    const animation = Animated.timing(progress, { toValue: 1, duration: motion.page, easing: Easing.out(Easing.cubic), useNativeDriver: false });
    animation.start(); return () => animation.stop();
  }, [progress, reduced]));
  return <Animated.View style={{ flex: 1, minWidth: 0, opacity: progress.interpolate({ inputRange: [0, 1], outputRange: [0.65, 1] }), transform: [{ translateX: progress.interpolate({ inputRange: [0, 1], outputRange: [28, 0] }) }] }}>{children}</Animated.View>;
}
