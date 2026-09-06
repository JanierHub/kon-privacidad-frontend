import { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '../components/AppButton';
import { Colors, Fonts } from '../navigation/theme';
import { supabase } from '../services/supabase';

export function ProfileScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('user');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      setEmail(data.user?.email ?? '');
      const meta = data.user?.user_metadata;
      setFullName(meta?.full_name ?? '');
      setRole(meta?.role ?? 'user');
      setLoading(false);
    })();
  }, []);

  const handleLogout = () => {
    Alert.alert('Cerrar sesión', '¿Seguro que quieres salir?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Cerrar sesión',
        style: 'destructive',
        onPress: async () => {
          await supabase.auth.signOut();
          navigation.getParent()?.getParent()?.navigate('Auth');
        },
      },
    ]);
  };

  const goAdmin = () => {
    const rootNav = navigation.getParent();
    rootNav?.navigate('Admin');
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <Text style={styles.placeholder}>Cargando perfil...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{fullName ? fullName[0].toUpperCase() : email[0]?.toUpperCase()}</Text>
      </View>
      <Text style={styles.name}>{fullName || 'Sin nombre'}</Text>
      <Text style={styles.email}>{email}</Text>
      {role === 'admin' && <Text style={styles.role}>👑 Administrador</Text>}

      <View style={styles.divider} />

      {role === 'admin' && (
        <View style={{ marginBottom: 12 }}>
          <AppButton label="⚙️ Panel de Administración" onPress={goAdmin} />
        </View>
      )}

      <AppButton label="Cerrar sesión" variant="secondary" onPress={handleLogout} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: 24,
    paddingTop: 40,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  placeholder: { color: Colors.subtitle, fontFamily: Fonts.family },
  avatar: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.primary,
    justifyContent: 'center', alignItems: 'center', alignSelf: 'center',
  },
  avatarText: { color: '#FFFFFF', fontSize: 32, fontWeight: '700', fontFamily: Fonts.family },
  name: { fontSize: 20, fontWeight: '600', color: Colors.text, textAlign: 'center', marginTop: 16, fontFamily: Fonts.family },
  email: { fontSize: 14, color: Colors.subtitle, textAlign: 'center', marginTop: 4, fontFamily: Fonts.family },
  role: { fontSize: 13, color: Colors.primary, textAlign: 'center', marginTop: 6, fontWeight: '600', fontFamily: Fonts.family },
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: 24 },
});