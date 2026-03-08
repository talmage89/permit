import { useColorScheme } from 'react-native';

const palette = {
  white: '#FFFFFF',
  black: '#000000',
  accent: '#6366F1',
  accentLight: '#818CF8',
  success: '#22C55E',
  danger: '#EF4444',
  warning: '#F59E0B',
  purple: '#8B5CF6',
};

const light = {
  ...palette,
  bg: '#F8F8FA',
  card: '#FFFFFF',
  surface: '#F1F1F4',
  text: '#1A1A2E',
  textSecondary: '#6B7280',
  textTertiary: '#9CA3AF',
  border: '#E5E7EB',
  borderLight: '#F3F4F6',
  inputBg: '#F9FAFB',
  modalBg: '#FFFFFF',
  backdrop: 'rgba(0, 0, 0, 0.4)',
  errorBg: '#FEF2F2',
  errorText: '#DC2626',
  tabBar: '#FFFFFF',
  tabBarBorder: '#E5E7EB',
  navBg: '#F8F8FA',
  skeleton: '#E5E7EB',
};

const dark = {
  ...palette,
  bg: '#0A0A0F',
  card: '#16161E',
  surface: '#1E1E2A',
  text: '#F1F1F4',
  textSecondary: '#9CA3AF',
  textTertiary: '#6B7280',
  border: '#2A2A3A',
  borderLight: '#1E1E2A',
  inputBg: '#1A1A26',
  modalBg: '#16161E',
  backdrop: 'rgba(0, 0, 0, 0.6)',
  errorBg: '#1C1012',
  errorText: '#F87171',
  tabBar: '#0F0F16',
  tabBarBorder: '#1E1E2A',
  navBg: '#0A0A0F',
  skeleton: '#2A2A3A',
};

export type Theme = typeof light;

export function useTheme(): Theme {
  const scheme = useColorScheme();
  return scheme === 'dark' ? dark : light;
}

export function useIsDark(): boolean {
  return useColorScheme() === 'dark';
}
