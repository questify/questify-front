// Questify mobile — typography tokens.
// Plus Jakarta Sans is loaded via expo-font in app/_layout.tsx (see HANDOFF.md).
// Until then, this exports the family names; React Native will fall back to system.

import { Platform } from 'react-native';

export const QuestifyFonts = {
  /** Display / headings — Plus Jakarta Sans 700/800. */
  display: Platform.select({
    ios: 'Plus Jakarta Sans',
    android: 'PlusJakartaSans-Bold',
    default: "'Plus Jakarta Sans', system-ui, sans-serif",
  }) as string,
  /** Body — Inter 400/600. */
  body: Platform.select({
    ios: 'Inter',
    android: 'Inter-Regular',
    default: "Inter, system-ui, sans-serif",
  }) as string,
};

export const QuestifyTypography = {
  // Sizes mirror the web app's scale (see questify-design-system/colors_and_type.css).
  fsDisplay: 32,
  fsH1:      28,
  fsH2:      22,
  fsH3:      18,
  fsBody:    16,
  fsSm:      14,
  fsXs:      12,
  fs2xs:     11,

  fwRegular:  '400' as const,
  fwMedium:   '500' as const,
  fwSemibold: '600' as const,
  fwBold:     '700' as const,
  fwBlack:    '800' as const,
};
