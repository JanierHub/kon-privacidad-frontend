import type { NavigatorScreenParams } from '@react-navigation/native';

/**
 * Central place for every navigation param list used across the app.
 *
 * Keeping all param lists here lets us strongly type every
 * navigation.navigate / useNavigation call, so refactors and typos
 * are caught at compile time.
 */

/**
 * Params passed to the generic detail screens that each tab's stack
 * exposes. Screens are empty placeholders for now; amend this shape
 * as real features are built.
 */
export type DetailScreenParams = {
  /** Optional title shown by the placeholder detail screen. */
  title?: string;
};

/**
 * Stack param list for the Home tab ("Inicio" in the UI).
 */
export type HomeStackParamList = {
  HomeMain: undefined;
  HomeDetail: DetailScreenParams;
};

/**
 * Stack param list for the News tab ("Noticias" in the UI).
 */
export type NewsStackParamList = {
  NewsMain: undefined;
  NewsDetail: DetailScreenParams;
};

/**
 * Stack param list for the Posts tab ("Publicaciones" in the UI).
 */
export type PostsStackParamList = {
  PostsMain: undefined;
  PostsDetail: DetailScreenParams;
};

/**
 * Stack param list for the Calendar tab ("Calendario" in the UI).
 */
export type CalendarStackParamList = {
  CalendarMain: undefined;
  CalendarDetail: DetailScreenParams;
};

/**
 * Stack param list for the Schedule tab ("Tutorías" in the UI).
 */
export type ScheduleStackParamList = {
  ScheduleMain: undefined;
  ScheduleDetail: DetailScreenParams;
};

/**
 * Stack param list for the Horario tab (personal schedule in the UI).
 */
export type HorarioStackParamList = {
  HorarioMain: undefined;
  HorarioDetail: DetailScreenParams;
};

/**
 * Stack param list for the Alerts tab ("Alertas" in the UI).
 */
export type AlertsStackParamList = {
  AlertsMain: undefined;
  AlertsDetail: DetailScreenParams;
};

/**
 * Stack param list for the Profile tab ("Perfil" in the UI).
 */
export type ProfileStackParamList = {
  ProfileMain: undefined;
  ProfileDetail: DetailScreenParams;
};

/**
 * Bottom tab navigator param list.
 *
 * Each tab value is itself a stack param list wrapped in
 * NavigatorScreenParams, so navigating to a tab can optionally target
 * a specific screen inside that tab's stack.
 */
export type RootTabParamList = {
  HomeTab: NavigatorScreenParams<HomeStackParamList>;
  NewsTab: NavigatorScreenParams<NewsStackParamList>;
  PostsTab: NavigatorScreenParams<PostsStackParamList>;
  CalendarTab: NavigatorScreenParams<CalendarStackParamList>;
  HorarioTab: NavigatorScreenParams<HorarioStackParamList>;
  ScheduleTab: NavigatorScreenParams<ScheduleStackParamList>;
  AlertsTab: NavigatorScreenParams<AlertsStackParamList>;
  ProfileTab: NavigatorScreenParams<ProfileStackParamList>;
};

/**
 * Root stack param list.
 *
 * The root navigator hosts the welcome/auth screen and the tabbed app,
 * giving us a natural place to later add full-screen flows such as a
 * real login, onboarding, or modal screens above the tabs.
 */
export type RootStackParamList = {
  Auth: undefined;
  MainTabs: NavigatorScreenParams<RootTabParamList>;
  Admin: undefined;
};
