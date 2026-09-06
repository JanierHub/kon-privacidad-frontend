import Ionicons from '@expo/vector-icons/Ionicons';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useState } from 'react';
import { Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '../components/AppButton';
import { Colors, Fonts } from '../navigation/theme';
import { supabase } from '../services/supabase';

export function ProfileScreen({ navigation }: any) {
  const [userId, setUserId] = useState('');
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('user');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [lastSignIn, setLastSignIn] = useState('');
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      setUserId(data.user?.id ?? '');
      setEmail(data.user?.email ?? '');
      const meta = data.user?.user_metadata;
      setFullName(meta?.full_name ?? '');
      setRole(meta?.role ?? 'user');
      setLastSignIn(meta?.last_sign_in ?? '');
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, avatar_url')
        .eq('id', data.user?.id)
        .single();
      if (profile?.role) {
        setRole(profile.role);
      }
      if (profile?.avatar_url) {
        setAvatarUrl(profile.avatar_url);
      }
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

  const changePhoto = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permiso requerido', 'Necesitas permitir el acceso a tus fotos.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
      base64: true,
    });
    if (result.canceled || !result.assets?.[0]?.base64 || !userId) {
      return;
    }
    setUploading(true);
    try {
      const { base64 } = result.assets[0];
      const folder = `avatars/${userId}`;
      const fileName = `avatar-${Date.now()}.jpg`;
      const path = `${folder}/${fileName}`;
      const { error: upErr } = await supabase.storage
        .from('avatars')
        .upload(path, decode(base64), {
          contentType: 'image/jpeg',
          upsert: true,
        });
      if (upErr) {
        Alert.alert('Error', upErr.message);
        return;
      }
      const { data: pub } = supabase.storage.from('avatars').getPublicUrl(path);
      const url = pub?.publicUrl ?? '';
      await supabase.from('profiles').update({ avatar_url: url }).eq('id', userId);
      setAvatarUrl(url);
      const { data: files } = await supabase.storage.from('avatars').list(userId);
      if (files?.length) {
        const oldFiles = files
          .filter((f) => f.name !== fileName && (f.metadata?.mimetype ?? '').startsWith('image'))
          .map((f) => `${folder}/${f.name}`);
        if (oldFiles.length) {
          await supabase.storage.from('avatars').remove(oldFiles).catch(() => {});
        }
      }
      Alert.alert('Foto guardada', 'Tu foto de perfil fue actualizada.');
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'No se pudo subir la foto.');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Eliminar cuenta',
      'Esta acción es permanente: se eliminará tu cuenta, tus publicaciones y tus datos. ¿Deseas continuar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              const { error } = await supabase.functions.invoke('delete-account', { body: {} });
              if (error) {
                Alert.alert('Error', error.message);
                return;
              }
              await supabase.auth.signOut();
              navigation.getParent()?.getParent()?.navigate('Auth');
            } catch (e: any) {
              Alert.alert('Error', e.message ?? 'No se pudo eliminar la cuenta.');
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
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
      <View style={styles.avatarBox}>
        {avatarUrl ? (
          <Image source={{ uri: avatarUrl }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Text style={styles.avatarText}>{fullName ? fullName[0].toUpperCase() : email[0]?.toUpperCase()}</Text>
          </View>
        )}
        <View style={styles.photoBtn}>
          <AppButton label={uploading ? 'Subiendo...' : 'Cambiar foto'} variant="secondary" fit onPress={changePhoto} loading={uploading} />
        </View>
      </View>
      <Text style={styles.name}>{fullName || 'Sin nombre'}</Text>
      <Text style={styles.email}>{email}</Text>
      {role === 'admin' && <Text style={styles.role}>Administrador</Text>}

      {lastSignIn ? (
        <Text style={styles.lastSignIn}>Último ingreso: {lastSignIn}</Text>
      ) : null}

      <View style={styles.divider} />

      <View style={styles.panel}>
        {role === 'admin' && (
          <>
            <Pressable style={styles.panelRow} onPress={goAdmin}>
              <Ionicons name="shield-checkmark-outline" size={20} color={Colors.primary} />
              <Text style={[styles.panelText, styles.panelTextPrimary]}>Panel de Administración</Text>
              <Ionicons name="chevron-forward" size={18} color={Colors.subtitle} />
            </Pressable>
            <View style={styles.panelSeparator} />
          </>
        )}
        <Pressable style={styles.panelRow} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color={Colors.primary} />
          <Text style={styles.panelText}>Cerrar sesión</Text>
          <Ionicons name="chevron-forward" size={18} color={Colors.subtitle} />
        </Pressable>
        <View style={styles.panelSeparator} />
        <Pressable style={styles.panelRow} onPress={handleDeleteAccount}>
          <Ionicons name="trash-outline" size={20} color={Colors.danger} />
          <Text style={[styles.panelText, styles.panelTextDanger]}>Eliminar cuenta</Text>
          <Ionicons name="chevron-forward" size={18} color={Colors.subtitle} />
        </Pressable>
      </View>
    </View>
  );
}

function decode(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, paddingHorizontal: 24, paddingTop: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
  placeholder: { color: Colors.subtitle, fontFamily: Fonts.family },
  avatarBox: { alignItems: 'center', justifyContent: 'center' },
  avatar: { width: 96, height: 96, borderRadius: 48, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center' },
  avatarPlaceholder: {},
  avatarText: { color: '#FFFFFF', fontSize: 36, fontWeight: '700', fontFamily: Fonts.family },
  photoBtn: { marginTop: 12 },
  name: { fontSize: 20, fontWeight: '600', color: Colors.text, textAlign: 'center', marginTop: 16, fontFamily: Fonts.family },
  email: { fontSize: 14, color: Colors.subtitle, textAlign: 'center', marginTop: 4, fontFamily: Fonts.family },
  role: { fontSize: 13, color: Colors.primary, textAlign: 'center', marginTop: 6, fontWeight: '600', fontFamily: Fonts.family },
  lastSignIn: { fontSize: 12, color: Colors.subtitle, textAlign: 'center', marginTop: 8, fontStyle: 'italic', fontFamily: Fonts.family },
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: 24 },
  panel: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: Colors.card,
  },
  panelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  panelSeparator: { height: 1, backgroundColor: Colors.border },
  panelText: { flex: 1, fontSize: 16, color: Colors.text, fontFamily: Fonts.family },
  panelTextPrimary: { color: Colors.primary, fontWeight: '600' },
  panelTextDanger: { color: Colors.danger, fontWeight: '600' },
});