import Ionicons from '@expo/vector-icons/Ionicons';
import * as ImagePicker from 'expo-image-picker';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  Modal,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Colors, Fonts } from '../navigation/theme';
import { supabase } from '../services/supabase';

type Post = {
  id: string;
  title: string;
  content: string;
  media_url: string | null;
  media_type: 'image' | 'video' | null;
  is_pinned: boolean;
  is_hidden: boolean;
  created_at: string;
  profiles?: { full_name?: string; email?: string } | null;
};

type NewAsset = {
  type: 'image' | 'video';
  base64: string;
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

/**
 * Posts tab — a dedicated feed of all posts (including hidden ones)
 * so admins can publish new content and manage the existing posts
 * (pin, hide/show, delete).
 */
export function PostsScreen() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchPosts = async () => {
    const { data } = await supabase
      .from('posts')
      .select('*')
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

  const togglePin = async (id: string, current: boolean) => {
    await supabase.from('posts').update({ is_pinned: !current }).eq('id', id);
    fetchPosts();
  };

  const toggleHide = async (id: string, current: boolean) => {
    await supabase.from('posts').update({ is_hidden: !current }).eq('id', id);
    fetchPosts();
  };

  const deletePost = async (post: Post) => {
    Alert.alert('Eliminar', `¿Eliminar "${post.title}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          const { error } = await supabase.from('posts').delete().eq('id', post.id);
          if (error) return Alert.alert('Error', error.message);
          fetchPosts();
        },
      },
    ]);
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
      ListHeaderComponent={<NewPostModal onPosted={fetchPosts} />}
      ListEmptyComponent={
        <Text style={styles.placeholder}>No hay publicaciones aún.</Text>
      }
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
      renderItem={({ item }) => (
        <PostCard
          post={item}
          onTogglePin={() => togglePin(item.id, item.is_pinned)}
          onToggleHide={() => toggleHide(item.id, item.is_hidden)}
          onDelete={() => deletePost(item)}
        />
      )}
    />
  );
}

function NewPostModal({ onPosted }: { onPosted: () => void }) {
  const [visible, setVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [media, setMedia] = useState<NewAsset>(null);
  const [publishing, setPublishing] = useState(false);

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
    if (result.canceled || !result.assets?.[0]?.base64) return;
    const asset = result.assets[0];
    const base64 = asset.base64!;
    const isVideo = (asset.type ?? '') === 'video' || (asset.mimeType ?? '').startsWith('video');
    setMedia({
      type: isVideo ? 'video' : 'image',
      base64,
      mimeType: asset.mimeType ?? (isVideo ? 'video/mp4' : 'image/jpeg'),
    });
  };

  const publish = async () => {
    if (!title.trim()) {
      Alert.alert('Falta el título', 'Escribe un título para tu publicación.');
      return;
    }
    setPublishing(true);
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
          .upload(path, decode(media.base64), { contentType: media.mimeType, upsert: true });
        if (upErr) {
          Alert.alert('Error al subir', upErr.message);
          return;
        }
        const { data: pub } = supabase.storage.from('posts-media').getPublicUrl(path);
        mediaUrl = pub?.publicUrl ?? null;
        mediaType = media.type;
      }
      const { error } = await supabase.from('posts').insert({
        user_id: userId,
        title: title.trim(),
        content: content.trim(),
        media_url: mediaUrl,
        media_type: mediaType,
      });
      if (error) {
        Alert.alert('Error', error.message);
        return;
      }
      setTitle(''); setContent(''); setMedia(null);
      setVisible(false);
      onPosted();
    } finally {
      setPublishing(false);
    }
  };

  return (
    <>
      <Pressable style={styles.newPostBtn} onPress={() => setVisible(true)}>
        <Ionicons name="add" size={20} color="#FFFFFF" />
        <Text style={styles.newPostBtnText}>Nueva publicación</Text>
      </Pressable>

      <Modal visible={visible} animationType="slide" transparent onRequestClose={() => setVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nueva publicación</Text>
              <Pressable onPress={() => setVisible(false)} hitSlop={12}>
                <Ionicons name="close" size={24} color={Colors.subtitle} />
              </Pressable>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Título"
              placeholderTextColor={Colors.subtitle}
              value={title}
              onChangeText={setTitle}
              editable={!publishing}
            />
            <TextInput
              style={[styles.input, styles.inputMultiline]}
              placeholder="Contenido (opcional)"
              placeholderTextColor={Colors.subtitle}
              value={content}
              onChangeText={setContent}
              multiline
              editable={!publishing}
            />

            <Pressable style={styles.mediaBtn} onPress={pickMedia} disabled={publishing}>
              <Ionicons name={media ? 'attach' : 'image-outline'} size={18} color={Colors.primary} />
              <Text style={styles.mediaBtnText}>
                {media ? 'Adjunto seleccionado' : 'Adjuntar foto o video'}
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

            <Pressable style={styles.publishBtn} onPress={publish} disabled={publishing}>
              <Text style={styles.publishBtnText}>{publishing ? 'Publicando...' : 'Publicar'}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}

type PostCardProps = {
  post: Post;
  onTogglePin: () => void;
  onToggleHide: () => void;
  onDelete: () => void;
};

function PostCard({ post, onTogglePin, onToggleHide, onDelete }: PostCardProps) {
  const player = useVideoPlayer(post.media_url ?? '', (videoPlayer) => {
    videoPlayer.loop = true;
    videoPlayer.muted = true;
  });

  return (
    <View style={[styles.card, post.is_hidden && styles.cardHidden]}>
      {post.is_pinned && <Text style={styles.pinned}>Fijado</Text>}
      {post.is_hidden && <Text style={styles.hiddenLabel}>Oculto</Text>}
      <Text style={styles.title}>{post.title}</Text>
      {post.content ? <Text style={styles.content}>{post.content}</Text> : null}
      {post.media_url && post.media_type === 'image' ? (
        <Image source={{ uri: post.media_url }} style={styles.media} resizeMode="cover" />
      ) : null}
      {post.media_url && post.media_type === 'video' ? (
        <VideoView
          player={player}
          style={styles.media}
          contentFit="cover"
          fullscreenOptions={{ enable: true }}
        />
      ) : null}
      <View style={styles.footer}>
        <Text style={styles.author}>{post.profiles?.full_name || post.profiles?.email || 'Anónimo'}</Text>
        <Text style={styles.date}>{new Date(post.created_at).toLocaleDateString()}</Text>
      </View>
      <View style={styles.actions}>
        <Pressable style={styles.actionBtn} onPress={onTogglePin}>
          <Ionicons name="pin" size={16} color={Colors.primary} />
          <Text style={styles.actionText}>{post.is_pinned ? 'Desfijar' : 'Fijar'}</Text>
        </Pressable>
        <Pressable style={styles.actionBtn} onPress={onToggleHide}>
          <Ionicons name="eye-off" size={16} color={Colors.primary} />
          <Text style={styles.actionText}>{post.is_hidden ? 'Mostrar' : 'Ocultar'}</Text>
        </Pressable>
        <Pressable style={styles.actionBtn} onPress={onDelete}>
          <Ionicons name="trash-outline" size={16} color={Colors.danger} />
          <Text style={[styles.actionText, { color: Colors.danger }]}>Eliminar</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background, padding: 32 },
  placeholder: { color: Colors.subtitle, fontFamily: Fonts.family, textAlign: 'center' },
  newPostBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
  },
  newPostBtnText: { color: '#FFFFFF', fontWeight: '600', fontSize: 15, fontFamily: Fonts.family },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 20 },
  modal: { backgroundColor: Colors.card, borderRadius: 16, padding: 20, gap: 12 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  modalTitle: { fontSize: 18, fontWeight: '700', color: Colors.text, fontFamily: Fonts.family },
  input: {
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: 14,
    color: Colors.text,
    fontFamily: Fonts.family,
  },
  inputMultiline: { minHeight: 80, textAlignVertical: 'top' },
  mediaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    borderRadius: 10,
    paddingVertical: 12,
  },
  mediaBtnText: { color: Colors.primary, fontSize: 14, fontWeight: '600', fontFamily: Fonts.family },
  mediaPreview: { width: '100%', height: 180, borderRadius: 12, backgroundColor: Colors.border },
  removeMedia: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 4 },
  publishBtn: { backgroundColor: Colors.primary, borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  publishBtnText: { color: '#FFFFFF', fontWeight: '600', fontSize: 15, fontFamily: Fonts.family },
  card: {
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  cardHidden: { opacity: 0.6 },
  pinned: { fontSize: 12, color: Colors.primary, marginBottom: 4, fontFamily: Fonts.family },
  hiddenLabel: { fontSize: 12, color: Colors.danger, marginBottom: 4, fontFamily: Fonts.family },
  title: { fontSize: 16, fontWeight: '600', color: Colors.text, fontFamily: Fonts.family },
  content: { fontSize: 14, color: Colors.subtitle, marginTop: 6, lineHeight: 20, fontFamily: Fonts.family },
  media: {
    width: '100%',
    aspectRatio: 16 / 9,
    marginTop: 10,
    borderRadius: 12,
    backgroundColor: Colors.border,
  },
  footer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  author: { fontSize: 12, color: Colors.primary, fontWeight: '500', fontFamily: Fonts.family },
  date: { fontSize: 12, color: Colors.subtitle, fontFamily: Fonts.family },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 16, marginTop: 10, borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: 8 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  actionText: { fontSize: 12, fontWeight: '500', color: Colors.primary, fontFamily: Fonts.family },
});
