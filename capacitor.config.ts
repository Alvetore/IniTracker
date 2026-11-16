import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.alvetore.initracker',
  appName: 'IniTracker',
  webDir: 'dist',
  android: {
    SystemBars: {
      // 'DARK' = white status bar icons (the app header is dark slate in
      // every theme except parchment; App.tsx flips this at runtime).
      // The viewport hint avoids a layout jump while the meta tag is detected.
      style: 'DARK',
      initialViewportFitValueHint: 'cover',
    },
  },
};

export default config;
