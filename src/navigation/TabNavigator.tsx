import Ionicons from '@expo/vector-icons/Ionicons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { AlertsScreen } from '../screens/AlertsScreen';
import { CalendarScreen } from '../screens/CalendarScreen';
import { DetailScreen } from '../screens/DetailScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { HorarioScreen } from '../screens/HorarioScreen';
import { NewsScreen } from '../screens/NewsScreen';
import { PostsScreen } from '../screens/PostsScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { ScheduleScreen } from '../screens/ScheduleScreen';
import { headerOptions, tabBarOptions } from './theme';
import type {
  AlertsStackParamList,
  CalendarStackParamList,
  HomeStackParamList,
  HorarioStackParamList,
  NewsStackParamList,
  PostsStackParamList,
  ProfileStackParamList,
  RootTabParamList,
  ScheduleStackParamList,
} from './types';

const Tab = createBottomTabNavigator<RootTabParamList>();

/**
 * Nested stack for the Home tab ("Inicio" in the UI).
 * Hosts the main feed and a detail sub-screen.
 */
const HomeStack = createNativeStackNavigator<HomeStackParamList>();
function HomeStackNavigator() {
  return (
    <HomeStack.Navigator screenOptions={headerOptions}>
      {/* Main screens render their own in-screen header, so the native
          stack header is hidden to avoid a duplicated title. */}
      <HomeStack.Screen
        name="HomeMain"
        component={HomeScreen}
        options={{ title: 'Inicio', headerShown: false }}
      />
      <HomeStack.Screen name="HomeDetail" component={DetailScreen} options={{ title: 'Detalle' }} />
    </HomeStack.Navigator>
  );
}

/**
 * Nested stack for the News tab ("Noticias" in the UI).
 */
const NewsStack = createNativeStackNavigator<NewsStackParamList>();
function NewsStackNavigator() {
  return (
    <NewsStack.Navigator screenOptions={headerOptions}>
      <NewsStack.Screen
        name="NewsMain"
        component={NewsScreen}
        options={{ title: 'Noticias', headerShown: false }}
      />
      <NewsStack.Screen name="NewsDetail" component={DetailScreen} options={{ title: 'Detalle' }} />
    </NewsStack.Navigator>
  );
}

/**
 * Nested stack for the Posts tab ("Publicaciones" in the UI).
 */
const PostsStack = createNativeStackNavigator<PostsStackParamList>();
function PostsStackNavigator() {
  return (
    <PostsStack.Navigator screenOptions={headerOptions}>
      <PostsStack.Screen
        name="PostsMain"
        component={PostsScreen}
        options={{ title: 'Publicaciones', headerShown: false }}
      />
      <PostsStack.Screen name="PostsDetail" component={DetailScreen} options={{ title: 'Detalle' }} />
    </PostsStack.Navigator>
  );
}

/**
 * Nested stack for the Calendar tab ("Calendario" in the UI).
 */
const CalendarStack = createNativeStackNavigator<CalendarStackParamList>();
function CalendarStackNavigator() {
  return (
    <CalendarStack.Navigator screenOptions={headerOptions}>
      <CalendarStack.Screen
        name="CalendarMain"
        component={CalendarScreen}
        options={{ title: 'Calendario', headerShown: false }}
      />
      <CalendarStack.Screen
        name="CalendarDetail"
        component={DetailScreen}
        options={{ title: 'Detalle' }}
      />
    </CalendarStack.Navigator>
  );
}

/**
 * Nested stack for the Horario tab (personal schedule in the UI).
 */
const HorarioStack = createNativeStackNavigator<HorarioStackParamList>();
function HorarioStackNavigator() {
  return (
    <HorarioStack.Navigator screenOptions={headerOptions}>
      <HorarioStack.Screen
        name="HorarioMain"
        component={HorarioScreen}
        options={{ title: 'Horario', headerShown: false }}
      />
      <HorarioStack.Screen
        name="HorarioDetail"
        component={DetailScreen}
        options={{ title: 'Detalle' }}
      />
    </HorarioStack.Navigator>
  );
}

/**
 * Nested stack for the Schedule tab ("Tutorías" in the UI).
 */
const ScheduleStack = createNativeStackNavigator<ScheduleStackParamList>();
function ScheduleStackNavigator() {
  return (
    <ScheduleStack.Navigator screenOptions={headerOptions}>
      <ScheduleStack.Screen
        name="ScheduleMain"
        component={ScheduleScreen}
        options={{ title: 'Tutorías', headerShown: false }}
      />
      <ScheduleStack.Screen
        name="ScheduleDetail"
        component={DetailScreen}
        options={{ title: 'Detalle' }}
      />
    </ScheduleStack.Navigator>
  );
}

/**
 * Nested stack for the Alerts tab ("Alertas" in the UI).
 */
const AlertsStack = createNativeStackNavigator<AlertsStackParamList>();
function AlertsStackNavigator() {
  return (
    <AlertsStack.Navigator screenOptions={headerOptions}>
      <AlertsStack.Screen
        name="AlertsMain"
        component={AlertsScreen}
        options={{ title: 'Alertas', headerShown: false }}
      />
      <AlertsStack.Screen
        name="AlertsDetail"
        component={DetailScreen}
        options={{ title: 'Detalle' }}
      />
    </AlertsStack.Navigator>
  );
}

/**
 * Nested stack for the Profile tab ("Perfil" in the UI).
 */
const ProfileStack = createNativeStackNavigator<ProfileStackParamList>();
function ProfileStackNavigator() {
  return (
    <ProfileStack.Navigator screenOptions={headerOptions}>
      <ProfileStack.Screen
        name="ProfileMain"
        component={ProfileScreen}
        options={{ title: 'Perfil', headerShown: false }}
      />
      <ProfileStack.Screen
        name="ProfileDetail"
        component={DetailScreen}
        options={{ title: 'Detalle' }}
      />
    </ProfileStack.Navigator>
  );
}

/**
 * Builds a tab bar icon for a given Ionicons name pair.
 *
 * `activeIcon` is shown when the tab is focused and `inactiveIcon`
 * otherwise. The color is driven by React Navigation's active/inactive
 * tints already defined in `tabBarOptions`, so focused icons stand out
 * and inactive ones stay muted.
 */
function tabIcon(activeIcon: keyof typeof Ionicons.glyphMap, inactiveIcon: keyof typeof Ionicons.glyphMap) {
  return ({ focused, color, size }: { focused: boolean; color: string; size: number }) => (
    <Ionicons name={focused ? activeIcon : inactiveIcon} color={color} size={size} />
  );
}

/**
 * Bottom Tab Navigator — the app's main sections.
 *
 * Each tab hosts its own stack navigator so sub-screens / detail views
 * can be pushed on top of the tab's main screen while the tab bar stays
 * visible. Tab labels shown to the user are in Spanish; code and names
 * stay in English.
 */
export function TabNavigator() {
  return (
    <Tab.Navigator screenOptions={tabBarOptions}>
      <Tab.Screen
        name="HomeTab"
        component={HomeStackNavigator}
        options={{ title: 'Inicio', tabBarIcon: tabIcon('home', 'home-outline') }}
      />
      <Tab.Screen
        name="NewsTab"
        component={NewsStackNavigator}
        options={{ title: 'Noticias', tabBarIcon: tabIcon('newspaper', 'newspaper-outline') }}
      />
      <Tab.Screen
        name="PostsTab"
        component={PostsStackNavigator}
        options={{ title: 'Publicaciones', tabBarIcon: tabIcon('albums', 'albums-outline') }}
      />
      <Tab.Screen
        name="CalendarTab"
        component={CalendarStackNavigator}
        options={{ title: 'Calendario', tabBarIcon: tabIcon('calendar', 'calendar-outline') }}
      />
      <Tab.Screen
        name="HorarioTab"
        component={HorarioStackNavigator}
        options={{ title: 'Horario', tabBarIcon: tabIcon('time', 'time-outline') }}
      />
      <Tab.Screen
        name="ScheduleTab"
        component={ScheduleStackNavigator}
        options={{ title: 'Tutorías', tabBarIcon: tabIcon('school', 'school-outline') }}
      />
      <Tab.Screen
        name="AlertsTab"
        component={AlertsStackNavigator}
        options={{ title: 'Alertas', tabBarIcon: tabIcon('notifications', 'notifications-outline') }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileStackNavigator}
        options={{ title: 'Perfil', tabBarIcon: tabIcon('person', 'person-outline') }}
      />
    </Tab.Navigator>
  );
}
