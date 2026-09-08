import { useEffect, useState } from 'react';
import { FlatList, Image, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';

import { Colors, Fonts } from '../navigation/theme';
import { supabase } from '../services/supabase';

type Post = {
  id: string;
  title: string;
  content: string;
  media_url: string | null;
  media_type: 'image' | 'video' | null;
  created_at: string;
  profiles?: { full_name?: string; email?: string } | null;
};

/**
 * News tab — displays news/publications from Supabase.
 */
export function NewsScreen() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchPosts = async () => {
    const { data } = await supabase
      .from('posts')
      .select('id, title, content, media_url, media_type, created_at, profiles(full_name, email)')
      .eq('is_hidden', false)
      .order('created_at', { ascending: false })
      .limit(50);
    setPosts((data as Post[]) ?? []);
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { fetchPosts(); }, []);

  const onRefresh = () => { setRefreshing(true); fetchPosts(); };

  if (loading) {
    return (
      <View style={styles.center}>
        <Text style={styles.placeholder}>Cargando noticias...</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={posts}
      keyExtractor={(item) => item.id}
      contentContainerStyle={posts.length === 0 && styles.center}
      ListEmptyComponent={
        <Text style={styles.placeholder}>No hay noticias disponibles.</Text>
      }
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
      renderItem={({ item }) => (
        <NewsCard post={item} />
      )}
    />
  );
}

function NewsCard({ post }: { post: Post }) {
  const player = useVideoPlayer(post.media_url ?? '', (videoPlayer) => {
    videoPlayer.loop = true;
    videoPlayer.muted = true;
  });

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{post.title}</Text>
      {post.content ? <Text style={styles.content}>{post.content}</Text> : null}
      {post.media_url && post.media_type === 'image' ? (
        <Image source={{ uri: post.media_url }} style={styles.media} resizeMode="cover" />
      ) : null}
      {post.media_url && post.media_type === 'video' ? (
        <VideoView player={player} style={styles.media} contentFit="cover" fullscreenOptions={{ enable: true }} />
      ) : null}
      <View style={styles.footer}>
        <Text style={styles.author}>{post.profiles?.full_name || post.profiles?.email || 'Anónimo'}</Text>
        <Text style={styles.date}>{new Date(post.created_at).toLocaleDateString()}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background, padding: 32 },
  placeholder: { color: Colors.subtitle, fontFamily: Fonts.family, textAlign: 'center' },
  card: {
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  title: { fontSize: 16, fontWeight: '600', color: Colors.text, fontFamily: Fonts.family },
  content: { fontSize: 14, color: Colors.subtitle, marginTop: 6, lineHeight: 20, fontFamily: Fonts.family },
  media: { width: '100%', aspectRatio: 16 / 9, marginTop: 10, borderRadius: 12, backgroundColor: Colors.border },
  footer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  author: { fontSize: 12, color: Colors.primary, fontWeight: '500', fontFamily: Fonts.family },
  date: { fontSize: 12, color: Colors.subtitle, fontFamily: Fonts.family },
});