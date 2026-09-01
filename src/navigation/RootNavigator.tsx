import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { TabNavigator } from './TabNavigator';
import type { RootStackParamList } from './types';

const RootStack = createNativeStackNavigator<RootStackParamList>();

/**
 * Root Stack Navigator — the entry point of the navigation tree.
 *
 * It currently renders a single screen that contains the bottom tab
 * navigator. Keeping a root stack as the top-level navigator gives us a
 * natural place to later add full-screen flows above the tabs, such as
 * authentication, onboarding, or modal screens.
 */
export function RootNavigator() {
  return (
    <RootStack.Navigator screenOptions={{ headerShown: false }}>
      <RootStack.Screen name="MainTabs" component={TabNavigator} />
    </RootStack.Navigator>
  );
}
