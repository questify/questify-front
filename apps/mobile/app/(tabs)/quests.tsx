import React, { useState } from 'react';
import {View, Text,
  StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/core/contexts/AuthContext';
import {useQuests, useCategories, useCreateValidation, useUpdateQuest,
} from '@/core/hooks/useApi';
import { Quest } from '@/core/types/api';
import { QuestifyColors } from '@/mobile/constants/colors';
import { Card } from '@/mobile/components/ui/Card';
import { CreateQuestModal } from '@/mobile/components/quests/CreateQuestModal';
import { ManageCategoriesModal } from '@/mobile/components/quests/ManageCategoriesModal';

export default function QuestsScreen() {
    const { user, refreshUser } = useAuth();
  const { data: quests, isLoading, refetch } = useQuests();
  const { data: categories } = useCategories();
  const createValidation = useCreateValidation();
  const updateQuest = useUpdateQuest();

  const [tab, setTab] = useState<'active' | 'archived'>('active');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedFrequency, setSelectedFrequency] = useState<string>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [validatingQuestId, setValidatingQuestId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isManageCategoriesOpen, setIsManageCategoriesOpen] = useState(false);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const activeQuests = quests?.filter(q => q.is_active) || [];
  const archivedQuests = quests?.filter(q => !q.is_active) || [];

  // Apply filters
  const filteredQuests = (tab === 'active' ? activeQuests : archivedQuests).filter(quest => {
    if (selectedCategory !== 'all' && quest.category_id !== selectedCategory) return false;
    if (selectedFrequency !== 'all' && quest.frequency !== selectedFrequency) return false;
    return true;
  });

  const displayedQuests = filteredQuests;

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

  const handleToggleArchive = (quest: Quest) => {
    const action = quest.is_active ? 'archiver' : 'réactiver';
    const emoji = quest.is_active ? '📦' : '🎯';

    Alert.alert(
      `${emoji} ${action.charAt(0).toUpperCase() + action.slice(1)} la quête`,
      `Voulez-vous ${action} "${quest.title}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: action.charAt(0).toUpperCase() + action.slice(1),
          style: 'default',
          onPress: () => performToggleArchive(quest.id, quest.is_active),
        },
      ]
    );
  };

  const performToggleArchive = (questId: string, currentStatus: boolean) => {
    updateQuest.mutate(
      {
        id: questId,
        data: { is_active: !currentStatus },
      },
      {
        onSuccess: () => {
          refetch();
          Alert.alert(
            'Succès',
            currentStatus ? 'Quête archivée' : 'Quête réactivée'
          );
        },
        onError: (error: any) => {
          Alert.alert('Erreur', error.message || 'Erreur lors de la mise à jour');
        },
      }
    );
  };

  const renderQuestCard = ({ item: quest }: { item: Quest }) => {
    const isValidated = quest.validations_today && quest.validations_today.length > 0;
    const isValidating = validatingQuestId === quest.id;

    return (
      <Card style={[styles.questCard, isValidated && styles.validated]}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title} numberOfLines={2}>{quest.title}</Text>
          {isValidated && <Text style={styles.badge}>✓</Text>}
        </View>

        {/* Description */}
        {quest.description && (
          <Text style={styles.description} numberOfLines={3}>
            {quest.description}
          </Text>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.meta}>
            <Text style={styles.category}>{quest.category_name}</Text>
            <Text style={styles.frequency}>{quest.frequency}</Text>
            {quest.validations_today && quest.validations_today.length > 0 && (
              <View style={styles.validationBadge}>
                <Text style={styles.validationBadgeText}>
                  ✓ {quest.validations_today.length}x
                </Text>
              </View>
            )}
          </View>
          <Text style={styles.points}>+{quest.points} pts</Text>
        </View>

        {/* Actions */}
        {tab === 'active' && (
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.button, styles.editButton]}
              onPress={() => Alert.alert('Modifier', 'Fonctionnalité de modification en cours de développement')}
              activeOpacity={0.7}>
              <Text style={styles.buttonText}>✏️ Modifier</Text>
            </TouchableOpacity>
            {!isValidated && (
              <TouchableOpacity
                style={[styles.button, styles.completeButton]}
                onPress={() => handleValidate(quest)}
                disabled={isValidating}
                activeOpacity={0.7}>
                {isValidating ? (
                  <ActivityIndicator size="small" color={QuestifyColors.textPrimary} />
                ) : (
                  <Text style={styles.buttonText}>✓ Compléter</Text>
                )}
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.button, styles.archiveButton]}
              onPress={() => handleToggleArchive(quest)}
              disabled={updateQuest.isPending}
              activeOpacity={0.7}>
              {updateQuest.isPending ? (
                <ActivityIndicator size="small" color={QuestifyColors.textPrimary} />
              ) : (
                <Text style={styles.buttonText}>📦 Archiver</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {tab === 'archived' && (
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.button, styles.unarchiveButton]}
              onPress={() => handleToggleArchive(quest)}
              disabled={updateQuest.isPending}
              activeOpacity={0.7}>
              {updateQuest.isPending ? (
                <ActivityIndicator size="small" color={QuestifyColors.textPrimary} />
              ) : (
                <Text style={styles.buttonText}>🎯 Réactiver</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Validated today indicator */}
        {isValidated && (
          <View style={styles.validatedBanner}>
            <Text style={styles.validatedText}>✓ Validée aujourd'hui</Text>
          </View>
        )}
      </Card>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={QuestifyColors.primary} />
        <Text style={styles.loadingText}>Chargement des quêtes...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.headerContainer}>
        <View>
          <Text style={styles.screenTitle}>Quêtes 🎯</Text>
          <Text style={styles.subtitle}>
            {activeQuests.length} active{activeQuests.length > 1 ? 's' : ''}
          </Text>
        </View>
         <View style={styles.headerButtons}>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => setIsManageCategoriesOpen(true)}
            activeOpacity={0.7}>
            <Text style={styles.secondaryButtonText}>⚙️</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.createButton}
            onPress={() => setIsCreateModalOpen(true)}
            activeOpacity={0.7}>
            <Text style={styles.createButtonText}>+</Text>
          </TouchableOpacity>
        </View> 
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, tab === 'active' && styles.tabActive]}
          onPress={() => setTab('active')}
          activeOpacity={0.7}>
          <Text style={[styles.tabText, tab === 'active' && styles.tabTextActive]}>
            Actives ({activeQuests.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === 'archived' && styles.tabActive]}
          onPress={() => setTab('archived')}
          activeOpacity={0.7}>
          <Text style={[styles.tabText, tab === 'archived' && styles.tabTextActive]}>
            Archivées ({archivedQuests.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Filters */}
      {tab === 'active' && (
        <View style={styles.filtersContainer}>
          <View style={styles.filterRow}>
            <Text style={styles.filterLabel}>Catégorie:</Text>
            <View style={styles.filterChipsContainer}>
              <TouchableOpacity
                style={[styles.filterChip, selectedCategory === 'all' && styles.filterChipSelected]}
                onPress={() => setSelectedCategory('all')}
                activeOpacity={0.7}>
                <Text style={[styles.filterChipText, selectedCategory === 'all' && styles.filterChipTextSelected]}>
                  Toutes
                </Text>
              </TouchableOpacity>
              {categories?.map(cat => (
                <TouchableOpacity
                  key={cat.id}
                  style={[styles.filterChip, selectedCategory === cat.id && styles.filterChipSelected]}
                  onPress={() => setSelectedCategory(cat.id)}
                  activeOpacity={0.7}>
                  <Text style={[styles.filterChipText, selectedCategory === cat.id && styles.filterChipTextSelected]}>
                    {cat.svg_icon} {cat.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <View style={styles.filterRow}>
            <Text style={styles.filterLabel}>Fréquence:</Text>
            <View style={styles.filterChipsContainer}>
              <TouchableOpacity
                style={[styles.filterChip, selectedFrequency === 'all' && styles.filterChipSelected]}
                onPress={() => setSelectedFrequency('all')}
                activeOpacity={0.7}>
                <Text style={[styles.filterChipText, selectedFrequency === 'all' && styles.filterChipTextSelected]}>
                  Toutes
                </Text>
              </TouchableOpacity>
              {['Journalier', 'Hebdomadaire', 'Mensuel'].map(freq => (
                <TouchableOpacity
                  key={freq}
                  style={[styles.filterChip, selectedFrequency === freq && styles.filterChipSelected]}
                  onPress={() => setSelectedFrequency(freq)}
                  activeOpacity={0.7}>
                  <Text style={[styles.filterChipText, selectedFrequency === freq && styles.filterChipTextSelected]}>
                    {freq}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      )}

      {/* Quest List */}
      <FlatList
        data={displayedQuests}
        renderItem={renderQuestCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={QuestifyColors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>{tab === 'active' ? '🎯' : '📦'}</Text>
            <Text style={styles.emptyText}>
              {tab === 'active'
                ? 'Aucune quête active pour le moment'
                : 'Aucune quête archivée'}
            </Text>
            <Text style={styles.emptyHint}>
              {tab === 'active'
                ? 'Créez votre première quête depuis la version web'
                : 'Les quêtes archivées apparaîtront ici'}
            </Text>
          </View>
        }
      />

      {/* Create Quest Modal */}
      {isCreateModalOpen && (
        <CreateQuestModal
          visible={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={refetch}
        />
      )} 

      {/* Manage Categories Modal */}
      {isManageCategoriesOpen && (
        <ManageCategoriesModal
          visible={isManageCategoriesOpen}
          onClose={() => setIsManageCategoriesOpen(false)}
        />
      )}
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
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 10,
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: QuestifyColors.textPrimary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: QuestifyColors.textSecondary,
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 12,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: QuestifyColors.background,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: QuestifyColors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: QuestifyColors.textSecondary,
  },
  tabTextActive: {
    color: QuestifyColors.textPrimary,
  },
  filtersContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 12,
  },
  filterRow: {
    gap: 8,
  },
  filterLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: QuestifyColors.textPrimary,
    marginBottom: 4,
  },
  filterChipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: QuestifyColors.backgroundLight,
    borderWidth: 1,
    borderColor: QuestifyColors.border,
  },
  filterChipSelected: {
    backgroundColor: QuestifyColors.primary,
    borderColor: QuestifyColors.primary,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '500',
    color: QuestifyColors.textSecondary,
  },
  filterChipTextSelected: {
    color: QuestifyColors.textPrimary,
    fontWeight: '600',
  },
  validationBadge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 10,
    backgroundColor: QuestifyColors.green,
  },
  validationBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: QuestifyColors.textPrimary,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  questCard: {
    marginBottom: 12,
  },
  validated: {
    borderLeftWidth: 4,
    borderLeftColor: QuestifyColors.success,
    opacity: 0.85,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: QuestifyColors.textPrimary,
    flex: 1,
    marginRight: 8,
  },
  badge: {
    fontSize: 20,
    color: QuestifyColors.success,
  },
  description: {
    fontSize: 14,
    color: QuestifyColors.textSecondary,
    marginBottom: 12,
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  meta: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
  },
  category: {
    fontSize: 12,
    color: QuestifyColors.textSecondary,
  },
  frequency: {
    fontSize: 12,
    color: QuestifyColors.textLight,
  },
  points: {
    fontSize: 16,
    fontWeight: 'bold',
    color: QuestifyColors.primary,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  button: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    minHeight: 40,
    justifyContent: 'center',
  },
  editButton: {
    backgroundColor: QuestifyColors.backgroundDark,
  },
  completeButton: {
    backgroundColor: QuestifyColors.green,
  },
  archiveButton: {
    backgroundColor: QuestifyColors.backgroundDark,
  },
  unarchiveButton: {
    backgroundColor: QuestifyColors.primary,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    color: QuestifyColors.textPrimary,
  },
  validatedBanner: {
    marginTop: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: QuestifyColors.successLight,
    borderRadius: 6,
    alignItems: 'center',
  },
  validatedText: {
    fontSize: 12,
    fontWeight: '600',
    color: QuestifyColors.success,
  },
  emptyContainer: {
    paddingTop: 60,
    alignItems: 'center',
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: QuestifyColors.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyHint: {
    fontSize: 14,
    color: QuestifyColors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  createButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: QuestifyColors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  createButtonText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: QuestifyColors.textPrimary,
    lineHeight: 32,
  },
  secondaryButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: QuestifyColors.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: QuestifyColors.primary,
  },
  secondaryButtonText: {
    fontSize: 20,
  },
});
