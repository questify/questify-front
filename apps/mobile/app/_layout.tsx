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

setTokenStorage({
    getToken: async () => SecureStore.getItemAsync("questify_token"),
    setToken: async (token: string) =>
        SecureStore.setItemAsync("questify_token", token),
    clearToken: async () => SecureStore.deleteItemAsync("questify_token"),
});

setApiConfig({ baseUrl: "http://192.168.1.32:3000" });

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

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
