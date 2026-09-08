import Ionicons from '@expo/vector-icons/Ionicons';
import * as ImagePicker from 'expo-image-picker';
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

type PersonalClass = {
  id: string;
  subject: string;
  professor: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  classroom: string;
};

const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const DAY_ORDER: Record<string, number> = {
  Lunes: 1, Martes: 2, Miércoles: 3, Jueves: 4, Viernes: 5, Sábado: 6, Domingo: 7,
};

function decode(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Horario tab — the user's own personal schedule. Each user creates and
 * organizes their own classes (stored per user_id) and can upload their
 * own schedule image.
 */
export function HorarioScreen() {
  const [classes, setClasses] = useState<PersonalClass[]>([]);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<PersonalClass | null>(null);
  const [fSubject, setFSubject] = useState('');
  const [fProfessor, setFProfessor] = useState('');
  const [fDay, setFDay] = useState('Lunes');
  const [fStart, setFStart] = useState('');
  const [fEnd, setFEnd] = useState('');
  const [fClassroom, setFClassroom] = useState('');

  const fetchData = async () => {
    const { data: u } = await supabase.auth.getUser();
    const uid = u.user?.id ?? null;
    setUserId(uid);

    if (uid) {
      const { data: settings } = await supabase
        .from('app_settings')
        .select('schedule_image_url')
        .eq('key', `horario_${uid}`)
        .single();
      setImageUrl(settings?.schedule_image_url ?? null);

      const { data } = await supabase
        .from('schedule')
        .select('*')
        .eq('user_id', uid)
        .order('day_of_week', { ascending: true })
        .order('start_time', { ascending: true });
      const sorted = ((data as PersonalClass[]) ?? []).sort(
        (a, b) => (DAY_ORDER[a.day_of_week] ?? 99) - (DAY_ORDER[b.day_of_week] ?? 99)
      );
      setClasses(sorted);
    } else {
      setClasses([]);
      setImageUrl(null);
    }
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const resetForm = () => {
    setEditing(null);
    setFSubject('');
    setFProfessor('');
    setFDay('Lunes');
    setFStart('');
    setFEnd('');
    setFClassroom('');
    setShowForm(false);
  };

  const openNew = () => {
    resetForm();
    setShowForm(true);
  };

  const openEdit = (row: PersonalClass) => {
    setEditing(row);
    setFSubject(row.subject);
    setFProfessor(row.professor ?? '');
    setFDay(row.day_of_week);
    setFStart(row.start_time ?? '');
    setFEnd(row.end_time ?? '');
    setFClassroom(row.classroom ?? '');
    setShowForm(true);
  };

  const save = async () => {
    if (!userId) {
      Alert.alert('Sin sesión', 'Inicia sesión para guardar tu horario.');
      return;
    }
    if (!fSubject.trim()) {
      Alert.alert('Falta información', 'Escribe el nombre de la materia.');
      return;
    }
    const payload = {
      user_id: userId,
      subject: fSubject.trim(),
      professor: fProfessor.trim(),
      day_of_week: fDay,
      start_time: fStart.trim(),
      end_time: fEnd.trim(),
      classroom: fClassroom.trim(),
    };
    if (editing) {
      const { error } = await supabase.from('schedule').update(payload).eq('id', editing.id);
      if (error) {
        Alert.alert('Error', error.message);
        return;
      }
      Alert.alert('Guardado', 'Materia actualizada.');
    } else {
      const { error } = await supabase.from('schedule').insert(payload);
      if (error) {
        Alert.alert('Error', error.message);
        return;
      }
      Alert.alert('Guardado', 'Materia agregada.');
    }
    resetForm();
    fetchData();
  };

  const remove = (row: PersonalClass) => {
    Alert.alert('Eliminar materia', `¿Eliminar "${row.subject}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          const { error } = await supabase.from('schedule').delete().eq('id', row.id);
          if (error) {
            Alert.alert('Error', error.message);
            return;
          }
          fetchData();
        },
      },
    ]);
  };

  const pickImage = async () => {
    if (!userId) return;
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
      const fileName = `user-schedule-${Date.now()}.${ext}`;
      const path = `${userId}/${fileName}`;
      const { error: upErr } = await supabase.storage
        .from('schedule-images')
        .upload(path, decode(base64), {
          contentType: asset.mimeType ?? 'image/jpeg',
          upsert: true,
        });
      if (upErr) {
        Alert.alert('Error al subir', upErr.message);
        return;
      }
      const { data: pub } = supabase.storage.from('schedule-images').getPublicUrl(path);
      const url = pub?.publicUrl ?? '';
      await supabase
        .from('app_settings')
        .upsert({ key: `horario_${userId}`, schedule_image_url: url }, { onConflict: 'key' });
      setImageUrl(url);
      Alert.alert('Guardado', 'Imagen de tu horario actualizada.');
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'No se pudo subir la imagen.');
    } finally {
      setUploading(false);
    }
  };

  const removeImage = async () => {
    if (!userId) return;
    Alert.alert('Quitar imagen', '¿Eliminar la imagen de tu horario?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Quitar',
        style: 'destructive',
        onPress: async () => {
          await supabase
            .from('app_settings')
            .upsert({ key: `horario_${userId}`, schedule_image_url: null }, { onConflict: 'key' });
          setImageUrl(null);
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <Text style={styles.placeholder}>Cargando tu horario...</Text>
      </View>
    );
  }

  if (!userId) {
    return (
      <View style={styles.center}>
        <Text style={styles.placeholder}>Inicia sesión para crear tu horario.</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={classes}
      keyExtractor={(item) => item.id}
      contentContainerStyle={classes.length === 0 && styles.center}
      ListHeaderComponent={
        <View style={{ gap: 12 }}>
          <View style={{ gap: 8 }}>
            <Text style={styles.createTitle}>Imagen de tu horario</Text>
            <Text style={styles.itemMeta}>Sube una imagen de tu horario para tenerlo siempre a la mano.</Text>
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
                <Text style={styles.mediaBtnText}>{uploading ? 'Subiendo...' : 'Subir imagen de mi horario'}</Text>
              </Pressable>
            )}
          </View>

          <View style={{ gap: 8 }}>
            <Text style={styles.createTitle}>Mis materias</Text>
            {classes.length === 0 ? (
              <Text style={styles.itemMeta}>No tienes materias registradas. Agrega las tuyas.</Text>
            ) : null}

            {showForm ? (
              <View style={styles.createBox}>
                <Text style={styles.createTitle}>{editing ? 'Editar materia' : 'Nueva materia'}</Text>
                <TextInput style={styles.input} placeholder="Materia *" placeholderTextColor={Colors.subtitle} value={fSubject} onChangeText={setFSubject} />
                <TextInput style={styles.input} placeholder="Profesor" placeholderTextColor={Colors.subtitle} value={fProfessor} onChangeText={setFProfessor} />
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                  {DAYS.map((d) => (
                    <Pressable
                      key={d}
                      onPress={() => setFDay(d)}
                      style={[styles.dayChip, fDay === d && styles.dayChipActive]}
                    >
                      <Text style={[styles.dayChipText, fDay === d && styles.dayChipTextActive]}>{d}</Text>
                    </Pressable>
                  ))}
                </View>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TextInput style={[styles.input, { flex: 1 }]} placeholder="Inicia (ej. 7:00)" placeholderTextColor={Colors.subtitle} value={fStart} onChangeText={setFStart} />
                  <TextInput style={[styles.input, { flex: 1 }]} placeholder="Termina (ej. 9:00)" placeholderTextColor={Colors.subtitle} value={fEnd} onChangeText={setFEnd} />
                </View>
                <TextInput style={styles.input} placeholder="Salón" placeholderTextColor={Colors.subtitle} value={fClassroom} onChangeText={setFClassroom} />
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <Pressable style={[styles.addBtn, { flex: 1 }]} onPress={save}>
                    <Text style={styles.addBtnText}>{editing ? 'Guardar cambios' : 'Agregar materia'}</Text>
                  </Pressable>
                  <Pressable style={styles.cancelBtn} onPress={resetForm}>
                    <Text style={styles.cancelBtnText}>Cancelar</Text>
                  </Pressable>
                </View>
              </View>
            ) : (
              <Pressable style={styles.mediaBtn} onPress={openNew}>
                <Ionicons name="add" size={18} color={Colors.primary} />
                <Text style={styles.mediaBtnText}>Agregar materia</Text>
              </Pressable>
            )}
          </View>
        </View>
      }
      ListEmptyComponent={
        <Text style={styles.placeholder}>No hay materias aún. Agrega la primera con el botón de arriba.</Text>
      }
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
      renderItem={({ item }) => (
        <View style={styles.card}>
          <View style={styles.cardTop}>
            <Text style={styles.subject}>{item.subject}</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Pressable onPress={() => openEdit(item)} hitSlop={8}>
                <Ionicons name="create-outline" size={18} color={Colors.primary} />
              </Pressable>
              <Pressable onPress={() => remove(item)} hitSlop={8}>
                <Ionicons name="trash-outline" size={18} color={Colors.danger} />
              </Pressable>
            </View>
          </View>
          {item.professor ? <Text style={styles.prof}>{item.professor}</Text> : null}
          <Text style={styles.meta}>{item.day_of_week}</Text>
          {item.start_time || item.end_time ? (
            <Text style={styles.meta}>{item.start_time}{item.start_time && item.end_time ? ' - ' : ''}{item.end_time}</Text>
          ) : null}
          {item.classroom ? <Text style={styles.meta}>{item.classroom}</Text> : null}
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background, padding: 32 },
  placeholder: { color: Colors.subtitle, fontFamily: Fonts.family, textAlign: 'center' },
  createTitle: { fontSize: 16, fontWeight: '700', color: Colors.text, fontFamily: Fonts.family },
  itemMeta: { fontSize: 13, color: Colors.subtitle, fontFamily: Fonts.family },
  mediaPreview: { width: '100%', height: 200, borderRadius: 12, backgroundColor: Colors.border },
  addBtn: { backgroundColor: Colors.primary, borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  addBtnText: { color: '#FFFFFF', fontWeight: '600', fontFamily: Fonts.family },
  mediaBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderWidth: 1.5, borderColor: Colors.primary, borderStyle: 'dashed', borderRadius: 10, paddingVertical: 12,
  },
  mediaBtnText: { color: Colors.primary, fontSize: 14, fontWeight: '600', fontFamily: Fonts.family },
  createBox: { backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.primary, borderRadius: 12, padding: 12, gap: 8, marginBottom: 8 },
  input: { backgroundColor: '#F3F4F6', borderRadius: 10, paddingVertical: 12, paddingHorizontal: 14, fontSize: 14, color: Colors.text, fontFamily: Fonts.family },
  dayChip: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 16, backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: Colors.border },
  dayChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  dayChipText: { fontSize: 12, fontWeight: '500', color: Colors.text, fontFamily: Fonts.family },
  dayChipTextActive: { color: '#FFFFFF' },
  cancelBtn: { borderRadius: 10, paddingVertical: 12, paddingHorizontal: 16, alignItems: 'center', backgroundColor: Colors.border },
  cancelBtnText: { color: Colors.text, fontWeight: '600', fontFamily: Fonts.family },
  card: {
    backgroundColor: Colors.card, borderBottomWidth: 1, borderBottomColor: Colors.border,
    paddingHorizontal: 16, paddingVertical: 14,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  subject: { fontSize: 16, fontWeight: '600', color: Colors.text, fontFamily: Fonts.family },
  prof: { fontSize: 13, color: Colors.primary, marginTop: 4, fontFamily: Fonts.family },
  meta: { fontSize: 13, color: Colors.text, marginTop: 2, fontFamily: Fonts.family },
});