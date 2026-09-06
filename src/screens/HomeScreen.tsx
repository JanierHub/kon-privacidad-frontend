import { useEffect, useState } from 'react';
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Colors, Fonts } from '../navigation/theme';
import { supabase } from '../services/supabase';

type Post = {
  id: string;
  title: string;
  content: string;
  is_pinned: boolean;
  created_at: string;
  profiles?: { full_name?: string; email?: string } | null;
};

/**
 * Home tab — displays a feed of posts from Supabase.
 * Pull to refresh. Posts ordered newest-first.
 */
export function HomeScreen() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchPosts = async () => {
    const { data } = await supabase
      .from('posts')
      .select('id, title, content, is_pinned, created_at, profiles(full_name, email)')
      .eq('is_hidden', false)
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(50);
    setPosts((data as Post[]) ?? []);
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchPosts();
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <Text style={styles.placeholder}>Cargando publicaciones...</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={posts}
      keyExtractor={(item) => item.id}
      contentContainerStyle={posts.length === 0 && styles.center}
      ListEmptyComponent={
        <Text style={styles.placeholder}>
          No hay publicaciones aún. Sé el primero en publicar.
        </Text>
      }
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
      renderItem={({ item }) => (
        <View style={styles.card}>
          {item.is_pinned && <Text style={styles.pinned}>Fijado</Text>}
          <Text style={styles.title}>{item.title}</Text>
          {item.content ? <Text style={styles.content}>{item.content}</Text> : null}
          <View style={styles.footer}>
            <Text style={styles.author}>{item.profiles?.full_name || item.profiles?.email || 'Anónimo'}</Text>
            <Text style={styles.date}>{new Date(item.created_at).toLocaleDateString()}</Text>
          </View>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
    padding: 32,
  },
  placeholder: {
    color: Colors.subtitle,
    fontFamily: Fonts.family,
    textAlign: 'center',
  },
  card: {
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  pinned: {
    fontSize: 12,
    color: Colors.primary,
    marginBottom: 4,
    fontFamily: Fonts.family,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    fontFamily: Fonts.family,
  },
  content: {
    fontSize: 14,
    color: Colors.subtitle,
    marginTop: 6,
    lineHeight: 20,
    fontFamily: Fonts.family,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  author: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '500',
    fontFamily: Fonts.family,
  },
  date: {
    fontSize: 12,
    color: Colors.subtitle,
    fontFamily: Fonts.family,
  },
});