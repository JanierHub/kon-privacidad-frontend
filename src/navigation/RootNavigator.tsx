import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { AdminScreen } from '../screens/AdminScreen';
import { AuthScreen } from '../screens/AuthScreen';
import { TabNavigator } from './TabNavigator';
import type { RootStackParamList } from './types';

const RootStack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  return (
    <RootStack.Navigator initialRouteName="Auth" screenOptions={{ headerShown: false }}>
      <RootStack.Screen name="Auth" component={AuthScreen} />
      <RootStack.Screen name="MainTabs" component={TabNavigator} />
      <RootStack.Screen
        name="Admin"
        component={AdminScreen}
        options={{ headerShown: true, title: 'Admin', headerTintColor: '#DB0160' }}
      />
    </RootStack.Navigator>
  );
}
