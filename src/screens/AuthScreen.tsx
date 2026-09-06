import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Colors, Fonts } from '../navigation/theme';
import type { RootStackParamList } from '../navigation/types';
import { supabase } from '../services/supabase';

type AuthScreenProps = NativeStackScreenProps<RootStackParamList, 'Auth'>;

type Mode = 'login' | 'register';

/**
 * Welcome / authentication screen.
 *
 * Two modes toggled at the bottom:
 *   • Iniciar sesión — signInWithPassword
 *   • Registrarse    — signUp (sends confirmation email)
 *
 * On mount, if a session already exists the user goes straight to the tabs.
 */
export function AuthScreen({ navigation }: AuthScreenProps) {
  const [mode, setMode] = useState<Mode>('login');
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
    if (!email.trim() || !password) {
      Alert.alert('Campos requeridos', 'Ingresa tu correo y tu contraseña.');
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setSubmitting(false);
    if (error) {
      Alert.alert('Error al iniciar sesión', error.message);
      return;
    }
    enterApp();
  };

  const handleSignUp = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Campos requeridos', 'Ingresa tu correo y una contraseña.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Contraseña muy corta', 'La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
    });
    setSubmitting(false);
    if (error) {
      Alert.alert('Error al registrarse', error.message);
      return;
    }
    Alert.alert(
      'Cuenta creada',
      'Revisa tu correo para confirmar el registro. Luego inicia sesión.'
    );
    setMode('login');
  };

  const handleSubmit = () => {
    if (mode === 'login') {
      handleSignIn();
    } else {
      handleSignUp();
    }
  };

  const isLogin = mode === 'login';

  return (
    <ImageBackground
      source={require('../../assets/logo-konrad-color.png')}
      resizeMode="center"
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
          <Text style={styles.brand}>Kon-Privacidad</Text>
          <Text style={styles.subtitle}>Tu red social privada universitaria</Text>

          <View style={styles.card}>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="Correo institucional"
              placeholderTextColor={Colors.subtitle}
              autoCapitalize="none"
              keyboardType="email-address"
              editable={!submitting}
            />
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="Contraseña"
              placeholderTextColor={Colors.subtitle}
              secureTextEntry
              editable={!submitting}
            />

            <Pressable
              onPress={handleSubmit}
              disabled={submitting}
              style={({ pressed }) => [
                styles.submitBtn,
                pressed && styles.submitBtnPressed,
                submitting && styles.submitBtnDisabled,
              ]}
            >
              {submitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.submitLabel}>
                  {isLogin ? 'Iniciar sesión' : 'Registrarse'}
                </Text>
              )}
            </Pressable>
          </View>

          <Pressable onPress={() => setMode(isLogin ? 'register' : 'login')}>
            <Text style={styles.toggle}>
              {isLogin
                ? '¿No tienes cuenta? Regístrate aquí'
                : '¿Ya tienes cuenta? Inicia sesión'}
            </Text>
          </Pressable>
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
    backgroundColor: 'rgba(219, 1, 96, 0.88)',
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
    width: 240,
    height: 100,
    alignSelf: 'center',
  },
  brand: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 12,
    fontFamily: Fonts.family,
  },
  subtitle: {
    color: 'rgba(255, 255, 255, 0.88)',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 28,
    fontFamily: Fonts.family,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 20,
    gap: 12,
  },
  input: {
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    paddingVertical: 13,
    paddingHorizontal: 14,
    fontSize: 16,
    color: Colors.text,
    fontFamily: Fonts.family,
  },
  submitBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  submitBtnPressed: {
    opacity: 0.8,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: Fonts.family,
  },
  toggle: {
    color: '#FFFFFF',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 20,
    textDecorationLine: 'underline',
    fontFamily: Fonts.family,
  },
});