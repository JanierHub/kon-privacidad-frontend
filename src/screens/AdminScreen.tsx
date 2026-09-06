import { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Colors, Fonts } from '../navigation/theme';
import { supabase } from '../services/supabase';

type Tab = 'posts' | 'users' | 'events';

// ---------- Sub-components for each admin section ----------

function PostsSection({ onRefresh }: { onRefresh: () => void }) {
  const [posts, setPosts] = useState<any[]>([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const { data } = await supabase
      .from('posts').select('id, title, is_hidden, created_at, profiles(full_name)')
      .order('created_at', { ascending: false }).limit(50);
    setPosts(data ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const addPost = async () => {
    if (!title.trim()) return;
    const { data: u } = await supabase.auth.getUser();
    await supabase.from('posts').insert({ user_id: u.user?.id, title: title.trim(), content: content.trim() });
    setTitle(''); setContent('');
    load(); onRefresh();
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

  if (loading) return <Text style={styles.placeholder}>Cargando posts...</Text>;

  return (
    <View style={{ gap: 8 }}>
      <TextInput style={styles.input} placeholder="Título" placeholderTextColor={Colors.subtitle} value={title} onChangeText={setTitle} />
      <TextInput style={styles.input} placeholder="Contenido" placeholderTextColor={Colors.subtitle} value={content} onChangeText={setContent} multiline />
      <Pressable style={styles.addBtn} onPress={addPost}><Text style={styles.addBtnText}>+ Publicar</Text></Pressable>
      {posts.map((p) => (
        <View key={p.id} style={styles.item}>
          <View style={{ flex: 1 }}>
            <Text style={styles.itemTitle}>{p.title} {p.is_hidden ? '(oculto)' : ''}</Text>
            <Text style={styles.itemMeta}>{p.profiles?.full_name} · {new Date(p.created_at).toLocaleDateString()}</Text>
          </View>
          <Pressable onPress={() => toggleHidden(p.id, p.is_hidden)} style={styles.actionBtn}>
            <Text style={{ color: Colors.primary, fontSize: 12 }}>{p.is_hidden ? '👁 Mostrar' : '🙈 Ocultar'}</Text>
          </Pressable>
          <Pressable onPress={() => deletePost(p.id)} style={styles.actionBtn}>
            <Text style={{ color: Colors.danger, fontSize: 12 }}>🗑</Text>
          </Pressable>
        </View>
      ))}
    </View>
  );
}

function UsersSection() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const { data } = await supabase.from('profiles').select('id, email, full_name, role, is_banned').order('created_at', { ascending: false });
    setUsers(data ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const toggleBan = async (id: string, current: boolean) => {
    await supabase.from('profiles').update({ is_banned: !current }).eq('id', id);
    load();
  };

  const toggleRole = async (id: string, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    await supabase.from('profiles').update({ role: newRole }).eq('id', id);
    load();
  };

  if (loading) return <Text style={styles.placeholder}>Cargando usuarios...</Text>;

  return (
    <View style={{ gap: 4 }}>
      {users.map((u) => (
        <View key={u.id} style={styles.item}>
          <View style={{ flex: 1 }}>
            <Text style={styles.itemTitle}>{u.full_name || u.email}</Text>
            <Text style={styles.itemMeta}>{u.email} · {u.role} {u.is_banned ? '🚫 BLOQUEADO' : ''}</Text>
          </View>
          <Pressable onPress={() => toggleRole(u.id, u.role)} style={styles.actionBtn}>
            <Text style={{ color: Colors.primary, fontSize: 11 }}>{u.role === 'admin' ? '⬇ User' : '⬆ Admin'}</Text>
          </Pressable>
          <Pressable onPress={() => toggleBan(u.id, u.is_banned)} style={styles.actionBtn}>
            <Text style={{ color: u.is_banned ? Colors.success : Colors.danger, fontSize: 11 }}>{u.is_banned ? '✅ Activar' : '🚫 Bloquear'}</Text>
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
      <Pressable style={styles.addBtn} onPress={addEvent}><Text style={styles.addBtnText}>+ Crear evento</Text></Pressable>
      {events.map((e) => (
        <View key={e.id} style={styles.item}>
          <View style={{ flex: 1 }}>
            <Text style={styles.itemTitle}>{e.title} {e.is_restricted ? '🔒' : ''}</Text>
            <Text style={styles.itemMeta}>{e.event_date}</Text>
          </View>
          <Pressable onPress={() => toggleRestrict(e.id, e.is_restricted)} style={styles.actionBtn}>
            <Text style={{ color: Colors.primary, fontSize: 11 }}>{e.is_restricted ? '🔓 Público' : '🔒 Restringir'}</Text>
          </Pressable>
          <Pressable onPress={() => deleteEvent(e.id)} style={styles.actionBtn}>
            <Text style={{ color: Colors.danger, fontSize: 12 }}>🗑</Text>
          </Pressable>
        </View>
      ))}
    </View>
  );
}

// ---------- Main Admin Panel ----------

export function AdminScreen() {
  const [tab, setTab] = useState<Tab>('posts');
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Panel de Administración</Text>
      <View style={styles.tabs}>
        {(['posts', 'users', 'events'] as Tab[]).map((t) => (
          <Pressable key={t} onPress={() => setTab(t)} style={[styles.tab, tab === t && styles.tabActive]}>
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t === 'posts' ? 'Publicaciones' : t === 'users' ? 'Usuarios' : 'Eventos'}
            </Text>
          </Pressable>
        ))}
      </View>
      <FlatList
        key={refreshKey}
        contentContainerStyle={{ padding: 16, gap: 8 }}
        ListHeaderComponent={
          <View style={{ marginBottom: 8 }} />
        }
        data={[]}
        renderItem={() => null}
        ListEmptyComponent={
          tab === 'posts' ? <PostsSection onRefresh={() => setRefreshKey((k) => k + 1)} /> :
          tab === 'users' ? <UsersSection /> :
          <EventsSection />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { fontSize: 18, fontWeight: '700', color: Colors.text, padding: 16, fontFamily: Fonts.family },
  tabs: { flexDirection: 'row', paddingHorizontal: 16, gap: 8 },
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
});