import { useEffect } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { useAuth } from '@/core/contexts/AuthContext';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { QuestifyColors } from '@/mobile/constants/colors';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isAuthReady, isUserReady } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  const isLoading = !isAuthReady || !isUserReady;

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(tabs)';

    if (!isAuthenticated && inAuthGroup) {
      router.replace('/login');
    } else if (isAuthenticated && !inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, isLoading, segments]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={QuestifyColors.primary} />
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: QuestifyColors.backgroundLight,
  },
});
