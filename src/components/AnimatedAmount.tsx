import React from 'react';
import { Text, TextProps } from 'react-native';
import { useCountUp } from '../hooks/useCountUp';

interface Props extends TextProps {
  value: number;
  format: (n: number) => string;
  duration?: number;
}

export function AnimatedAmount({ value, format, duration = 900, style, ...rest }: Props) {
  const animated = useCountUp(value, duration);
  return (
    <Text style={[{ fontVariant: ['tabular-nums'] }, style]} {...rest}>
      {format(animated)}
    </Text>
  );
}
