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
 *   • Registrar     — signUp, then a verification code sent by email
 *                     must be entered ("send-verification-code" / "verify-verification-code").
 */
export function AuthScreen({ navigation }: AuthScreenProps) {
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [verifying, setVerifying] = useState(false);
  const [code, setCode] = useState('');
  const [sendingCode, setSendingCode] = useState(false);

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
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setSubmitting(false);
    if (error) {
      Alert.alert('Error al iniciar sesión', error.message);
      return;
    }
    if (data.user) {
      const now = new Date().toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' });
      await supabase.auth.updateUser({ data: { last_sign_in: now } });
      supabase.functions.invoke('send-login-notification', {
        body: {
          user_id: data.user.id,
          email: data.user.email,
          full_name: data.user.user_metadata?.full_name ?? '',
          sign_in_time: now,
        },
      }).catch(() => {});
    }
    enterApp();
  };

  const sendCode = async () => {
    setSendingCode(true);
    try {
      const { error } = await supabase.functions.invoke('send-verification-code', {
        body: { email: email.trim() },
      });
      if (error) {
        Alert.alert('Error', error.message);
        return false;
      }
      return true;
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'No se pudo enviar el código.');
      return false;
    } finally {
      setSendingCode(false);
    }
  };

  const handleSignUp = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Campos requeridos', 'Ingresa tu correo y una contraseña.');
      return;
    }
    if (!email.trim().endsWith('@konradlorenz.edu.co')) {
      Alert.alert(
        'Correo no válido',
        'Solo se permiten correos institucionales @konradlorenz.edu.co'
      );
      return;
    }
    if (password.length < 6) {
      Alert.alert('Contraseña muy corta', 'La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    setSubmitting(true);
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
    });
    setSubmitting(false);
    if (error) {
      Alert.alert('Error al registrarse', error.message);
      return;
    }
    if (data.session) {
      enterApp();
      return;
    }
    const sent = await sendCode();
    if (sent) {
      setCode('');
      setVerifying(true);
    }
  };

  const handleVerify = async () => {
    if (code.trim().length < 4) {
      Alert.alert('Código requerido', 'Ingresa el código que llegó a tu correo.');
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.functions.invoke('verify-verification-code', {
      body: { email: email.trim(), code: code.trim() },
    });
    setSubmitting(false);
    if (error) {
      Alert.alert('Código inválido', error.message);
      return;
    }
    setVerifying(false);
    setMode('login');
    Alert.alert(
      'Correo confirmado',
      'Tu registro fue confirmado correctamente. Ahora puedes iniciar sesión.'
    );
  };

  const handleSubmit = () => {
    if (isLoginForm) {
      handleSignIn();
    } else {
      handleSignUp();
    }
  };

  const isLoginForm = !verifying && mode === 'login';
  const isRegisterForm = !verifying && mode === 'register';

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
          <Text style={styles.subtitle}>
            {verifying
              ? 'Confirma tu registro'
              : isLoginForm
                ? 'Inicia sesión en tu cuenta'
                : 'Crea tu cuenta universitaria'}
          </Text>

          {verifying ? (
            <View style={styles.card}>
              <Text style={styles.cardHint}>
                Enviamos un código de 6 dígitos a{' '}
                <Text style={styles.cardHintAccent}>{email}</Text>. Escríbelo aquí:
              </Text>
              <TextInput
                style={[styles.input, styles.codeInput]}
                value={code}
                onChangeText={setCode}
                placeholder="Código"
                placeholderTextColor={Colors.subtitle}
                keyboardType="number-pad"
                maxLength={6}
                editable={!submitting}
              />
              <Pressable
                onPress={handleVerify}
                disabled={submitting}
                style={({ pressed }) => [
                  styles.submitBtn,
                  styles.registerBtn,
                  pressed && styles.submitBtnPressed,
                  submitting && styles.submitBtnDisabled,
                ]}
              >
                {submitting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitLabel}>Confirmar registro</Text>
                )}
              </Pressable>
              <Pressable
                onPress={async () => { await sendCode(); }}
                disabled={sendingCode}
                style={styles.linkBtn}
              >
                <Text style={styles.linkText}>
                  {sendingCode ? 'Enviando...' : 'Reenviar código'}
                </Text>
              </Pressable>
              <Pressable onPress={() => setVerifying(false)} style={styles.linkBtn}>
                <Text style={styles.linkText}>Cambiar correo</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.card}>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder={mode === 'login' ? 'Correo institucional' : 'Correo @konradlorenz.edu.co'}
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
                  mode === 'register' && styles.registerBtn,
                  pressed && styles.submitBtnPressed,
                  submitting && styles.submitBtnDisabled,
                ]}
              >
                {submitting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitLabel}>
                    {mode === 'login' ? 'Iniciar sesión' : 'Registrar'}
                  </Text>
                )}
              </Pressable>

              {mode === 'register' && (
                <Text style={styles.hint}>
                  Al registrarte se crea tu cuenta y se envía un código de confirmación a tu correo.
                </Text>
              )}
            </View>
          )}

          {!verifying && (
            <Pressable onPress={() => setMode(mode === 'login' ? 'register' : 'login')}>
              <Text style={styles.toggle}>
                {mode === 'login'
                  ? '¿No tienes cuenta? Regístrate aquí'
                  : '¿Ya tienes cuenta? Inicia sesión'}
              </Text>
            </Pressable>
          )}
        </View>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1 },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(26, 115, 232, 0.88)',
  },
  flex: { flex: 1 },
  container: { flex: 1, justifyContent: 'center', paddingHorizontal: 24 },
  logo: { width: 240, height: 100, alignSelf: 'center' },
  brand: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 12,
    fontFamily: Fonts.family,
  },
  subtitle: {
    color: 'rgba(255, 255, 255, 0.92)',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 28,
    fontFamily: Fonts.family,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.97)',
    borderRadius: 16,
    padding: 20,
    gap: 12,
  },
  cardHint: { fontSize: 13, color: Colors.subtitle, lineHeight: 18, fontFamily: Fonts.family },
  cardHintAccent: { color: Colors.primary, fontWeight: '600' },
  input: {
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    paddingVertical: 13,
    paddingHorizontal: 14,
    fontSize: 16,
    color: Colors.text,
    fontFamily: Fonts.family,
  },
  codeInput: { textAlign: 'center', fontSize: 22, letterSpacing: 8 },
  submitBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  registerBtn: { backgroundColor: Colors.dark },
  submitBtnPressed: { opacity: 0.8 },
  submitBtnDisabled: { opacity: 0.6 },
  submitLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    fontFamily: Fonts.family,
  },
  linkBtn: { alignItems: 'center', paddingVertical: 6 },
  linkText: { color: Colors.primary, fontSize: 14, textDecorationLine: 'underline', fontFamily: Fonts.family },
  hint: { fontSize: 12, color: Colors.subtitle, textAlign: 'center', fontFamily: Fonts.family },
  toggle: {
    color: '#FFFFFF',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 20,
    textDecorationLine: 'underline',
    fontFamily: Fonts.family,
  },
});