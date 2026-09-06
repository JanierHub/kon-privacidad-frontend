import { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { AppButton } from '../components/AppButton';
import { Colors, Fonts } from '../navigation/theme';
import type { RootStackParamList } from '../navigation/types';
import { supabase } from '../services/supabase';

type AuthScreenProps = NativeStackScreenProps<RootStackParamList, 'Auth'>;

/**
 * Welcome / authentication screen — first screen shown on launch.
 *
 * Shows the Konrad Lorenz branding over an image background and a real
 * email + password form backed by Supabase: "Iniciar sesión" calls
 * signInWithPassword and "Registrarse" calls signUp. Once a session
 * exists the user is sent to the tabbed app.
 */
export function AuthScreen({ navigation }: AuthScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const enterApp = () =>
    navigation.navigate('MainTabs', { screen: 'HomeTab', params: { screen: 'HomeMain' } });

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        enterApp();
      }
    });
  }, []);

  const handleSignIn = async () => {
    if (!email || !password) {
      Alert.alert('Campos requeridos', 'Ingresa tu correo y tu contraseña.');
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setSubmitting(false);
    if (error) {
      Alert.alert('Error al iniciar sesión', error.message);
      return;
    }
    enterApp();
  };

  const handleSignUp = async () => {
    if (!email || !password) {
      Alert.alert('Campos requeridos', 'Ingresa tu correo y una contraseña.');
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.auth.signUp({ email, password });
    setSubmitting(false);
    if (error) {
      Alert.alert('Error al registrarse', error.message);
      return;
    }
    Alert.alert(
      'Registro creado',
      'Revisa tu correo para confirmar el registro y luego inicia sesión.'
    );
  };

  return (
    <ImageBackground
      source={require('../../assets/logo-konrad-color.png')}
      resizeMode="cover"
      style={styles.background}
    >
      <View style={styles.overlay} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.container}>
          <Image
            source={require('../../assets/logo-konrad-blanco.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.brand}>konprivacidad</Text>
          <Text style={styles.subtitle}>Tu red social privada universitaria</Text>

          <View style={styles.form}>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="Correo institucional"
              placeholderTextColor={Colors.subtitle}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="Contraseña"
              placeholderTextColor={Colors.subtitle}
              secureTextEntry
            />
          </View>

          <View style={styles.actions}>
            <AppButton label="Iniciar sesión" onPress={handleSignIn} loading={submitting} />
            <AppButton
              label="Registrarse"
              variant="secondary"
              onPress={handleSignUp}
              loading={submitting}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(58, 26, 110, 0.82)',
  },
  flex: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  logo: {
    width: 220,
    height: 90,
    alignSelf: 'center',
  },
  brand: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 8,
    fontFamily: Fonts.family,
  },
  subtitle: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 15,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 32,
    fontFamily: Fonts.family,
  },
  form: {
    gap: 12,
    marginBottom: 16,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    color: Colors.text,
    fontFamily: Fonts.family,
  },
  actions: {
    gap: 12,
  },
});