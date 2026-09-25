import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { LocationProvider } from '../src/location/LocationProvider.tsx';
import { useTheme } from '../src/ui/theme.ts';

export default function RootLayout() {
  const t = useTheme();
  return (
    <LocationProvider>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: t.bg } }} />
    </LocationProvider>
  );
}
