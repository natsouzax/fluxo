import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RootNavigator } from './src/navigation/RootNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      {/* The theme is light (colors.bg #F5F6F8), so the status bar needs dark
          icons to stay legible. */}
      <StatusBar style="dark" />
      <RootNavigator />
    </SafeAreaProvider>
  );
}
