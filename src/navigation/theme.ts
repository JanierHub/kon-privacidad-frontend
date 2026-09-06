import { DefaultTheme, type Theme } from '@react-navigation/native';
import { Platform } from 'react-native';

/**
 * Central navigation theming.
 *
 * Colors based on a blue institutional palette.
 */

export const Colors = {
  /** Brand / primary accent — institutional blue. */
  primary: '#1A73E8',
  /** Dark accent — deep navy. */
  dark: '#0D47A1',
  /** Background used behind screens and navigation chrome. */
  background: '#FFFFFF',
  /** Surface color for cards and raised elements. */
  card: '#FFFFFF',
  /** Default text color. */
  text: '#1F2937',
  /** Border color for separators and outlines. */
  border: '#E5E7EB',
  /** Color for placeholders and subtle UI. */
  subtitle: '#6B7280',
  /** Danger / error color. */
  danger: '#DC2626',
  /** Success color. */
  success: '#16A34A',
} as const;

/** Typographic settings used by navigation labels. */
export const Fonts = {
  family: undefined as string | undefined,
  tabLabelSize: 10,
  headerTitleSize: 17,
} as const;

export const navigationTheme: Theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: Colors.primary,
    background: Colors.background,
    card: Colors.card,
    text: Colors.text,
    border: Colors.border,
    notification: Colors.primary,
  },
  fonts: DefaultTheme.fonts,
};

export const tabBarOptions = {
  tabBarLabelStyle: {
    fontSize: Fonts.tabLabelSize,
    fontFamily: Fonts.family,
  },
  tabBarActiveTintColor: Colors.primary,
  tabBarInactiveTintColor: Colors.subtitle,
  tabBarItemStyle: {
    flex: 1,
    minWidth: 0,
  },
  tabBarStyle: {
    backgroundColor: Colors.card,
    borderTopColor: Colors.border,
  } as const,
} as const;

export const headerOptions = Platform.select({
  android: {
    headerStyle: { backgroundColor: Colors.card },
    headerTitleStyle: { color: Colors.text, fontSize: Fonts.headerTitleSize },
    headerTintColor: Colors.primary,
  },
  default: {
    headerTitleStyle: { color: Colors.text, fontSize: Fonts.headerTitleSize },
    headerTintColor: Colors.primary,
  },
});