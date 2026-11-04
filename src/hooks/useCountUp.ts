import { useEffect, useRef, useState } from 'react';
import { Animated } from 'react-native';
import { useReducedMotion } from './useReducedMotion';

export function useCountUp(value: number, duration = 900) {
  const reducedMotion = useReducedMotion();
  const [display, setDisplay] = useState(value);
  const anim = useRef(new Animated.Value(display)).current;
  const prevValue = useRef(display);

  useEffect(() => {
    if (reducedMotion) {
      anim.stopAnimation();
      anim.setValue(value);
      prevValue.current = value;
      setDisplay(value);
      return;
    }
    anim.setValue(prevValue.current);
    const listenerId = anim.addListener(({ value: v }) => setDisplay(v));
    Animated.timing(anim, {
      toValue: value,
      duration,
      useNativeDriver: false,
    }).start(() => {
      prevValue.current = value;
    });
    return () => anim.removeListener(listenerId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, reducedMotion]);

  return display;
}
