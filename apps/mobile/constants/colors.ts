// Questify Color Palette
export const QuestifyColors = {
  // Primary colors
  primary: '#C8B7E8',      // Violet principal
  primaryLight: '#E8DFFA',
  primaryDark: '#8F72C4',

  // Secondary colors
  green: '#C8EAD3',        // Vert pour récompenses
  greenLight: '#E0F5E8',   // Vert clair
  blue: '#79BEEE',         // Bleu
  orange: '#F2B8A3',       // Orange
  yellow: '#FFD93D',       // Jaune

  // Text colors
  textPrimary: '#1A1A1A',
  textSecondary: '#6B6B6B',
  textLight: '#999999',

  // Background colors
  background: '#FFFFFF',
  backgroundLight: '#F5F5F5',
  backgroundDark: '#E0E0E0',

  // Status colors
  success: '#4CAF50',
  successLight: '#E8F5E9',
  error: '#F44336',
  warning: '#FF9800',
  info: '#2196F3',

  // UI colors
  border: '#E0E0E0',
  divider: '#EEEEEE',
  overlay: 'rgba(0, 0, 0, 0.5)',

  // Gradients (for use with react-native-linear-gradient if needed)
  gradientPrimary: ['#C8B7E8', '#8F72C4'],
  gradientGreen: ['#C8EAD3', '#A8CAB3'],
  gradientBlue: ['#79BEEE', '#5998CE'],
  gradientOrange: ['#F2B8A3', '#D29883'],
};

export const RewardTierColors = {
  small: QuestifyColors.green,    // 0-300 pts
  medium: QuestifyColors.blue,    // 301-600 pts
  large: QuestifyColors.primary,  // 601-1000 pts
  xlarge: QuestifyColors.orange,  // 1000+ pts
};
