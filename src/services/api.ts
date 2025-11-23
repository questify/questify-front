import {
  API_BASE_URL,
  Category,
  CreateCategoryRequest,
  CreateQuestRequest,
  CreateRewardRequest,
  DailyOverview,
  Frequency,
  Quest,
  QuestDetail,
  Reward,
  WeeklyOverview,
} from '../types/api';

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
  const url = `${API_BASE_URL}${endpoint}`;

  // Get auth token from localStorage
  const token = localStorage.getItem('questify_token');
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options?.headers,
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
  },

  // Quests
  quests: {
    list: () => request<Quest[]>('/api/quests'),
    getById: (id: string) => request<QuestDetail>(`/api/quests/${id}`),
    create: (data: CreateQuestRequest) =>
      request<Quest>('/api/quests', {
        method: 'POST',
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
  },

  // Users
  users: {
    getMe: () => request<any>('/api/users/me'),
    updateMe: (data: { name?: string; email?: string; avatar_url?: string }) =>
      request<any>('/api/users/me', {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
  },

  // Validations
  validations: {
    create: (data: { quest_id: string; type: 'completion' | 'failure' }) =>
      request<any>('/api/validations', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    getWeeklyOverview: () => request<WeeklyOverview>('/api/validations/weekly-overview'),
    getDailyOverview: () => request<DailyOverview>('/api/validations/daily-overview'),
  },

  // Reward Purchases
  rewardPurchases: {
    purchase: (reward_id: string) =>
      request<any>('/api/rewards/purchase', {
        method: 'POST',
        body: JSON.stringify({ reward_id }),
      }),
  },
};

export { ApiError };
