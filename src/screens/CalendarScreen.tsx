import { useEffect, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { Colors, Fonts } from '../navigation/theme';
import { supabase } from '../services/supabase';

type Event = {
  id: string;
  title: string;
  description: string;
  event_date: string;
  event_time: string;
  location: string;
  is_restricted: boolean;
};

export function CalendarScreen() {
  const [events, setEvents] = useState<Event[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchEvents = async () => {
    const { data } = await supabase
      .from('events')
      .select('*')
      .gte('event_date', new Date().toISOString().split('T')[0])
      .order('event_date', { ascending: true })
      .limit(50);
    setEvents((data as Event[]) ?? []);
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { fetchEvents(); }, []);

  const onRefresh = () => { setRefreshing(true); fetchEvents(); };

  if (loading) {
    return (
      <View style={styles.center}>
        <Text style={styles.placeholder}>Cargando eventos...</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={events}
      keyExtractor={(item) => item.id}
      contentContainerStyle={events.length === 0 && styles.center}
      ListEmptyComponent={
        <Text style={styles.placeholder}>No hay eventos próximos.</Text>
      }
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
      renderItem={({ item }) => (
        <View style={styles.card}>
          {item.is_restricted && <Text style={styles.restricted}>🔒 Restringido</Text>}
          <Text style={styles.title}>{item.title}</Text>
          {item.description ? <Text style={styles.desc}>{item.description}</Text> : null}
          <View style={styles.row}>
            <Text style={styles.meta}>📅 {item.event_date}</Text>
            {item.event_time ? <Text style={styles.meta}>🕐 {item.event_time}</Text> : null}
          </View>
          {item.location ? <Text style={styles.meta}>📍 {item.location}</Text> : null}
        </View>
      )}
    />
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
  restricted: { fontSize: 12, color: Colors.danger, marginBottom: 4, fontFamily: Fonts.family },
  title: { fontSize: 16, fontWeight: '600', color: Colors.text, fontFamily: Fonts.family },
  desc: { fontSize: 14, color: Colors.subtitle, marginTop: 4, lineHeight: 20, fontFamily: Fonts.family },
  row: { flexDirection: 'row', gap: 16, marginTop: 8 },
  meta: { fontSize: 13, color: Colors.text, fontFamily: Fonts.family },
});