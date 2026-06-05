import 'react-native-gesture-handler';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/core/services/queryClient';
import { AuthProvider } from '@/core/contexts/AuthContext';
import { AuthGuard } from '@/mobile/components/AuthGuard';
import * as SecureStore from "expo-secure-store";
import { setTokenStorage } from '@/core/services/tokenStorage';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { setApiConfig } from '@questify/core/src/types/api';
import { useFonts } from 'expo-font';
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from '@expo-google-fonts/plus-jakarta-sans';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';

setTokenStorage({
    getToken: async () => SecureStore.getItemAsync("questify_token"),
    setToken: async (token: string) =>
        SecureStore.setItemAsync("questify_token", token),
    clearToken: async () => SecureStore.deleteItemAsync("questify_token"),
});

setApiConfig({ baseUrl: process.env.EXPO_PUBLIC_API_URL ?? "http://192.168.1.197:3000" });

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  // Load Questify brand fonts. See questify-design-system/HANDOFF.md.
  // The keys here MUST match the family names declared in constants/fonts.ts.
  const [fontsLoaded] = useFonts({
    'Plus Jakarta Sans':        PlusJakartaSans_700Bold,
    'PlusJakartaSans-Bold':     PlusJakartaSans_800ExtraBold,
    'PlusJakartaSans-Medium':   PlusJakartaSans_500Medium,
    'PlusJakartaSans-SemiBold': PlusJakartaSans_600SemiBold,
    'PlusJakartaSans-Regular':  PlusJakartaSans_400Regular,
    'Inter':                    Inter_400Regular,
    'Inter-Regular':            Inter_400Regular,
    'Inter-Medium':             Inter_500Medium,
    'Inter-SemiBold':           Inter_600SemiBold,
    'Inter-Bold':               Inter_700Bold,
  });

  // Hold the app on the splash until fonts are ready, otherwise type will
  // flash from the system fallback into Plus Jakarta Sans / Inter.
  if (!fontsLoaded) {
    return null;
  }

  return (
      <AuthProvider>
          <AuthGuard>
              <QueryClientProvider client={queryClient}>
              <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
                <Stack>
                  <Stack.Screen name="login" options={{ headerShown: false }} />
                  <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                  <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
                </Stack>
                <StatusBar style="auto" />
              </ThemeProvider>
              </QueryClientProvider>
          </AuthGuard>
      </AuthProvider>
  );
}
