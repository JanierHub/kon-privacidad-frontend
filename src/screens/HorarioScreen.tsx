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
  ScrollView,
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

const WEEK = [
  { label: 'Lunes', short: 'LUN', color: '#E8F0FE', accent: '#1A73E8' },
  { label: 'Martes', short: 'MAR', color: '#E6F4EA', accent: '#188038' },
  { label: 'Miércoles', short: 'MIÉ', color: '#FEF7E0', accent: '#B06000' },
  { label: 'Jueves', short: 'JUE', color: '#FCE8E6', accent: '#C5221F' },
  { label: 'Viernes', short: 'VIE', color: '#F3E8FD', accent: '#8430CE' },
];
const DAY_LABELS = WEEK.map((d) => d.label);

function decode(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Horario tab — the user's own visual weekly schedule (Mon–Fri). Each user
 * builds their classes by day with times, and can upload their own schedule
 * overview image that stays at the top.
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
  const [formDay, setFormDay] = useState('Lunes');
  const [fSubject, setFSubject] = useState('');
  const [fProfessor, setFProfessor] = useState('');
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
      setClasses((data as PersonalClass[]) ?? []);
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

  const openNew = (day: string) => {
    setEditing(null);
    setFormDay(day);
    setFSubject('');
    setFProfessor('');
    setFStart('');
    setFEnd('');
    setFClassroom('');
    setShowForm(true);
  };

  const openEdit = (row: PersonalClass) => {
    setEditing(row);
    setFormDay(row.day_of_week);
    setFSubject(row.subject);
    setFProfessor(row.professor ?? '');
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
      day_of_week: formDay,
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
    setShowForm(false);
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

  const renderHeader = (
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
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
        contentContainerStyle={{ padding: 16, gap: 12 }}
      >
        {renderHeader}

        {WEEK.map((day) => {
          const dayClasses = classes
            .filter((c) => c.day_of_week === day.label)
            .sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''));
          return (
            <View key={day.label} style={styles.dayBlock}>
              <View style={styles.dayHeader}>
                <View style={[styles.dayBadge, { backgroundColor: day.color }]}>
                  <Text style={[styles.dayLabel, { color: day.accent }]}>{day.label}</Text>
                </View>
                <Pressable onPress={() => openNew(day.label)} hitSlop={8}>
                  <Ionicons name="add-circle-outline" size={22} color={Colors.primary} />
                </Pressable>
              </View>

              {dayClasses.length === 0 ? (
                <View style={styles.emptyRow}>
                  <Text style={styles.emptyText}>Sin materias</Text>
                </View>
              ) : (
                dayClasses.map((c) => (
                  <View key={c.id} style={[styles.classRow, { borderLeftColor: day.accent }]}>
                    <View style={styles.timeBox}>
                      <Text style={styles.timeText}>{c.start_time || '--'}</Text>
                      <Text style={styles.timeSep}>–</Text>
                      <Text style={styles.timeText}>{c.end_time || '--'}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.classSubject}>{c.subject}</Text>
                      {c.professor ? <Text style={styles.classMeta}>{c.professor}</Text> : null}
                      {c.classroom ? <Text style={styles.classMeta}>{c.classroom}</Text> : null}
                    </View>
                    <Pressable onPress={() => openEdit(c)} hitSlop={8}>
                      <Ionicons name="create-outline" size={18} color={Colors.primary} />
                    </Pressable>
                    <Pressable onPress={() => remove(c)} hitSlop={8}>
                      <Ionicons name="trash-outline" size={18} color={Colors.danger} />
                    </Pressable>
                  </View>
                ))
              )}
            </View>
          );
        })}
      </ScrollView>

      <Modal visible={showForm} animationType="slide" transparent onRequestClose={() => setShowForm(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editing ? 'Editar materia' : `Agregar materia`}</Text>
              <Pressable onPress={() => setShowForm(false)} hitSlop={12}>
                <Ionicons name="close" size={24} color={Colors.subtitle} />
              </Pressable>
            </View>

            <Text style={styles.label}>Día</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
              {DAY_LABELS.map((d) => (
                <Pressable key={d} onPress={() => setFormDay(d)} style={[styles.dayChip, formDay === d && styles.dayChipActive]}>
                  <Text style={[styles.dayChipText, formDay === d && styles.dayChipTextActive]}>{d}</Text>
                </Pressable>
              ))}
            </View>

            <TextInput style={styles.input} placeholder="Materia *" placeholderTextColor={Colors.subtitle} value={fSubject} onChangeText={setFSubject} />
            <TextInput style={styles.input} placeholder="Profesor" placeholderTextColor={Colors.subtitle} value={fProfessor} onChangeText={setFProfessor} />
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TextInput style={[styles.input, { flex: 1 }]} placeholder="Inicia (7:00)" placeholderTextColor={Colors.subtitle} value={fStart} onChangeText={setFStart} />
              <TextInput style={[styles.input, { flex: 1 }]} placeholder="Termina (9:00)" placeholderTextColor={Colors.subtitle} value={fEnd} onChangeText={setFEnd} />
            </View>
            <TextInput style={styles.input} placeholder="Salón" placeholderTextColor={Colors.subtitle} value={fClassroom} onChangeText={setFClassroom} />

            <Pressable style={styles.saveBtn} onPress={save}>
              <Text style={styles.saveBtnText}>{editing ? 'Guardar cambios' : 'Agregar'}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
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
  dayBlock: { gap: 6 },
  dayHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dayBadge: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 10, alignSelf: 'flex-start' },
  dayLabel: { fontSize: 14, fontWeight: '700', fontFamily: Fonts.family },
  emptyRow: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emptyText: { color: Colors.subtitle, fontSize: 13, fontFamily: Fonts.family },
  classRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.card,
    borderRadius: 10,
    borderLeftWidth: 4,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  timeBox: { alignItems: 'center', minWidth: 56 },
  timeText: { fontSize: 13, fontWeight: '600', color: Colors.text, fontFamily: Fonts.family },
  timeSep: { fontSize: 12, color: Colors.subtitle, fontFamily: Fonts.family },
  classSubject: { fontSize: 15, fontWeight: '600', color: Colors.text, fontFamily: Fonts.family },
  classMeta: { fontSize: 12, color: Colors.subtitle, marginTop: 2, fontFamily: Fonts.family },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 20 },
  modal: { backgroundColor: Colors.card, borderRadius: 16, padding: 20, gap: 12 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  modalTitle: { fontSize: 18, fontWeight: '700', color: Colors.text, fontFamily: Fonts.family },
  label: { fontSize: 13, fontWeight: '600', color: Colors.text, fontFamily: Fonts.family },
  input: { backgroundColor: '#F3F4F6', borderRadius: 10, paddingVertical: 12, paddingHorizontal: 14, fontSize: 14, color: Colors.text, fontFamily: Fonts.family },
  dayChip: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 16, backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: Colors.border },
  dayChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  dayChipText: { fontSize: 12, fontWeight: '500', color: Colors.text, fontFamily: Fonts.family },
  dayChipTextActive: { color: '#FFFFFF' },
  saveBtn: { backgroundColor: Colors.primary, borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  saveBtnText: { color: '#FFFFFF', fontWeight: '600', fontSize: 15, fontFamily: Fonts.family },
});