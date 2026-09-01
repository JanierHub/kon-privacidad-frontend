import Ionicons from '@expo/vector-icons/Ionicons';
import { NavigationContainer } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { RootNavigator } from './src/navigation/RootNavigator';
import { navigationTheme } from './src/navigation/theme';

/**
 * App root component.
 *
 * Wraps the navigation tree with the providers it needs:
 * - useFonts: explicitly loads the Ionicons font used by the tab bar so
 *   icons render correctly instead of showing empty squares.
 * - SafeAreaProvider: supplies safe-area metrics to React Navigation.
 * - NavigationContainer: mounts the nav tree and applies our theme.
 *
 * The navigation renders only once the icon font is loaded to avoid a
 * brief flash of broken/blank icons on first mount.
 */
export default function App() {
  const [fontsLoaded] = useFonts({ ...Ionicons.font });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer theme={navigationTheme}>
        <StatusBar style="auto" />
        <RootNavigator />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
