import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/core/contexts/AuthContext';
import {
  useQuests,
  useDailyOverview, 
    useCreateValidation,
} from '@/core/hooks/useApi';
import { QuestifyColors } from '@/mobile/constants/colors';
import { Card } from '@/mobile/components/ui/Card';
import { Quest } from "@/core/types/api";

export default function DashboardScreen() {
  const { user, refreshUser } = useAuth();
    const { data: quests, isLoading, refetch } = useQuests();
  const { data: dailyOverview, refetch: refetchDaily } = useDailyOverview();
  const validateQuest = useCreateValidation();
    const [validatingQuestId, setValidatingQuestId] = useState<string | null>(null);
    const createValidation = useCreateValidation();


    const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      refetch(),
      refetchDaily(),
    ]);
    setRefreshing(false);
  }, [refetch, refetchDaily]);

    const handleValidate = (quest: Quest) => {
        const points = quest.points;
        const emoji = '✅' ;

        Alert.alert(
            `${emoji} Valider la quête`,
            `Valider "${quest.title}" (+ ${points} pts) ?`,
            [
                { text: 'Annuler', style: 'cancel' },
                {
                    text: 'Valider',
                    style: 'default',
                    onPress: () => performValidation(quest.id, quest.points),
                },
            ]
        );
    };

    const performValidation = async (questId: string, points: number) => {
        setValidatingQuestId(questId);

        if (!questId || !user?.id) {
            console.error('Missing quest ID or user ID');
            return;
        }

        createValidation.mutate(
            {
                quest_id: questId,
                user_id: user.id,
                date: new Date().toISOString().split('T')[0],
                type: 'completion',
                points_earned: points || 0, },
            {
                onSuccess: (data) => {
                    console.log(data);
                    if (data?.user_id) {
                        refreshUser();
                    }
                    refetch();
                    Alert.alert(
                        '🎉 Bravo !',
                        `Quête validée avec succès !`
                    );
                },
                onError: (error: any) => {
                    Alert.alert('Erreur', error.message || 'Une erreur est survenue');
                },
                onSettled: () => {
                    setValidatingQuestId(null);
                },
            }
        );
    };

  const activeQuests = quests?.filter(q => q.is_active) || [];
  const validatedToday = dailyOverview?.validated_count || 0;

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={QuestifyColors.primary} />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={QuestifyColors.primary}
          />
        }>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.greeting}>Bonjour {user?.name || 'Utilisateur'} 👋</Text>
          <Text style={styles.subtitle}>Prêt à conquérir la journée ?</Text>
        </View>

        {/* Points Card */}
        <Card style={styles.pointsCard}>
          <View style={styles.pointsHeader}>
            <Text style={styles.pointsEmoji}>⭐</Text>
            <View>
              <Text style={styles.pointsValue}>{user?.total_points?.toLocaleString() || '0'}</Text>
              <Text style={styles.pointsLabel}>Points totaux</Text>
            </View>
          </View>

          <View style={styles.streakContainer}>
            <View style={styles.streakItem}>
              <Text style={styles.streakEmoji}>🔥</Text>
              <Text style={styles.streakValue}>{user?.streak_current || 0}</Text>
              <Text style={styles.streakLabel}>Série actuelle</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.streakItem}>
              <Text style={styles.streakEmoji}>🏆</Text>
              <Text style={styles.streakValue}>{user?.streak_record || 0}</Text>
              <Text style={styles.streakLabel}>Record</Text>
            </View>
          </View>
        </Card>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: QuestifyColors.green }]}>
            <Text style={styles.statEmoji}>✅</Text>
            <Text style={styles.statValue}>{validatedToday}</Text>
            <Text style={styles.statLabel}>Aujourd'hui</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: QuestifyColors.primary }]}>
            <Text style={styles.statEmoji}>🎯</Text>
            <Text style={styles.statValue}>{activeQuests.length}</Text>
            <Text style={styles.statLabel}>Quêtes actives</Text>
          </View>
        </View>

        {/* Today's Quests Preview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quêtes du jour</Text>
          {dailyOverview?.quests && dailyOverview.quests.length > 0 ? (
            dailyOverview.quests.map((quest) => {
              const isValidated = quest.validations_today && quest.validations_today.length > 0;
              return (
                <Card key={quest.id} style={styles.questPreviewCard}>
                  <View style={styles.questPreviewHeader}>
                    <Text style={styles.questPreviewTitle} numberOfLines={1}>{quest.title}</Text>
                    <Text style={styles.questPreviewPoints}>+{quest.points} pts</Text>
                  </View>
                  {quest.description && (
                    <Text style={styles.questPreviewDescription} numberOfLines={2}>
                      {quest.description}
                    </Text>
                  )}
                  <View style={styles.questPreviewFooter}>
                    <Text style={styles.questPreviewCategory}>{quest.category_name}</Text>
                      <TouchableOpacity
                        style={styles.validateButton}
                        onPress={() => handleValidate(quest)}
                        disabled={validateQuest.isPending}
                        activeOpacity={0.7}>
                        <Text style={styles.validateButtonText}>
                          {validateQuest.isPending ? '...' : '✓ Valider'}
                        </Text>
                      </TouchableOpacity>
                  </View>
                </Card>
              );
            })
          ) : (
            <Text style={styles.emptyText}>Aucune quête pour aujourd'hui</Text>
          )}
        </View>

        {/* Motivation */}
        <View style={styles.motivationCard}>
          <Text style={styles.motivationText}>
            💪 Continue comme ça ! Tu as validé {validatedToday} quête{validatedToday > 1 ? 's' : ''} aujourd'hui.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: QuestifyColors.backgroundLight,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: QuestifyColors.backgroundLight,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: QuestifyColors.textSecondary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  header: {
    padding: 20,
    paddingTop: 10,
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: QuestifyColors.textPrimary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: QuestifyColors.textSecondary,
  },
  pointsCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
  },
  pointsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  pointsEmoji: {
    fontSize: 40,
    marginRight: 16,
  },
  pointsValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: QuestifyColors.textPrimary,
  },
  pointsLabel: {
    fontSize: 14,
    color: QuestifyColors.textSecondary,
  },
  streakContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: QuestifyColors.border,
  },
  streakItem: {
    alignItems: 'center',
    flex: 1,
  },
  streakEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  streakValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: QuestifyColors.textPrimary,
  },
  streakLabel: {
    fontSize: 12,
    color: QuestifyColors.textSecondary,
    marginTop: 2,
  },
  divider: {
    width: 1,
    backgroundColor: QuestifyColors.border,
    marginHorizontal: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 12,
  },
  statCard: {
    width: '48%',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    minHeight: 100,
    justifyContent: 'center',
  },
  statEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: QuestifyColors.textPrimary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: QuestifyColors.textPrimary,
    textAlign: 'center',
    fontWeight: '600',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: QuestifyColors.textPrimary,
    marginBottom: 12,
  },
  questPreviewCard: {
    marginBottom: 12,
  },
  questPreviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  questPreviewTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: QuestifyColors.textPrimary,
    flex: 1,
    marginRight: 8,
  },
  questPreviewPoints: {
    fontSize: 14,
    fontWeight: 'bold',
    color: QuestifyColors.primary,
  },
  questPreviewDescription: {
    fontSize: 14,
    color: QuestifyColors.textSecondary,
    marginBottom: 8,
    lineHeight: 20,
  },
  questPreviewFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  questPreviewCategory: {
    fontSize: 12,
    color: QuestifyColors.textSecondary,
  },
  validatedBadgeContainer: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: '#E8F5E9',
  },
  questValidatedBadge: {
    fontSize: 12,
    fontWeight: '600',
    color: QuestifyColors.success,
  },
  validateButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: QuestifyColors.primary,
  },
  validateButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: QuestifyColors.textPrimary,
  },
  emptyText: {
    fontSize: 14,
    color: QuestifyColors.textSecondary,
    textAlign: 'center',
    paddingVertical: 20,
  },
  motivationCard: {
    backgroundColor: QuestifyColors.primaryLight,
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  motivationText: {
    fontSize: 14,
    color: QuestifyColors.textPrimary,
    textAlign: 'center',
    lineHeight: 20,
  },
});
