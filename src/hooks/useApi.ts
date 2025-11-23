import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import type {
  CreateCategoryRequest,
  CreateQuestRequest,
  CreateRewardRequest,
} from '../types/api';

// ============= QUERY KEYS =============
export const queryKeys = {
  categories: ['categories'] as const,
  quests: ['quests'] as const,
  quest: (id: string) => ['quests', id] as const,
  rewards: ['rewards'] as const,
  reward: (id: string) => ['rewards', id] as const,
  frequencies: ['frequencies'] as const,
  weeklyOverview: ['weeklyOverview'] as const,
  dailyOverview: ['dailyOverview'] as const,
};

// ============= CATEGORIES =============

export function useCategories() {
  return useQuery({
    queryKey: queryKeys.categories,
    queryFn: api.categories.list,
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCategoryRequest) => api.categories.create(data),
    onMutate: async (newCategory) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: queryKeys.categories });
      // Snapshot previous value
      const previousCategories = queryClient.getQueryData(queryKeys.categories);
      // Optimistically update
      queryClient.setQueryData(queryKeys.categories, (old: any) => {
        return [
          ...(old || []),
          {
            ...newCategory,
            id: 'temp-' + Date.now(),
            created_at: new Date().toISOString(),
          },
        ];
      });

      return { previousCategories };
    },
    onError: (err, newCategory, context) => {
      // Rollback on error
      queryClient.setQueryData(queryKeys.categories, context?.previousCategories);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories });
    },
  });
}

// ============= QUESTS =============

export function useQuests() {
  return useQuery({
    queryKey: queryKeys.quests,
    queryFn: api.quests.list,
  });
}

export function useQuest(id: string) {
  return useQuery({
    queryKey: queryKeys.quest(id),
    queryFn: () => api.quests.getById(id),
    enabled: !!id,
  });
}

export function useCreateQuest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateQuestRequest) => api.quests.create(data),
    onMutate: async (newQuest) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: queryKeys.quests });
      // Snapshot previous value
      const previousQuests = queryClient.getQueryData(queryKeys.quests);
      // Optimistically update
      queryClient.setQueryData(queryKeys.quests, (old: any) => {
        return [
          ...(old || []),
          {
            ...newQuest,
            id: 'temp-' + Date.now(),
            category_name: 'Loading...',
            category_color: null,
            svg_icon: null,
            malus: newQuest.malus || 0,
          },
        ];
      });
      return { previousQuests };
    },
    onError: (err, newQuest, context) => {
      // Rollback on error
      queryClient.setQueryData(queryKeys.quests, context?.previousQuests);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.quests });
    },
  });
}

// ============= REWARDS =============

export function useRewards() {
  return useQuery({
    queryKey: queryKeys.rewards,
    queryFn: api.rewards.list,
  });
}

export function useReward(id: string) {
  return useQuery({
    queryKey: queryKeys.reward(id),
    queryFn: () => api.rewards.getById(id),
    enabled: !!id,
  });
}

export function useCreateReward() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateRewardRequest) => api.rewards.create(data),
    onMutate: async (newReward) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: queryKeys.rewards });
      // Snapshot previous value
      const previousRewards = queryClient.getQueryData(queryKeys.rewards);
      // Optimistically update
      queryClient.setQueryData(queryKeys.rewards, (old: any) => {
        return [
          ...(old || []),
          {
            ...newReward,
            id: 'temp-' + Date.now(),
            created_at: new Date().toISOString(),
            svg_icon: null,
          },
        ];
      });
      return { previousRewards };
    },
    onError: (err, newReward, context) => {
      // Rollback on error
      queryClient.setQueryData(queryKeys.rewards, context?.previousRewards);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.rewards });
    },
  });
}

// ============= FREQUENCIES =============

export function useFrequencies() {
  return useQuery({
    queryKey: queryKeys.frequencies,
    queryFn: api.frequencies.list,
  });
}

// ============= VALIDATIONS =============

export function useWeeklyOverview() {
  return useQuery({
    queryKey: queryKeys.weeklyOverview,
    queryFn: api.validations.getWeeklyOverview,
  });
}

export function useDailyOverview() {
  return useQuery({
    queryKey: queryKeys.dailyOverview,
    queryFn: api.validations.getDailyOverview,
  });
}
