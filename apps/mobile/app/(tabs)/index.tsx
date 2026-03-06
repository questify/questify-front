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
    useCreateOrUpdateDailyMood,
    useCreateOrUpdatePositiveThings,
    useDailyMoodHistory,
    usePositiveThingsHistory,
} from '@/core/hooks/useApi';
import { QuestifyColors } from '@/mobile/constants/colors';
import { Card } from '@/mobile/components/ui/Card';
import { Quest } from "@/core/types/api";

type Mood = 'amazing' | 'good' | 'okay' | 'bad' | 'terrible' | null;

const moodToValue: Record<Mood, number> = {
  amazing: 5,
  good: 4,
  okay: 3,
  bad: 2,
  terrible: 1,
};

const valueToMood: Record<number, Mood> = {
  5: 'amazing',
  4: 'good',
  3: 'okay',
  2: 'bad',
  1: 'terrible',
};

export default function DashboardScreen() {
  const { user, refreshUser } = useAuth();
    const { data: quests, isLoading, refetch } = useQuests();
  const { data: dailyOverview, refetch: refetchDaily } = useDailyOverview();
  const validateQuest = useCreateValidation();
    const [validatingQuestId, setValidatingQuestId] = useState<string | null>(null);
    const createValidation = useCreateValidation();

    // Wellness hooks
    const today = new Date().toISOString().split('T')[0];
    const { data: existingMood } = useDailyMoodHistory(1);
    const createOrUpdateMood = useCreateOrUpdateDailyMood();
    const { data: existingPositiveThings } = usePositiveThingsHistory(1);
    const createOrUpdatePositiveThings = useCreateOrUpdatePositiveThings();

    const [selectedMood, setSelectedMood] = useState<Mood>(null);
    const [positiveThings, setPositiveThings] = useState(['', '', '']);
    const [isPositiveThingsEditable, setIsPositiveThingsEditable] = useState(false);

    const [refreshing, setRefreshing] = React.useState(false);

  // Load existing wellness data
  React.useEffect(() => {
    if (existingMood && existingMood[0]?.mood_value) {
      setSelectedMood(valueToMood[existingMood[0].mood_value] || null);
    }
  }, [existingMood]);

  React.useEffect(() => {
    if (existingPositiveThings && existingPositiveThings.length > 0) {
      const hasData = existingPositiveThings[0]?.thing_1 || existingPositiveThings[0]?.thing_2 || existingPositiveThings[0]?.thing_3;
      setPositiveThings([
        existingPositiveThings[0]?.thing_1 || '',
        existingPositiveThings[0]?.thing_2 || '',
        existingPositiveThings[0]?.thing_3 || '',
      ]);
      setIsPositiveThingsEditable(!hasData);
    } else {
      setIsPositiveThingsEditable(true);
    }
  }, [existingPositiveThings]);

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

    const handleMoodSelect = (mood: Mood) => {
        setSelectedMood(mood);
        if (mood) {
            createOrUpdateMood.mutate({
                date: today,
                mood_value: moodToValue[mood]
            }, {
                onSuccess: () => {
                    Alert.alert('✅ Info enregistrée', 'Ton humeur a été enregistrée');
                }
            });
        }
    };

    const handlePositiveThingChange = (index: number, value: string) => {
        const newPositiveThings = [...positiveThings];
        newPositiveThings[index] = value;
        setPositiveThings(newPositiveThings);
    };

    const handleSavePositiveThings = () => {
        createOrUpdatePositiveThings.mutate({
            date: today,
            thing_1: positiveThings[0] || null,
            thing_2: positiveThings[1] || null,
            thing_3: positiveThings[2] || null,
        }, {
            onSuccess: () => {
                Alert.alert('✅ Info enregistrée', 'Tes 3 choses positives ont été enregistrées');
                setIsPositiveThingsEditable(false);
            }
        });
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

        {/* Mood Card */}
        <Card style={styles.wellnessCard}>
          <Text style={styles.wellnessTitle}>Comment te sens-tu aujourd'hui ? 😊</Text>
          <View style={styles.moodContainer}>
            <TouchableOpacity
              style={[styles.moodButton, selectedMood === 'amazing' && styles.moodButtonSelected]}
              onPress={() => handleMoodSelect('amazing')}
              activeOpacity={0.7}>
              <Text style={styles.moodEmoji}>😍</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.moodButton, selectedMood === 'good' && styles.moodButtonSelected]}
              onPress={() => handleMoodSelect('good')}
              activeOpacity={0.7}>
              <Text style={styles.moodEmoji}>😊</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.moodButton, selectedMood === 'okay' && styles.moodButtonSelected]}
              onPress={() => handleMoodSelect('okay')}
              activeOpacity={0.7}>
              <Text style={styles.moodEmoji}>😐</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.moodButton, selectedMood === 'bad' && styles.moodButtonSelected]}
              onPress={() => handleMoodSelect('bad')}
              activeOpacity={0.7}>
              <Text style={styles.moodEmoji}>😔</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.moodButton, selectedMood === 'terrible' && styles.moodButtonSelected]}
              onPress={() => handleMoodSelect('terrible')}
              activeOpacity={0.7}>
              <Text style={styles.moodEmoji}>😢</Text>
            </TouchableOpacity>
          </View>
        </Card>

        {/* Positive Things Card */}
        <Card style={styles.wellnessCard}>
          <View style={styles.wellnessHeader}>
            <Text style={styles.wellnessTitle}>3 choses positives du jour ✨</Text>
            {!isPositiveThingsEditable && (
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => setIsPositiveThingsEditable(true)}
                activeOpacity={0.7}>
                <Text style={styles.editButtonText}>✏️ Modifier</Text>
              </TouchableOpacity>
            )}
          </View>
          <TextInput
            style={[styles.positiveThingInput, !isPositiveThingsEditable && styles.positiveThingInputDisabled]}
            value={positiveThings[0]}
            onChangeText={(text) => handlePositiveThingChange(0, text)}
            placeholder="1. Quelque chose de positif..."
            placeholderTextColor={QuestifyColors.textLight}
            editable={isPositiveThingsEditable}
          />
          <TextInput
            style={[styles.positiveThingInput, !isPositiveThingsEditable && styles.positiveThingInputDisabled]}
            value={positiveThings[1]}
            onChangeText={(text) => handlePositiveThingChange(1, text)}
            placeholder="2. Quelque chose de positif..."
            placeholderTextColor={QuestifyColors.textLight}
            editable={isPositiveThingsEditable}
          />
          <TextInput
            style={[styles.positiveThingInput, !isPositiveThingsEditable && styles.positiveThingInputDisabled]}
            value={positiveThings[2]}
            onChangeText={(text) => handlePositiveThingChange(2, text)}
            placeholder="3. Quelque chose de positif..."
            placeholderTextColor={QuestifyColors.textLight}
            editable={isPositiveThingsEditable}
          />
          {isPositiveThingsEditable && (
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSavePositiveThings}
              activeOpacity={0.7}>
              <Text style={styles.saveButtonText}>💾 Sauvegarder</Text>
            </TouchableOpacity>
          )}
        </Card>

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
                    <View style={styles.questMetadata}>
                      <Text style={styles.questPreviewCategory}>{quest.category_name}</Text>
                      {quest.validations_today && quest.validations_today.length > 0 && (
                        <View style={styles.validationBadge}>
                          <Text style={styles.validationBadgeText}>
                            ✓ {quest.validations_today.length}x
                          </Text>
                        </View>
                      )}
                    </View>
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
  wellnessCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
  },
  wellnessHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  wellnessTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: QuestifyColors.textPrimary,
    marginBottom: 16,
  },
  moodContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 8,
  },
  moodButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: QuestifyColors.backgroundLight,
    borderWidth: 2,
    borderColor: QuestifyColors.border,
    alignItems: 'center',
  },
  moodButtonSelected: {
    backgroundColor: QuestifyColors.primaryLight,
    borderColor: QuestifyColors.primary,
  },
  moodEmoji: {
    fontSize: 32,
  },
  editButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: QuestifyColors.backgroundDark,
  },
  editButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: QuestifyColors.textPrimary,
  },
  positiveThingInput: {
    backgroundColor: QuestifyColors.backgroundLight,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    color: QuestifyColors.textPrimary,
    borderWidth: 2,
    borderColor: QuestifyColors.border,
    marginBottom: 8,
  },
  positiveThingInputDisabled: {
    backgroundColor: QuestifyColors.backgroundDark,
  },
  saveButton: {
    backgroundColor: QuestifyColors.primary,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: QuestifyColors.textPrimary,
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
  questMetadata: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  questPreviewCategory: {
    fontSize: 12,
    color: QuestifyColors.textSecondary,
  },
  validationBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    backgroundColor: QuestifyColors.green,
  },
  validationBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: QuestifyColors.textPrimary,
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
