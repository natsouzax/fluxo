import React, { useRef } from 'react';
import { Animated, Pressable, PressableProps } from 'react-native';

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

  return (
    <Touchable
      accessibilityRole={accessibilityRole}
      onPressIn={(e) => {
        Animated.spring(scale, { toValue: scaleTo, useNativeDriver: true, speed: 40, bounciness: 6 }).start();
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 30, bounciness: 8 }).start();
        onPressOut?.(e);
      }}
      style={[style as any, { transform: [{ scale }] }]}
      {...rest}
    >
      {children}
    </Touchable>
  );
}
