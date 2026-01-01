// API Types and Interfaces

// ============= BASE CONFIGURATION =============
export type ApiConfig = {
    baseUrl: string;
};

let _config: ApiConfig | null = null;

export function setApiConfig(config: ApiConfig) {
    _config = config;
}

export function getApiConfig(): ApiConfig {
    if (!_config) {
        throw new Error(
            "API config not set. Call setApiConfig({ baseUrl }) at app startup."
        );
    }
    return _config;
}
// ============= RESPONSES =============

export interface Category {
  id: string;
  name: string;
  svg_icon: string | null;
  color: string | null;
  is_default: boolean;
  created_at: string;
}

export interface Reward {
  id: string;
  title: string;
  description: string | null;
  cost: number;
  svg_icon: string | null;
  created_at: string;
}

export interface Frequency {
  id: number;
  name: 'daily' | 'weekly' | 'monthly';
}

export interface Validation {
  id: string;
  date: string;
  type: 'completion';
  points_earned: number;
}

export interface Quest {
  id: string;
  title: string;
  description: string | null;
  points: number;
  malus: number;
  svg_icon: string | null;
  category_name: string;
  category_color: string;
  frequency: string;
  is_active: boolean;
  is_private: boolean;
  validations_this_week?: Validation[];
  validations_today?: Validation[];
}

export interface WeeklyOverview {
  week_period: {
    start: string;
    end: string;
  };
  validated_count: number;
  quests: Quest[];
}

export interface DailyOverview {
  day_period: {
    start: string;
    end: string;
  };
  validated_count: number;
  quests: Quest[];
}

export interface ErrorResponse {
  error: string;
}

// ============= REQUESTS =============

export interface CreateCategoryRequest {
  name: string;
  svg_icon?: string | null;
  color?: string | null;
  is_default?: boolean;
}

export interface CreateQuestRequest {
  title: string;
  description?: string | null;
  category_id: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  points: number;
  malus?: number;
  is_active?: boolean;
  is_private?: boolean;
  svg_icon?: string | null;
}

export interface CreateRewardRequest {
  title: string;
  description?: string | null;
  cost: number;
  svg_icon?: string | null;
}

export interface CreateValidationRequest {
  quest_id: string;
  user_id: string;
  date: string;
  type: 'completion';
  points_earned: number;
  bonus_multiplier?: number;
}

// ============= WELLNESS TYPES =============

export interface DailyMood {
  id: string;
  user_id: string;
  date: string;
  mood_value: number;
  created_at: string;
  updated_at: string;
}

export interface CreateDailyMoodRequest {
  date: string;
  mood_value: number;
}

export interface PositiveThings {
  id: string;
  user_id: string;
  date: string;
  thing_1: string | null;
  thing_2: string | null;
  thing_3: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreatePositiveThingsRequest {
  date: string;
  thing_1?: string | null;
  thing_2?: string | null;
  thing_3?: string | null;
}

// ============= LOOKUP TYPES =============

export type QuestFrequencyName = 'daily' | 'weekly' | 'monthly';
export type ValidationTypeName = 'completion';
export type MilestoneTypeName = 'bronze' | 'silver' | 'gold';
export type RewardBadgeName = 'bronze' | 'silver' | 'gold';
export type TeamStatusName = 'active' | 'pending' | 'inactive';
