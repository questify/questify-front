import {
  Category,
  CreateCategoryRequest,
  CreateDailyMoodRequest,
  CreatePositiveThingsRequest,
  CreateQuestRequest,
  CreateRewardRequest,
  DailyMood,
  DailyOverview,
  Frequency,
  PositiveThings,
  Quest,
  Reward,
  WeeklyOverview,
} from '../types/api';
import { getToken } from './tokenStorage';
import { getApiConfig } from "../types/api";

export function apiUrl(path: string) {
    const baseUrl = getApiConfig().baseUrl.replace(/\/$/, "");
    const p = path.startsWith("/") ? path : `/${path}`;
    return `${baseUrl}${p}`;
}

// ============= HTTP CLIENT =============

class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public data?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const url = apiUrl(endpoint);

  // Get auth token from localStorage
  const token = await getToken();
  try {
      const response = await fetch(url, {
          ...options,
          headers: {
              "Content-Type": "application/json",
              "Cache-Control": "no-cache",
              ...(options?.headers ?? {}),
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
      });

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch {
        errorData = { error: response.statusText };
      }

      throw new ApiError(
        response.status,
        errorData.error || `HTTP ${response.status}: ${response.statusText}`,
        errorData
      );
    }
    // Handle 204 No Content
    if (response.status === 204) {
      return undefined as T;
    }
    return await response.json();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    // Network error or other issue
    throw new ApiError(
      0,
      error instanceof Error ? error.message : 'Network error',
      error
    );
  }
}

// ============= API SERVICES =============

export const api = {

  // Categories
  categories: {
    list: () => request<Category[]>('/api/categories'),
    create: (data: CreateCategoryRequest) =>
      request<Category>('/api/categories', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: Partial<CreateCategoryRequest>) =>
      request<Category>(`/api/categories/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      request<void>(`/api/categories/${id}`, {
        method: 'DELETE',
      }),
  },

  // Quests
  quests: {
    list: () => request<Quest[]>('/api/quests'),
    create: (data: CreateQuestRequest) =>
      request<Quest>('/api/quests', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: Partial<Quest>) =>
      request<Quest>(`/api/quests/${id}/active`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
  },

  // Rewards
  rewards: {
    list: () => request<Reward[]>('/api/rewards'),
    getById: (id: string) => request<Reward>(`/api/rewards/${id}`),
    create: (data: CreateRewardRequest) =>
      request<Reward>('/api/rewards', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: Partial<CreateRewardRequest>) =>
      request<Reward>(`/api/rewards/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      request<void>(`/api/rewards/${id}`, {
        method: 'DELETE',
      }),
    purchase: (reward_id: string) =>
      request<any>('/api/rewards/purchase', {
        method: 'POST',
        body: JSON.stringify({ reward_id }),
      }),
  },

  // Frequencies (Lookup)
  frequencies: {
    list: () => request<Frequency[]>('/api/frequencies'),
  },

  // Authentication
  auth: {
    register: (data: { name: string; email: string; password: string }) =>
      request<{ user: any; token: string }>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    login: (data: { email: string; password: string }) =>
      request<{ user: any; token: string }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    changePassword: (data: { current_password: string; new_password: string }) =>
      request<void>('/api/auth/change-password', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },

  // Users
  users: {
    list: () => request<any[]>('/api/users'),
    getMe: () => request<any>('/api/users/me'),
    updateMe: (data: { name?: string; email?: string; avatar_url?: string; start_date?: string }) =>
      request<any>('/api/users/me', {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    uploadAvatar: async (fileOrFormData: File | Blob | FormData): Promise<{ avatar_url: string }> => {
      const url = apiUrl('/api/upload/avatar');
      const token = await getToken();

      let formData: FormData;

      // If it's already a FormData, use it directly (React Native case)
      if (fileOrFormData instanceof FormData) {
        formData = fileOrFormData;
      } else {
        // Otherwise, create FormData and append the file (Web case)
        formData = new FormData();
        formData.append('avatar', fileOrFormData);
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(errorData.error || 'Upload failed');
      }

      return await response.json();
    },
  },

  // Validations
  validations: {
    create: (data: { quest_id: string; type: 'completion' }) =>
      request<any>('/api/validations', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    getWeeklyOverview: () => request<WeeklyOverview>('/api/validations/weekly-overview'),
    getDailyOverview: () => request<DailyOverview>('/api/validations/daily-overview'),
    getHistory: (days: number = 30) => request<any[]>(`/api/validations/history?days=${days}`),
  },

  // Wellness
  wellness: {
    // Daily Mood
    createOrUpdateDailyMood: (data: CreateDailyMoodRequest) =>
      request<DailyMood>('/api/wellness/daily-mood', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    getDailyMoodHistory: (days: number = 30) =>
      request<DailyMood[]>(`/api/wellness/daily-mood/history?days=${days}`),

    // Positive Things
    createOrUpdatePositiveThings: (data: CreatePositiveThingsRequest) =>
      request<PositiveThings>('/api/wellness/positive-things', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    getPositiveThingsHistory: (days: number = 30) =>
      request<PositiveThings[]>(`/api/wellness/positive-things/history?days=${days}`),
  },

  // Teams
  teams: {
    list: () => request<any[]>('/api/teams'),
    getById: (id: string) => request<any>(`/api/teams/${id}`),
    create: (data: { name: string; svg_icon?: string; hash_svg?: string; status_id?: number }) =>
      request<any>('/api/teams', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: { name?: string; svg_icon?: string; hash_svg?: string; status_id?: number }) =>
      request<any>(`/api/teams/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      request<void>(`/api/teams/${id}`, {
        method: 'DELETE',
      }),
    getMembers: (id: string) => request<any[]>(`/api/teams/${id}/members`),
    addMember: (id: string, user_id: string) =>
      request<any[]>(`/api/teams/${id}/members`, {
        method: 'POST',
        body: JSON.stringify({ user_id }),
      }),
    removeMember: (id: string, userId: string) =>
      request<void>(`/api/teams/${id}/members/${userId}`, {
        method: 'DELETE',
      }),
    getChallenges: (id: string) => request<any[]>(`/api/teams/${id}/challenges`),
    createChallenge: (id: string, data: { name: string; points: number; bonus_multiplier?: number; end_at?: string; quest_ids?: string[] }) =>
      request<any>(`/api/teams/${id}/challenges`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    deleteChallenge: (id: string, challengeId: string) =>
      request<void>(`/api/teams/${id}/challenges/${challengeId}`, {
        method: 'DELETE',
      }),
  },
};

export { ApiError };
