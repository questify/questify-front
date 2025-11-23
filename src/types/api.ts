// API Types and Interfaces

// ============= BASE CONFIGURATION =============
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// ============= RESPONSES =============

export interface Category {
  id: string;
  name: string;
  svg_icon: string | null;
  color: string | null;
  is_default: boolean;
  created_at: string;
}

export interface Quest {
  id: string;
  title: string;
  description: string | null;
  points: number;
  malus: number;
  svg_icon: string | null;
  category_name: string;
  category_color: string | null;
  frequency: 'daily' | 'weekly' | 'monthly';
}

export interface QuestDetail {
  id: string;
  title: string;
  description: string | null;
  points: number;
  malus: number;
  svg_icon: string | null;
  created_at: string;
  category_id: string;
  category_name: string;
  category_color: string | null;
  frequency: 'daily' | 'weekly' | 'monthly';
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
  type: 'completion' | 'failure';
  points_earned: number;
}

export interface Objective {
  id: string;
  title: string;
  description: string | null;
  points: number;
  malus: number;
  svg_icon: string | null;
  category_name: string;
  category_color: string | null;
  is_active: boolean;
  quest_per_user_id: string;
  validations_this_week?: Validation[];
  validations_today?: Validation[];
}

export interface WeeklyOverview {
  week_period: {
    start: string;
    end: string;
  };
  validated_count: number;
  objectives: Objective[];
}

export interface DailyOverview {
  day_period: {
    start: string;
    end: string;
  };
  validated_count: number;
  objectives: Objective[];
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
  svg_icon?: string | null;
}

export interface CreateRewardRequest {
  title: string;
  description?: string | null;
  cost: number;
  svg_icon?: string | null;
}

// ============= LOOKUP TYPES =============

export type QuestFrequencyName = 'daily' | 'weekly' | 'monthly';
export type ValidationTypeName = 'completion' | 'failure';
export type MilestoneTypeName = 'bronze' | 'silver' | 'gold';
export type RewardBadgeName = 'bronze' | 'silver' | 'gold';
export type TeamStatusName = 'active' | 'pending' | 'inactive';
