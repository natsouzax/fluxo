import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, PressableProps } from 'react-native';
import { useReducedMotion } from '../hooks/useReducedMotion';

interface Props extends PressableProps {
  scaleTo?: number;
  children: React.ReactNode;
}

// A single animated Pressable, so `style` is applied to exactly one element.
// Wrapping a styled Animated.View inside a styled Pressable doubles every
// padding and margin in the passed style.
const Touchable = Animated.createAnimatedComponent(Pressable);

export function AnimatedPressable({
  scaleTo = 0.95,
  style,
  children,
  onPressIn,
  onPressOut,
  accessibilityRole = 'button',
  ...rest
}: Props) {
  const scale = useRef(new Animated.Value(1)).current;
  const reducedMotion = useReducedMotion();
  useEffect(() => {
    if (reducedMotion) scale.setValue(1);
  }, [reducedMotion, scale]);

  return (
    <Touchable
      accessibilityRole={accessibilityRole}
      onPressIn={(e) => {
        if (!reducedMotion) Animated.timing(scale, { toValue: scaleTo, duration: 120, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        if (!reducedMotion) Animated.timing(scale, { toValue: 1, duration: 120, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();
        onPressOut?.(e);
      }}
      style={[style as any, { transform: [{ scale }] }]}
      {...rest}
    >
      {children}
    </Touchable>
  );
}
