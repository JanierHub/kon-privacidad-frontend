import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StyleSheet, Text, View } from 'react-native';

import { AppButton } from '../components/AppButton';
import { Colors, Fonts } from '../navigation/theme';
import type { RootStackParamList } from '../navigation/types';

type AuthScreenProps = NativeStackScreenProps<RootStackParamList, 'Auth'>;

/**
 * Welcome / authentication screen — first screen shown on launch.
 *
 * Renders the app brand plus "Iniciar sesión" and "Registrarse" buttons.
 * For now both buttons just enter the tabbed app as a stand-in, since
 * there is no real authentication logic yet.
 */
export function AuthScreen({ navigation }: AuthScreenProps) {
  const enterApp = () =>
  navigation.navigate('MainTabs', { screen: 'HomeTab', params: { screen: 'HomeMain' } });

  return (
    <View style={styles.container}>
      <Text style={styles.brand}>konprivacidad</Text>
      <Text style={styles.subtitle}>Tu red social privada universitaria</Text>

      <View style={styles.actions}>
        <AppButton label="Iniciar sesión" onPress={enterApp} />
        <AppButton label="Registrarse" variant="secondary" onPress={enterApp} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  brand: {
    color: Colors.primary,
    fontSize: 32,
    fontWeight: '700',
    textAlign: 'center',
    fontFamily: Fonts.family,
  },
  subtitle: {
    color: Colors.subtitle,
    fontSize: 15,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 40,
    fontFamily: Fonts.family,
  },
  actions: {
    gap: 12,
  },
});