import Ionicons from '@expo/vector-icons/Ionicons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors, Fonts } from '../navigation/theme';
import type { RootStackParamList } from '../navigation/types';
import { supabase } from '../services/supabase';

type Tab = 'posts' | 'users' | 'events' | 'schedule';

// ---------- Sub-components for each admin section ----------

type MediaAsset = {
  type: 'image' | 'video';
  base64: string;
  fileName: string;
  mimeType: string;
} | null;

function decode(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function PostsSection({ onRefresh }: { onRefresh: () => void }) {
  const [posts, setPosts] = useState<any[]>([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [media, setMedia] = useState<MediaAsset>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const { data } = await supabase
      .from('posts').select('id, title, media_url, media_type, is_hidden, created_at, profiles(full_name)')
      .order('created_at', { ascending: false }).limit(50);
    setPosts(data ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const pickMedia = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permiso requerido', 'Necesitas permitir el acceso a tu galería.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      quality: 0.7,
      base64: true,
    });
    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    const isVideo = (asset.type ?? (asset.mimeType ?? '').startsWith('video')) === 'video';
    if (!asset.base64) {
      Alert.alert('Error', 'No se pudo leer el archivo seleccionado.');
      return;
    }
    setMedia({
      type: isVideo ? 'video' : 'image',
      base64: asset.base64,
      fileName: asset.fileName ?? `media-${Date.now()}`,
      mimeType: asset.mimeType ?? (isVideo ? 'video/mp4' : 'image/jpeg'),
    });
  };

  const addPost = async () => {
    if (!title.trim()) return;
    setUploading(true);
    try {
      const { data: u } = await supabase.auth.getUser();
      const userId = u.user?.id;
      let mediaUrl = null;
      let mediaType = null;

      if (media) {
        const ext = media.mimeType.split('/')[1]?.split(';')[0] || 'jpg';
        const fileName = `post-${Date.now()}-${Math.round(Math.random() * 1000)}.${ext}`;
        const path = `${userId}/${fileName}`;
        const { error: upErr } = await supabase.storage
          .from('posts-media')
          .upload(path, decode(media.base64), {
            contentType: media.mimeType,
            upsert: true,
          });
        if (upErr) {
          Alert.alert('Error al subir', upErr.message);
          return;
        }
        const { data: pub } = supabase.storage.from('posts-media').getPublicUrl(path);
        mediaUrl = pub?.publicUrl ?? null;
        mediaType = media.type;
      }

      await supabase.from('posts').insert({
        user_id: userId,
        title: title.trim(),
        content: content.trim(),
        media_url: mediaUrl,
        media_type: mediaType,
      });
      setTitle(''); setContent(''); setMedia(null);
      Alert.alert('Publicación creada', 'Tu publicación fue creada correctamente.');
      load(); onRefresh();
    } finally {
      setUploading(false);
    }
  };

  const toggleHidden = async (id: string, current: boolean) => {
    await supabase.from('posts').update({ is_hidden: !current }).eq('id', id);
    load(); onRefresh();
  };

  const deletePost = async (id: string) => {
    Alert.alert('Eliminar', '¿Eliminar publicación?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: async () => { await supabase.from('posts').delete().eq('id', id); load(); onRefresh(); } },
    ]);
  };

  if (loading) return <Text style={styles.placeholder}>Cargando publicaciones...</Text>;

  return (
    <View style={{ gap: 8 }}>
      <TextInput style={styles.input} placeholder="Título" placeholderTextColor={Colors.subtitle} value={title} onChangeText={setTitle} editable={!uploading} />
      <TextInput style={styles.input} placeholder="Contenido" placeholderTextColor={Colors.subtitle} value={content} onChangeText={setContent} multiline editable={!uploading} />

      <Pressable style={styles.mediaBtn} onPress={pickMedia} disabled={uploading}>
        <Ionicons name={media ? 'attach' : 'image-outline'} size={18} color={Colors.primary} />
        <Text style={styles.mediaBtnText}>
          {media ? `Adjunto: ${media.fileName}` : 'Adjuntar foto o video'}
        </Text>
      </Pressable>
      {media?.type === 'image' ? (
        <Image source={{ uri: `data:${media.mimeType};base64,${media.base64}` }} style={styles.mediaPreview} resizeMode="cover" />
      ) : null}
      {media ? (
        <Pressable onPress={() => setMedia(null)} style={styles.removeMedia}>
          <Ionicons name="close-circle" size={18} color={Colors.danger} />
          <Text style={{ color: Colors.danger, fontSize: 13 }}>Quitar adjunto</Text>
        </Pressable>
      ) : null}

      <Pressable style={styles.addBtn} onPress={addPost} disabled={uploading}>
        <Text style={styles.addBtnText}>{uploading ? 'Creando...' : 'Crear publicación'}</Text>
      </Pressable>
      {posts.map((p) => (
        <View key={p.id} style={styles.item}>
          <View style={{ flex: 1 }}>
            <Text style={styles.itemTitle}>{p.title} {p.is_hidden ? '(oculto)' : ''} {p.media_url ? (p.media_type === 'video' ? '🎬' : '🖼️') : ''}</Text>
            <Text style={styles.itemMeta}>{p.profiles?.full_name} · {new Date(p.created_at).toLocaleDateString()}</Text>
          </View>
          <Pressable onPress={() => toggleHidden(p.id, p.is_hidden)} style={styles.actionBtn}>
            <Text style={{ color: Colors.primary, fontSize: 12 }}>{p.is_hidden ? 'Mostrar' : 'Ocultar'}</Text>
          </Pressable>
          <Pressable onPress={() => deletePost(p.id)} style={styles.actionBtn}>
            <Ionicons name="trash-outline" size={18} color={Colors.danger} />
          </Pressable>
        </View>
      ))}
    </View>
  );
}

function UsersSection() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);

  const load = async () => {
    const { data } = await supabase.from('profiles').select('id, email, full_name, role, is_banned').order('created_at', { ascending: false });
    setUsers(data ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const createAdmin = async () => {
    if (!newEmail.trim() || !newPassword.trim()) {
      Alert.alert('Campos requeridos', 'Ingresa el correo y la contraseña del nuevo administrador.');
      return;
    }
    if (newPassword.trim().length < 6) {
      Alert.alert('Contraseña muy corta', 'La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    setCreating(true);
    try {
      const { error } = await supabase.functions.invoke('create-admin-user', {
        body: { email: newEmail.trim(), password: newPassword.trim(), full_name: newName.trim() },
      });
      if (error) {
        Alert.alert('Error', error.message);
      } else {
        Alert.alert('Administrador creado', `${newEmail.trim()} ahora es administrador.`);
        setNewEmail(''); setNewPassword(''); setNewName('');
        load();
      }
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'No se pudo crear el usuario.');
    } finally {
      setCreating(false);
    }
  };

  const toggleBan = async (id: string, current: boolean) => {
    await supabase.from('profiles').update({ is_banned: !current }).eq('id', id);
    load();
  };

  const toggleRole = async (id: string, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    await supabase.from('profiles').update({ role: newRole }).eq('id', id);
    load();
  };

  const deleteUser = async (id: string, email: string) => {
    Alert.alert(
      'Eliminar cuenta',
      `¿Eliminar la cuenta de ${email}? Esta acción es permanente: se borrarán también sus publicaciones y datos.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            const { error } = await supabase.functions.invoke('delete-account', {
              body: { target_id: id },
            });
            if (error) {
              Alert.alert('Error', error.message);
            }
            load();
          },
        },
      ]
    );
  };

  if (loading) return <Text style={styles.placeholder}>Cargando usuarios...</Text>;

  return (
    <View style={{ gap: 8 }}>
      <View style={styles.createBox}>
        <Text style={styles.createTitle}>Crear administrador</Text>
        <TextInput style={styles.input} placeholder="Correo @konradlorenz.edu.co" placeholderTextColor={Colors.subtitle} value={newEmail} onChangeText={setNewEmail} autoCapitalize="none" editable={!creating} />
        <TextInput style={styles.input} placeholder="Nombre completo" placeholderTextColor={Colors.subtitle} value={newName} onChangeText={setNewName} editable={!creating} />
        <TextInput style={styles.input} placeholder="Contraseña" placeholderTextColor={Colors.subtitle} value={newPassword} onChangeText={setNewPassword} secureTextEntry editable={!creating} />
        <Pressable style={styles.addBtn} onPress={createAdmin} disabled={creating}>
          <Text style={styles.addBtnText}>{creating ? 'Creando...' : 'Crear usuario admin'}</Text>
        </Pressable>
      </View>

      {users.map((u) => (
        <View key={u.id} style={styles.item}>
          <View style={{ flex: 1 }}>
            <Text style={styles.itemTitle}>{u.full_name || u.email}</Text>
            <Text style={styles.itemMeta}>{u.email} · {u.role} {u.is_banned ? 'BLOQUEADO' : ''}</Text>
          </View>
          <Pressable onPress={() => toggleRole(u.id, u.role)} style={styles.actionBtn}>
            <Text style={{ color: Colors.primary, fontSize: 11 }}>{u.role === 'admin' ? 'Quitar admin' : 'Hacer admin'}</Text>
          </Pressable>
          <Pressable onPress={() => toggleBan(u.id, u.is_banned)} style={styles.actionBtn}>
            <Text style={{ color: u.is_banned ? Colors.success : Colors.danger, fontSize: 11 }}>{u.is_banned ? 'Activar' : 'Bloquear'}</Text>
          </Pressable>
          <Pressable onPress={() => deleteUser(u.id, u.email)} style={styles.actionBtn}>
            <Ionicons name="trash-outline" size={18} color={Colors.danger} />
          </Pressable>
        </View>
      ))}
    </View>
  );
}

function EventsSection() {
  const [events, setEvents] = useState<any[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const { data } = await supabase.from('events').select('id, title, event_date, is_restricted').order('event_date', { ascending: false }).limit(50);
    setEvents(data ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const addEvent = async () => {
    if (!title.trim() || !eventDate.trim()) return;
    await supabase.from('events').insert({ title: title.trim(), description: description.trim(), event_date: eventDate.trim() });
    setTitle(''); setDescription(''); setEventDate('');
    load();
  };

  const toggleRestrict = async (id: string, current: boolean) => {
    await supabase.from('events').update({ is_restricted: !current }).eq('id', id);
    load();
  };

  const deleteEvent = async (id: string) => {
    Alert.alert('Eliminar', '¿Eliminar evento?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: async () => { await supabase.from('events').delete().eq('id', id); load(); } },
    ]);
  };

  if (loading) return <Text style={styles.placeholder}>Cargando eventos...</Text>;

  return (
    <View style={{ gap: 8 }}>
      <TextInput style={styles.input} placeholder="Título" placeholderTextColor={Colors.subtitle} value={title} onChangeText={setTitle} />
      <TextInput style={styles.input} placeholder="Descripción" placeholderTextColor={Colors.subtitle} value={description} onChangeText={setDescription} multiline />
      <TextInput style={styles.input} placeholder="Fecha (YYYY-MM-DD)" placeholderTextColor={Colors.subtitle} value={eventDate} onChangeText={setEventDate} />
      <Pressable style={styles.addBtn} onPress={addEvent}><Text style={styles.addBtnText}>Crear evento</Text></Pressable>
      {events.map((e) => (
        <View key={e.id} style={styles.item}>
          <View style={{ flex: 1 }}>
            <Text style={styles.itemTitle}>{e.title} {e.is_restricted ? '(restringido)' : ''}</Text>
            <Text style={styles.itemMeta}>{e.event_date}</Text>
          </View>
          <Pressable onPress={() => toggleRestrict(e.id, e.is_restricted)} style={styles.actionBtn}>
            <Text style={{ color: Colors.primary, fontSize: 11 }}>{e.is_restricted ? 'Hacer público' : 'Restringir'}</Text>
          </Pressable>
          <Pressable onPress={() => deleteEvent(e.id)} style={styles.actionBtn}>
            <Ionicons name="trash-outline" size={18} color={Colors.danger} />
          </Pressable>
        </View>
      ))}
    </View>
  );
}

// ---------- Schedule image section ----------

function ScheduleSection({ onRefresh }: { onRefresh: () => void }) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const { data } = await supabase
      .from('app_settings')
      .select('schedule_image_url')
      .eq('key', 'schedule_image')
      .single();
    setImageUrl(data?.schedule_image_url ?? null);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const pickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permiso requerido', 'Necesitas permitir el acceso a tu galería.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      base64: true,
    });
    if (result.canceled || !result.assets?.[0]?.base64) return;
    const asset = result.assets[0];
    const base64 = asset.base64!;
    setUploading(true);
    try {
      const ext = (asset.mimeType ?? 'image/jpeg').split('/')[1]?.split(';')[0] || 'jpg';
      const fileName = `schedule-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from('schedule-images')
        .upload(fileName, decode(base64), {
          contentType: asset.mimeType ?? 'image/jpeg',
          upsert: true,
        });
      if (upErr) {
        Alert.alert('Error al subir', upErr.message);
        return;
      }
      const { data: pub } = supabase.storage.from('schedule-images').getPublicUrl(fileName);
      const url = pub?.publicUrl ?? '';
      await supabase
        .from('app_settings')
        .upsert({ key: 'schedule_image', schedule_image_url: url }, { onConflict: 'key' });
      setImageUrl(url);
      Alert.alert('Guardado', 'Imagen del horario actualizada.');
      onRefresh();
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'No se pudo subir la imagen.');
    } finally {
      setUploading(false);
    }
  };

  const removeImage = async () => {
    Alert.alert('Quitar imagen', '¿Eliminar la imagen del horario?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Quitar',
        style: 'destructive',
        onPress: async () => {
          await supabase.from('app_settings').upsert({ key: 'schedule_image', schedule_image_url: null }, { onConflict: 'key' });
          setImageUrl(null);
          onRefresh();
        },
      },
    ]);
  };

  if (loading) return <Text style={styles.placeholder}>Cargando horario...</Text>;

  return (
    <View style={{ gap: 8 }}>
      <Text style={styles.createTitle}>Imagen general del horario</Text>
      <Text style={styles.itemMeta}>Sube una imagen del horario completo para que todos la vean junto a la lista de clases.</Text>
      {imageUrl ? (
        <>
          <Image source={{ uri: imageUrl }} style={styles.mediaPreview} resizeMode="contain" />
          <Pressable style={styles.addBtn} onPress={pickImage} disabled={uploading}>
            <Text style={styles.addBtnText}>{uploading ? 'Subiendo...' : 'Cambiar imagen'}</Text>
          </Pressable>
          <Pressable onPress={removeImage} style={{ alignItems: 'center', paddingVertical: 4 }}>
            <Text style={{ color: Colors.danger, fontSize: 14 }}>Quitar imagen</Text>
          </Pressable>
        </>
      ) : (
        <Pressable style={styles.mediaBtn} onPress={pickImage} disabled={uploading}>
          <Ionicons name="image-outline" size={18} color={Colors.primary} />
          <Text style={styles.mediaBtnText}>{uploading ? 'Subiendo...' : 'Subir imagen del horario'}</Text>
        </Pressable>
      )}
    </View>
  );
}

// ---------- Main Admin Panel ----------

type AdminScreenProps = NativeStackScreenProps<RootStackParamList, 'Admin'>;

export function AdminScreen({ navigation }: AdminScreenProps) {
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<Tab>('posts');
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color={Colors.primary} />
        </Pressable>
        <Text style={styles.headerTitle}>Panel de Administración</Text>
      </View>
      <View style={styles.tabs}>
        {(['posts', 'users', 'events', 'schedule'] as Tab[]).map((t) => (
          <Pressable key={t} onPress={() => setTab(t)} style={[styles.tab, tab === t && styles.tabActive]}>
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t === 'posts' ? 'Publicaciones' : t === 'users' ? 'Usuarios' : t === 'events' ? 'Eventos' : 'Horario'}
            </Text>
          </Pressable>
        ))}
      </View>
      <FlatList
        key={refreshKey}
        contentContainerStyle={{ padding: 16, gap: 8 }}
        data={[]}
        renderItem={() => null}
        refreshControl={<RefreshControl refreshing={false} onRefresh={() => setRefreshKey((k) => k + 1)} colors={[Colors.primary]} />}
        ListEmptyComponent={
          tab === 'posts' ? <PostsSection onRefresh={() => setRefreshKey((k) => k + 1)} /> :
          tab === 'users' ? <UsersSection /> :
          tab === 'events' ? <EventsSection /> :
          <ScheduleSection onRefresh={() => setRefreshKey((k) => k + 1)} />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingBottom: 8, backgroundColor: Colors.card },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: Colors.text, fontFamily: Fonts.family, marginLeft: 4 },
  tabs: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, paddingVertical: 4 },
  tab: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, backgroundColor: Colors.border },
  tabActive: { backgroundColor: Colors.primary },
  tabText: { fontSize: 13, fontWeight: '500', color: Colors.text, fontFamily: Fonts.family },
  tabTextActive: { color: '#FFFFFF' },
  placeholder: { color: Colors.subtitle, fontFamily: Fonts.family, textAlign: 'center', padding: 16 },
  input: { backgroundColor: '#F3F4F6', borderRadius: 10, paddingVertical: 12, paddingHorizontal: 14, fontSize: 14, color: Colors.text, fontFamily: Fonts.family },
  addBtn: { backgroundColor: Colors.primary, borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  addBtnText: { color: '#FFFFFF', fontWeight: '600', fontFamily: Fonts.family },
  item: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border, borderRadius: 10, padding: 12, gap: 8 },
  itemTitle: { fontSize: 14, fontWeight: '600', color: Colors.text, fontFamily: Fonts.family },
  itemMeta: { fontSize: 12, color: Colors.subtitle, marginTop: 2, fontFamily: Fonts.family },
  actionBtn: { paddingHorizontal: 8, paddingVertical: 4 },
  createBox: { backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.primary, borderRadius: 12, padding: 12, gap: 8, marginBottom: 8 },
  createTitle: { fontSize: 14, fontWeight: '700', color: Colors.primary, fontFamily: Fonts.family },
  mediaBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1.5, borderColor: Colors.primary, borderStyle: 'dashed', borderRadius: 10, paddingVertical: 12 },
  mediaBtnText: { color: Colors.primary, fontSize: 14, fontWeight: '600', fontFamily: Fonts.family },
  mediaPreview: { width: '100%', height: 180, borderRadius: 12, backgroundColor: Colors.border },
  removeMedia: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 4 },
});