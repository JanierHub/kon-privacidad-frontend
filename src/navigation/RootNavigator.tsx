import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { AuthScreen } from '../screens/AuthScreen';
import { TabNavigator } from './TabNavigator';
import type { RootStackParamList } from './types';

const RootStack = createNativeStackNavigator<RootStackParamList>();

/**
 * Root Stack Navigator — the entry point of the navigation tree.
 *
 * Shows the welcome/auth screen on launch and the tabbed app after the
 * user "signs in". Keeping a root stack as the top-level navigator gives
 * us a natural place to later add full-screen flows above the tabs, such
 * as a real login, onboarding, or modal screens.
 */
export function RootNavigator() {
  return (
    <RootStack.Navigator initialRouteName="Auth" screenOptions={{ headerShown: false }}>
      <RootStack.Screen name="Auth" component={AuthScreen} />
      <RootStack.Screen name="MainTabs" component={TabNavigator} />
    </RootStack.Navigator>
  );
}
