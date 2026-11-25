// Per-weight imports keep the other 15 Poppins files out of the bundle.
import { Poppins_400Regular } from '@expo-google-fonts/poppins/400Regular';
import { Poppins_500Medium } from '@expo-google-fonts/poppins/500Medium';
import { Poppins_600SemiBold } from '@expo-google-fonts/poppins/600SemiBold';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { StoreProvider } from '@/lib/store';
import { C, F } from '@/lib/theme';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [loaded, error] = useFonts({ Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold });
  const ready = loaded || !!error;

  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => {});
  }, [ready]);

  // Keep the splash up until Poppins is in, so text never reflows from the system font.
  if (!ready) return null;

  return (
    <SafeAreaProvider>
      <StoreProvider>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: C.bg },
            headerTintColor: C.ink,
            headerTitleStyle: { fontFamily: F.semibold, fontSize: 17 },
            headerTitleAlign: 'center',
            headerShadowVisible: false,
            headerBackButtonDisplayMode: 'minimal',
            contentStyle: { backgroundColor: C.bg },
          }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="welcome" options={{ headerShown: false, gestureEnabled: false, animation: 'fade' }} />
          <Stack.Screen name="vendor/[id]" options={{ headerShown: false, title: 'Vendor' }} />
          <Stack.Screen name="book/[id]" options={{ title: 'Book vendor' }} />
          <Stack.Screen name="booking/[id]" options={{ title: 'Booking details' }} />
          <Stack.Screen name="partner" options={{ title: 'Become a vendor' }} />
          <Stack.Screen name="partner/apply" options={{ title: 'Vendor application' }} />
          <Stack.Screen name="auth/sign-up" options={{ headerShown: false }} />
          <Stack.Screen name="auth/log-in" options={{ headerShown: false }} />
          <Stack.Screen name="account" options={{ title: 'Your account' }} />
        </Stack>
      </StoreProvider>
    </SafeAreaProvider>
  );
}
