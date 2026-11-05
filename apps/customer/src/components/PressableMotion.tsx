import { useEffect, useState, type ReactNode } from 'react';
import { Animated, Easing, Platform, Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import { useMotionPreference } from './RouteMotion';
import { motion } from '@/theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
type Props = Omit<PressableProps, 'style' | 'children'> & { style?: StyleProp<ViewStyle>; children: ReactNode };

export function PressableMotion({ style, children, disabled = false, onPressIn, onPressOut, ...props }: Props) {
  const reduced = useMotionPreference();
  const [progress] = useState(() => new Animated.Value(0));
  useEffect(() => { if (disabled || reduced) progress.setValue(0); return () => progress.stopAnimation(); }, [disabled, reduced, progress]);
  const move = (pressed: boolean) => {
    progress.stopAnimation();
    if (reduced) { progress.setValue(0); return; }
    Animated.timing(progress, { toValue: pressed ? 1 : 0, duration: pressed ? motion.press : motion.release, easing: Easing.out(Easing.cubic), useNativeDriver: Platform.OS !== 'web' }).start();
  };
  return <AnimatedPressable {...props} disabled={!!disabled}
    aria-busy={props['aria-busy'] ?? !!props.accessibilityState?.busy}
    accessibilityState={{ ...props.accessibilityState, disabled: !!disabled }}
    onPressIn={event => { move(true); onPressIn?.(event); }}
    onPressOut={event => { move(false); onPressOut?.(event); }}
    style={[style, { opacity: disabled && !props.accessibilityState?.busy ? 0.45 : progress.interpolate({ inputRange: [0, 1], outputRange: [1, 0.84] }), transform: [{ scale: progress.interpolate({ inputRange: [0, 1], outputRange: [1, 0.975] }) }] }]}>
    {children}
  </AnimatedPressable>;
}
