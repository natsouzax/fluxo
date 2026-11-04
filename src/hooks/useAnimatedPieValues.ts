import { useEffect, useRef, useState } from 'react';
import { Animated } from 'react-native';
import { useReducedMotion } from './useReducedMotion';

export function useAnimatedPieValues<T extends { amount: number }>(items: T[], duration = 700): T[] {
  const reducedMotion = useReducedMotion();
  const [progress, setProgress] = useState(reducedMotion ? 1 : 0);
  const anim = useRef(new Animated.Value(reducedMotion ? 1 : 0)).current;

  useEffect(() => {
    if (reducedMotion) {
      anim.stopAnimation();
      anim.setValue(1);
      setProgress(1);
      return;
    }
    anim.setValue(0);
    const listenerId = anim.addListener(({ value }) => setProgress(value));
    Animated.timing(anim, { toValue: 1, duration, useNativeDriver: false }).start();
    return () => anim.removeListener(listenerId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, duration, reducedMotion]);

  return items.map((item) => ({ ...item, amount: item.amount * progress }));
}
