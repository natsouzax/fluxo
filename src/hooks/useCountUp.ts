import { useEffect, useRef, useState } from 'react';
import { Animated } from 'react-native';

export function useCountUp(value: number, duration = 900) {
  const [display, setDisplay] = useState(value);
  const anim = useRef(new Animated.Value(display)).current;
  const prevValue = useRef(display);

  useEffect(() => {
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
  }, [value]);

  return display;
}
