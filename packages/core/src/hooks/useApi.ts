import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import {
    CreateCategoryRequest,
    CreateDailyMoodRequest,
    CreatePositiveThingsRequest,
    CreateQuestRequest,
    CreateRewardRequest,
    CreateValidationRequest,
} from '../types/api';
import { useAuth } from "../contexts/AuthContext";

// ============= QUERY KEYS =============
export const queryKeys = {
    categories: ['categories'] as const,
    quests: ['quests'] as const,
    quest: (id: string) => ['quests', id] as const,
    rewards: ['rewards'] as const,
    reward: (id: string) => ['rewards', id] as const,
    frequencies: ['frequencies'] as const,
    validations : ['validations'] as const,
    validation: (id: string) => ['validation', id] as const,
    validationsHistory: ['validationsHistory'] as const,
    weeklyOverview: ['weeklyOverview'] as const,
    dailyOverview: ['dailyOverview'] as const,
    dailyMood: (date: string) => ['dailyMood', date] as const,
    dailyMoodHistory: ['dailyMoodHistory'] as const,
    positiveThings: (date: string) => ['positiveThings', date] as const,
    positiveThingsHistory: ['positiveThingsHistory'] as const,
    users: ['users'] as const,
    teams: ['teams'] as const,
    team: (id: string) => ['teams', id] as const,
    teamMembers: (id: string) => ['teams', id, 'members'] as const,
    teamChallenges: (id: string) => ['teams', id, 'challenges'] as const,
};

// ============= CATEGORIES =============

export function useCategories() {
    const { isAuthReady, isLoggedIn } = useAuth();
    return useQuery({
        queryKey: queryKeys.categories,
        queryFn: api.categories.list,
        enabled: isAuthReady && isLoggedIn,
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

export function useUpdateCategory() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<CreateCategoryRequest> }) =>
            api.categories.update(id, data),
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.categories });
            queryClient.invalidateQueries({ queryKey: queryKeys.quests });
        },
    });
}

export function useDeleteCategory() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => api.categories.delete(id),
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.categories });
            queryClient.invalidateQueries({ queryKey: queryKeys.quests });
        },
    });
}

// ============= QUESTS =============

export function useQuests() {
    const { isAuthReady, isLoggedIn } = useAuth();
    return useQuery({
        queryKey: queryKeys.quests,
        queryFn: api.quests.list,
        enabled: isAuthReady && isLoggedIn,
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

export function useUpdateQuest() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<any> }) => api.quests.update(id, data),
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.quests });
        },
    });
}

// ============= REWARDS =============

export function useRewards() {
    const { isAuthReady, isLoggedIn } = useAuth();
    return useQuery({
        queryKey: queryKeys.rewards,
        queryFn: api.rewards.list,
        enabled: isAuthReady && isLoggedIn,
    });
}

export function useReward(id: string) {
    const { isAuthReady, isLoggedIn } = useAuth();
    return useQuery({
        queryKey: queryKeys.reward(id),
        queryFn: () => api.rewards.getById(id),
        enabled: !!id && isAuthReady && isLoggedIn,
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

export function useUpdateReward() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<CreateRewardRequest> }) =>
            api.rewards.update(id, data),
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.rewards });
        },
    });
}

export function useDeleteReward() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => api.rewards.delete(id),
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.rewards });
        },
    });
}

export function usePurchaseReward() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (reward_id: string) => api.rewards.purchase(reward_id),
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.rewards });
        },
    });
}

// ============= FREQUENCIES =============

export function useFrequencies() {
    const { isAuthReady, isLoggedIn } = useAuth();
    return useQuery({
        queryKey: queryKeys.frequencies,
        queryFn: api.frequencies.list,
        enabled: isAuthReady && isLoggedIn,
    });
}

// ============= VALIDATIONS =============

export function useWeeklyOverview() {
    const { isAuthReady, isLoggedIn } = useAuth();
    return useQuery({
        queryKey: queryKeys.weeklyOverview,
        queryFn: api.validations.getWeeklyOverview,
        enabled: isAuthReady && isLoggedIn,
    });
}

export function useDailyOverview() {
    const { isAuthReady, isLoggedIn } = useAuth();
    return useQuery({
        queryKey: queryKeys.dailyOverview,
        queryFn: api.validations.getDailyOverview,
        enabled: isAuthReady && isLoggedIn,
    });
}

export function useValidationsHistory(days: number = 30) {
    const { isAuthReady, isLoggedIn } = useAuth();
    return useQuery({
        queryKey: queryKeys.validationsHistory,
        queryFn: () => api.validations.getHistory(days),
        retry: false, // Don't retry if endpoint doesn't exist
        meta: {
            errorMessage: 'Endpoint not available yet'
        },
        enabled: isAuthReady && isLoggedIn,
    });
}

export function useCreateValidation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: CreateValidationRequest) => api.validations.create(data),
        onMutate: async (newValidation) => {
            // Cancel outgoing queries
            await queryClient.cancelQueries({ queryKey: queryKeys.validations });
            // Snapshot previous value
            const previousValidation = queryClient.getQueryData(queryKeys.validations);
            // Optimistically update
            queryClient.setQueryData(queryKeys.validations, (old: any) => {
                return [
                    ...(old || []),
                    {
                        ...newValidation,
                        id: 'temp-' + Date.now(),
                        created_at: new Date().toISOString(),
                    },
                ];
            });
            return { previousValidation };
        },
        onError: (err, newReward, context) => {
            // Rollback on error
            queryClient.setQueryData(queryKeys.validations, context?.previousValidation);
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.validations });
            queryClient.invalidateQueries({ queryKey: queryKeys.dailyOverview });
            queryClient.invalidateQueries({ queryKey: queryKeys.weeklyOverview });
            queryClient.invalidateQueries({ queryKey: queryKeys.validationsHistory });
        },
    });
}

// ============= WELLNESS =============

export function useDailyMoodHistory(days: number = 30) {
    const { isAuthReady, isLoggedIn } = useAuth();
    return useQuery({
        queryKey: queryKeys.dailyMoodHistory,
        queryFn: () => api.wellness.getDailyMoodHistory(days),
        enabled: isAuthReady && isLoggedIn,
    });
}

export function useCreateOrUpdateDailyMood() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: CreateDailyMoodRequest) => api.wellness.createOrUpdateDailyMood(data),
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.dailyMoodHistory });
        },
    });
}

export function usePositiveThingsHistory(days: number = 30) {
    const { isAuthReady, isLoggedIn } = useAuth();
    return useQuery({
        queryKey: queryKeys.positiveThingsHistory,
        queryFn: () => api.wellness.getPositiveThingsHistory(days),
        enabled: isAuthReady && isLoggedIn,
    });
}

export function useCreateOrUpdatePositiveThings() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: CreatePositiveThingsRequest) => api.wellness.createOrUpdatePositiveThings(data),
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.positiveThingsHistory });
        },
    });
}

// ============= USERS =============

export function useUpdateUser() {
    const queryClient = useQueryClient();
    const { refreshUser } = useAuth();

    return useMutation({
        mutationFn: (data: { name?: string; email?: string; avatar_url?: string; start_date?: string }) =>
            api.users.updateMe(data),
        onSuccess: async () => {
            // Refresh user data in AuthContext
            await refreshUser();
        },
    });
}

// ============= BOARD (YEARLY OVERVIEW) =============

export function useYearlyBoardData() {
    const { isAuthReady, isLoggedIn } = useAuth();
    return useQuery({
        enabled: isAuthReady && isLoggedIn,
        queryKey: ['yearlyBoardData'],
        queryFn: async () => {
            // Fetch validation history for the past year (365 days)
            const validations = await api.validations.getHistory(365);
            // Fetch mood history for the past year
            const moods = await api.wellness.getDailyMoodHistory(365);
            // Fetch all quests to know their frequencies
            const quests = await api.quests.list();

            return {
                validations,
                moods,
                quests,
            };
        },
    });
}

// ============= TEAMS =============

export function useTeams() {
    const { isAuthReady, isLoggedIn } = useAuth();
    return useQuery({
        queryKey: queryKeys.teams,
        queryFn: api.teams.list,
        enabled: isAuthReady && isLoggedIn,
    });
}

export function useTeam(id: string) {
    const { isAuthReady, isLoggedIn } = useAuth();
    return useQuery({
        queryKey: queryKeys.team(id),
        queryFn: () => api.teams.getById(id),
        enabled: !!id && isAuthReady && isLoggedIn,
    });
}

export function useTeamMembers(id: string) {
    const { isAuthReady, isLoggedIn } = useAuth();
    return useQuery({
        queryKey: queryKeys.teamMembers(id),
        queryFn: () => api.teams.getMembers(id),
        enabled: !!id && isAuthReady && isLoggedIn,
    });
}

export function useCreateTeam() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: { name: string; svg_icon?: string; hash_svg?: string; status_id?: number }) =>
            api.teams.create(data),
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.teams });
        },
    });
}

export function useUpdateTeam() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: { name?: string; svg_icon?: string; hash_svg?: string; status_id?: number } }) =>
            api.teams.update(id, data),
        onSettled: (data, error, variables) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.teams });
            queryClient.invalidateQueries({ queryKey: queryKeys.team(variables.id) });
        },
    });
}

export function useDeleteTeam() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => api.teams.delete(id),
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.teams });
        },
    });
}

export function useAddTeamMember() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ teamId, userId }: { teamId: string; userId: string }) =>
            api.teams.addMember(teamId, userId),
        onSettled: (data, error, variables) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.teamMembers(variables.teamId) });
        },
    });
}

export function useRemoveTeamMember() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ teamId, userId }: { teamId: string; userId: string }) =>
            api.teams.removeMember(teamId, userId),
        onSettled: (data, error, variables) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.teamMembers(variables.teamId) });
        },
    });
}

export function useUsers() {
    const { isAuthReady, isLoggedIn } = useAuth();
    return useQuery({
        queryKey: queryKeys.users,
        queryFn: api.users.list,
        enabled: isAuthReady && isLoggedIn,
    });
}

// ============= TEAM CHALLENGES =============

export function useTeamChallenges(teamId: string) {
    const { isAuthReady, isLoggedIn } = useAuth();
    return useQuery({
        queryKey: queryKeys.teamChallenges(teamId),
        queryFn: () => api.teams.getChallenges(teamId),
        enabled: !!teamId && isAuthReady && isLoggedIn,
    });
}

export function useCreateTeamChallenge() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ teamId, data }: { teamId: string; data: { name: string; points: number; bonus_multiplier?: number; end_at?: string; quest_ids?: string[] } }) =>
            api.teams.createChallenge(teamId, data),
        onSettled: (data, error, variables) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.teamChallenges(variables.teamId) });
        },
    });
}

export function useDeleteTeamChallenge() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ teamId, challengeId }: { teamId: string; challengeId: string }) =>
            api.teams.deleteChallenge(teamId, challengeId),
        onSettled: (data, error, variables) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.teamChallenges(variables.teamId) });
        },
    });
}
