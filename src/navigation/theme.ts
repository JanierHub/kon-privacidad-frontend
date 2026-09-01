import { DefaultTheme, type Theme } from '@react-navigation/native';
import { Platform } from 'react-native';

/**
 * Central navigation theming.
 *
 * React Navigation accepts a Theme object that controls the background,
 * card, text, border, and primary colors used by headers, tab bars and
 * screens. Defining it once here makes the app ready to customize brand
 * colors and fonts later without touching screens.
 *
 * We extend React Navigation's default theme so we inherit sensible
 * defaults while overriding the values we care about.
 */

/** Base app colors. Tune these once the visual identity is defined. */
export const Colors = {
  /** Brand / primary accent color. */
  primary: '#6C4AB6',
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
} as const;

/** Typographic settings used by navigation labels. */
export const Fonts = {
  /** Family name, or undefined to keep the platform default. */
  family: undefined as string | undefined,
  /** Label size used by the tab bar. */
  tabLabelSize: 10,
  /** Header title size. */
  headerTitleSize: 17,
} as const;

/**
 * Build the React Navigation theme from our color tokens.
 * Extend DefaultTheme so all required theme fields are present.
 */
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
  // React Navigation 7 themes also carry a `fonts` field. Keeping the
  // platform defaults is the safe choice until a custom font is added.
  fonts: DefaultTheme.fonts,
};

/** Shared tab bar styling applied to the bottom tab navigator. */
export const tabBarOptions = {
  tabBarLabelStyle: {
    fontSize: Fonts.tabLabelSize,
    fontFamily: Fonts.family,
  },
  tabBarActiveTintColor: Colors.primary,
  tabBarInactiveTintColor: Colors.subtitle,
  // Keep each tab item flexible so short labels like "Inicio" and longer
  // ones like "Calendario" render in full instead of being clipped with
  // an ellipsis when all six tabs are shown.
  tabBarItemStyle: {
    flex: 1,
    minWidth: 0,
  },
  tabBarStyle: {
    backgroundColor: Colors.card,
    borderTopColor: Colors.border,
  } as const,
} as const;

/** Shared header styling applied to every native stack. */
export const headerOptions = Platform.select({
  // Android native-stack headers have their own surface; keep colors aligned.
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
