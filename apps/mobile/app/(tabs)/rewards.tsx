import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/core/contexts/AuthContext';
import { useRewards, usePurchaseReward } from '@/core/hooks/useApi';
import { Reward } from '@/core/types/api';
import { QuestifyColors, RewardTierColors } from '@/mobile/constants/colors';
import { Card } from '@/mobile/components/ui/Card';
import { CreateRewardModal } from '@/mobile/components/rewards/CreateRewardModal';

type RewardTier = {
  title: string;
  color: string;
  data: Reward[];
};

export default function RewardsScreen() {
  const { user, updateUser } = useAuth();
  const { data: rewards, isLoading, refetch } = useRewards();
  const purchaseReward = usePurchaseReward();

  const [tab, setTab] = useState<'badges' | 'gifts'>('gifts');
  const [refreshing, setRefreshing] = useState(false);
  const [purchasingRewardId, setPurchasingRewardId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const userPoints = Number(user?.total_points) || 0;

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  // Group rewards by tier
  const groupedRewards = useMemo(() => {
    if (!rewards) return [];

    const filteredRewards = rewards.filter(r =>
      tab === 'badges' ? r.is_badge : !r.is_badge
    );

    if (tab === 'badges') {
      return [{
        title: '🏅 Badges',
        color: QuestifyColors.primary,
        data: filteredRewards,
      }];
    }

    // Group by price tiers
    const small = filteredRewards.filter(r => r.cost >= 0 && r.cost <= 300);
    const medium = filteredRewards.filter(r => r.cost > 300 && r.cost <= 600);
    const large = filteredRewards.filter(r => r.cost > 600 && r.cost <= 1000);
    const xlarge = filteredRewards.filter(r => r.cost > 1000);

    const tiers: RewardTier[] = [];
    if (small.length > 0) {
      tiers.push({
        title: '💚 Petits plaisirs (0-300 pts)',
        color: RewardTierColors.small,
        data: small,
      });
    }
    if (medium.length > 0) {
      tiers.push({
        title: '💙 Moyens plaisirs (301-600 pts)',
        color: RewardTierColors.medium,
        data: medium,
      });
    }
    if (large.length > 0) {
      tiers.push({
        title: '💜 Grands plaisirs (601-1000 pts)',
        color: RewardTierColors.large,
        data: large,
      });
    }
    if (xlarge.length > 0) {
      tiers.push({
        title: '🧡 Gros plaisirs (1000+ pts)',
        color: RewardTierColors.xlarge,
        data: xlarge,
      });
    }

    return tiers;
  }, [rewards, tab]);

  const handlePurchase = (reward: Reward) => {
    const canAfford = userPoints >= reward.cost;

    if (!canAfford) {
      Alert.alert(
        'Pas assez de points',
        `Il te manque ${reward.cost - userPoints} points pour acheter ce cadeau.`,
        [{ text: 'OK' }]
      );
      return;
    }

    Alert.alert(
      '🎁 Acheter ce cadeau ?',
      `"${reward.title}"\n\nCoût : ${reward.cost} pts\nIl te restera : ${userPoints - reward.cost} pts`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: "M'offrir",
          style: 'default',
          onPress: () => performPurchase(reward),
        },
      ]
    );
  };

  const performPurchase = async (reward: Reward) => {
    setPurchasingRewardId(reward.id);

    purchaseReward.mutate(reward.id, {
      onSuccess: (data) => {
        if (data?.user) {
          updateUser(data.user);
        }
        refetch();
        Alert.alert(
          '🎉 Bravo !',
          `Tu t'es offert : ${reward.title}\n\nProfite bien de ton cadeau !`,
          [{ text: 'Super !' }]
        );
      },
      onError: (error: any) => {
        Alert.alert('Erreur', error.message || 'Une erreur est survenue');
      },
      onSettled: () => {
        setPurchasingRewardId(null);
      },
    });
  };

  const renderRewardCard = ({ item: reward }: { item: Reward }) => {
    const canAfford = userPoints >= reward.cost;
    const isPurchasing = purchasingRewardId === reward.id;

    return (
      <Card style={styles.rewardCard}>
        {/* Emoji Icon */}
        <View style={styles.emojiContainer}>
          <Text style={styles.emoji}>{reward.svg_icon || '🎁'}</Text>
        </View>

        {/* Title */}
        <Text style={styles.title} numberOfLines={2}>{reward.title}</Text>

        {/* Description */}
        {reward.description && (
          <Text style={styles.description} numberOfLines={3}>
            {reward.description}
          </Text>
        )}

        {/* Cost */}
        <Text style={styles.cost}>{reward.cost} pts</Text>

        {/* Purchase Button */}
        <TouchableOpacity
          style={[
            styles.buyButton,
            canAfford ? styles.buyButtonEnabled : styles.buyButtonDisabled,
          ]}
          onPress={() => handlePurchase(reward)}
          disabled={!canAfford || isPurchasing}
          activeOpacity={0.7}>
          {isPurchasing ? (
            <ActivityIndicator size="small" color={QuestifyColors.textPrimary} />
          ) : (
            <Text style={styles.buyButtonText}>
              {canAfford ? "M'offrir" : 'Pas assez de points'}
            </Text>
          )}
        </TouchableOpacity>
      </Card>
    );
  };

  const renderTierSection = ({ item: tier }: { item: RewardTier }) => (
    <View style={styles.tierSection}>
      <View style={[styles.tierHeader, { backgroundColor: tier.color }]}>
        <Text style={styles.tierTitle}>{tier.title}</Text>
        <Text style={styles.tierCount}>{tier.data.length}</Text>
      </View>
      {tier.data.map((reward) => (
        <View key={reward.id}>
          {renderRewardCard({ item: reward })}
        </View>
      ))}
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={QuestifyColors.primary} />
        <Text style={styles.loadingText}>Chargement des cadeaux...</Text>
      </View>
    );
  }

  /*const totalRewards = rewards?.filter(r =>
    tab === 'badges' ? r.is_badge : !r.is_badge
  ).length || 0;*/

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.headerContainer}>
        <Text style={styles.screenTitle}>Cadeau 🎁</Text>
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => setIsCreateModalOpen(true)}
          activeOpacity={0.7}>
          <Text style={styles.createButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      {/* Points Banner */}
      <Card style={styles.pointsBanner}>
        <Text style={styles.pointsEmoji}>⭐</Text>
        <Text style={styles.pointsValue}>{userPoints.toLocaleString()}</Text>
        <Text style={styles.pointsLabel}>Points disponibles</Text>
      </Card>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, tab === 'gifts' && styles.tabActive]}
          onPress={() => setTab('gifts')}
          activeOpacity={0.7}>
          <Text style={[styles.tabText, tab === 'gifts' && styles.tabTextActive]}>
            🎁 Cadeaux
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === 'badges' && styles.tabActive]}
          onPress={() => setTab('badges')}
          activeOpacity={0.7}>
          <Text style={[styles.tabText, tab === 'badges' && styles.tabTextActive]}>
            🏅 Badges
          </Text>
        </TouchableOpacity>
      </View>

      {/* Rewards List */}
      <FlatList
        data={groupedRewards}
        renderItem={renderTierSection}
        keyExtractor={(item, index) => `tier-${index}`}
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
            <Text style={styles.emptyEmoji}>{tab === 'badges' ? '🏅' : '🎁'}</Text>
            <Text style={styles.emptyText}>
              {tab === 'badges'
                ? 'Aucun badge pour le moment'
                : 'Aucun cadeau disponible'}
            </Text>
            <Text style={styles.emptyHint}>
              Créez vos premiers cadeaux depuis la version web
            </Text>
          </View>
        }
      />

      {/* Create Reward Modal */}
      {isCreateModalOpen && (
        <CreateRewardModal
          visible={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={refetch}
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
    paddingBottom: 16,
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: QuestifyColors.textPrimary,
  },
  pointsBanner: {
    marginHorizontal: 20,
    marginBottom: 20,
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: QuestifyColors.primaryLight,
  },
  pointsEmoji: {
    fontSize: 40,
    marginBottom: 8,
  },
  pointsValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: QuestifyColors.textPrimary,
    marginBottom: 4,
  },
  pointsLabel: {
    fontSize: 14,
    color: QuestifyColors.textSecondary,
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 12,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: QuestifyColors.background,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: QuestifyColors.primary,
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
    color: QuestifyColors.textSecondary,
  },
  tabTextActive: {
    color: QuestifyColors.textPrimary,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  tierSection: {
    marginBottom: 24,
  },
  tierHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  tierTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: QuestifyColors.textPrimary,
  },
  tierCount: {
    fontSize: 14,
    fontWeight: '600',
    color: QuestifyColors.textPrimary,
    opacity: 0.7,
  },
  rewardCard: {
    marginBottom: 12,
    alignItems: 'center',
    paddingVertical: 20,
  },
  emojiContainer: {
    marginBottom: 12,
  },
  emoji: {
    fontSize: 48,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: QuestifyColors.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  description: {
    fontSize: 14,
    color: QuestifyColors.textSecondary,
    textAlign: 'center',
    marginBottom: 12,
    paddingHorizontal: 16,
    lineHeight: 20,
  },
  cost: {
    fontSize: 20,
    fontWeight: 'bold',
    color: QuestifyColors.primary,
    marginBottom: 16,
  },
  buyButton: {
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
    minWidth: 160,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  buyButtonEnabled: {
    backgroundColor: QuestifyColors.green,
  },
  buyButtonDisabled: {
    backgroundColor: QuestifyColors.backgroundDark,
  },
  buyButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: QuestifyColors.textPrimary,
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
});
