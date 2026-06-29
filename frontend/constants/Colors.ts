export const Colors = {
  // Brand — deep emerald
  primary: '#0A7251',
  primaryLight: '#16A37F',
  primaryDark: '#064E38',
  primaryMid: '#0D8F66',

  // Accent — warm amber/gold
  accent: '#D97706',
  accentLight: '#FEF3C7',
  accentDark: '#B45309',

  // Semantic
  secondary: '#059669',
  secondaryLight: '#A7F3D0',
  danger: '#DC2626',
  dangerLight: '#FEE2E2',
  warning: '#D97706',

  // Backgrounds
  background: '#F0FDF6',
  surface: '#FFFFFF',
  surfaceElevated: '#F8FFF9',
  surfaceTinted: '#ECFDF5',

  // Borders
  border: '#BBF7D0',
  borderLight: '#DCFCE7',

  // Text
  textPrimary: '#052E1C',
  textSecondary: '#166534',
  textMuted: '#6B7280',
  textOnDark: '#FFFFFF',

  // Specials
  star: '#F59E0B',
  discount: '#DC2626',
  statusPreparing: '#D97706',
  statusOnTheWay: '#0284C7',
  statusDelivered: '#059669',

  // Tab bar
  tabBar: '#052E1C',
  tabBarActive: '#34D399',
  tabBarInactive: '#6EE7B7',
};

export const Gradients = {
  primary: ['#0A7251', '#16A37F'] as const,
  primaryDark: ['#064E38', '#0A7251'] as const,
  primaryVibrant: ['#059669', '#16A37F'] as const,
  accent: ['#D97706', '#F59E0B'] as const,
  hero: ['#052E1C', '#064E38', '#0A7251'] as const,
  success: ['#059669', '#10B981'] as const,
  warm: ['#D97706', '#DC2626'] as const,
  card: ['rgba(6,78,56,0)', 'rgba(6,78,56,0.75)'] as const,
};
