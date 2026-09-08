import { useEffect, useState } from 'react';
import { FlatList, Image, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { Colors, Fonts } from '../navigation/theme';
import { supabase } from '../services/supabase';

type ClassItem = {
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
 * Reads the schedule image (optional overview image of the full timetable)
 * from the `app_settings` table and the list of classes from `schedule`.
 */
export function ScheduleScreen() {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [scheduleImage, setScheduleImage] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchSchedule = async () => {
    const { data: settings } = await supabase
      .from('app_settings')
      .select('schedule_image_url')
      .eq('key', 'schedule_image')
      .single();
    setScheduleImage(settings?.schedule_image_url ?? null);

    const { data } = await supabase
      .from('schedule')
      .select('*')
      .order('day_of_week', { ascending: true })
      .order('start_time', { ascending: true });
    const sorted = ((data as ClassItem[]) ?? []).sort(
      (a, b) => (DAY_ORDER[a.day_of_week] ?? 99) - (DAY_ORDER[b.day_of_week] ?? 99)
    );
    setClasses(sorted);
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { fetchSchedule(); }, []);

  const onRefresh = () => { setRefreshing(true); fetchSchedule(); };

  if (loading) {
    return (
      <View style={styles.center}>
        <Text style={styles.placeholder}>Cargando horario...</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={classes}
      keyExtractor={(item) => item.id}
      contentContainerStyle={classes.length === 0 && styles.center}
      ListHeaderComponent={
        scheduleImage ? (
          <Image source={{ uri: scheduleImage }} style={styles.scheduleImage} resizeMode="contain" />
        ) : null
      }
      ListEmptyComponent={
        scheduleImage ? null : (
          <Text style={styles.placeholder}>No hay clases registradas.</Text>
        )
      }
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
      renderItem={({ item }) => (
        <View style={styles.card}>
          <Text style={styles.subject}>{item.subject}</Text>
          {item.professor ? <Text style={styles.prof}>{item.professor}</Text> : null}

          <Text style={styles.meta}>{item.day_of_week}</Text>
          <Text style={styles.meta}>{item.start_time} - {item.end_time}</Text>
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
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
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
  row: { flexDirection: 'row', gap: 16, marginTop: 6 },
  meta: { fontSize: 13, color: Colors.text, fontFamily: Fonts.family },
});