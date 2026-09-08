import { useEffect, useState } from 'react';
import { FlatList, Image, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { Colors, Fonts } from '../navigation/theme';
import { supabase } from '../services/supabase';

type Tutoria = {
  id: string;
  subject: string;
  professor: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  classroom: string;
};

const DAY_ORDER: Record<string, number> = {
  Lunes: 1, Martes: 2, Miércoles: 3, Jueves: 4, Viernes: 5, Sábado: 6, Domingo: 7,
};

/**
 * Tutorías tab — read-only view for users. Shows the schedule overview
 * image (set by the admin) plus the list of tutoring sessions that the
 * admin has published.
 */
export function ScheduleScreen() {
  const [tutorias, setTutorias] = useState<Tutoria[]>([]);
  const [scheduleImage, setScheduleImage] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    const { data: settings } = await supabase
      .from('app_settings')
      .select('schedule_image_url')
      .eq('key', 'schedule_image')
      .single();
    setScheduleImage(settings?.schedule_image_url ?? null);

    const { data } = await supabase
      .from('schedule')
      .select('*')
      .is('user_id', null)
      .order('day_of_week', { ascending: true })
      .order('start_time', { ascending: true });
    const sorted = ((data as Tutoria[]) ?? []).sort(
      (a, b) => (DAY_ORDER[a.day_of_week] ?? 99) - (DAY_ORDER[b.day_of_week] ?? 99)
    );
    setTutorias(sorted);
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

  if (loading) {
    return (
      <View style={styles.center}>
        <Text style={styles.placeholder}>Cargando tutorías...</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={tutorias}
      keyExtractor={(item) => item.id}
      contentContainerStyle={tutorias.length === 0 && styles.center}
      ListHeaderComponent={
        scheduleImage ? (
          <Image source={{ uri: scheduleImage }} style={styles.scheduleImage} resizeMode="contain" />
        ) : null
      }
      ListEmptyComponent={
        scheduleImage ? null : (
          <Text style={styles.placeholder}>No hay tutorías registradas.</Text>
        )
      }
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
      renderItem={({ item }) => (
        <View style={styles.card}>
          <Text style={styles.subject}>{item.subject}</Text>
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
  scheduleImage: {
    width: '100%',
    aspectRatio: 3 / 4,
    marginHorizontal: 16,
    alignSelf: 'center',
  },
  card: {
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  subject: { fontSize: 16, fontWeight: '600', color: Colors.text, fontFamily: Fonts.family },
  prof: { fontSize: 13, color: Colors.primary, marginTop: 4, fontFamily: Fonts.family },
  meta: { fontSize: 13, color: Colors.text, marginTop: 2, fontFamily: Fonts.family },
});
