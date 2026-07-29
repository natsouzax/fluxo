import { useEffect, useRef, useState } from 'react';
import { Animated } from 'react-native';

export function useAnimatedPieValues<T extends { amount: number }>(items: T[], duration = 700): T[] {
  const [progress, setProgress] = useState(0);
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    anim.setValue(0);
    const listenerId = anim.addListener(({ value }) => setProgress(value));
    Animated.timing(anim, { toValue: 1, duration, useNativeDriver: false }).start();
    return () => anim.removeListener(listenerId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, duration]);

  return items.map((item) => ({ ...item, amount: item.amount * progress }));
}
