import { useSyncExternalStore } from 'react';
import { AccessibilityInfo } from 'react-native';

let currentValue = true;
let nativeSubscription: { remove: () => void } | null = null;
const subscribers = new Set<() => void>();

function update(value: boolean) {
  if (currentValue === value) return;
  currentValue = value;
  subscribers.forEach((notify) => notify());
}

function subscribe(notify: () => void) {
  subscribers.add(notify);
  if (!nativeSubscription) {
    AccessibilityInfo.isReduceMotionEnabled().then(update);
    nativeSubscription = AccessibilityInfo.addEventListener('reduceMotionChanged', update);
  }
  return () => {
    subscribers.delete(notify);
    if (subscribers.size === 0) {
      nativeSubscription?.remove();
      nativeSubscription = null;
    }
  };
}

export function useReducedMotion() {
  return useSyncExternalStore(subscribe, () => currentValue, () => true);
}
