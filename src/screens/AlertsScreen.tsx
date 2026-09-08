import { useEffect, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { Colors, Fonts } from '../navigation/theme';
import { supabase } from '../services/supabase';

type Alert = {
  id: string;
  title: string;
  body: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  created_at: string;
};

const PRIORITY_LABEL: Record<string, string> = {
  low: 'BAJA',
  normal: 'NORMAL',
  high: 'ALTA',
  urgent: 'URGENTE',
};

const PRIORITY_COLOR: Record<string, string> = {
  low: Colors.success,
  normal: Colors.primary,
  high: '#F59E0B',
  urgent: Colors.danger,
};

const PRIORITY_ORDER: Record<string, number> = {
  urgent: 1,
  high: 2,
  normal: 3,
  low: 4,
};

/**
 * Alerts tab — displays alerts from Supabase ordered by priority
 * (urgent first) and then newest.
 */
export function AlertsScreen() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchAlerts = async () => {
    const { data } = await supabase
      .from('alerts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);
    const sorted = ((data as Alert[]) ?? []).sort(
      (a, b) =>
        (PRIORITY_ORDER[a.priority] ?? 99) - (PRIORITY_ORDER[b.priority] ?? 99) ||
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    setAlerts(sorted);
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchAlerts();
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <Text style={styles.placeholder}>Cargando alertas...</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={alerts}
      keyExtractor={(item) => item.id}
      contentContainerStyle={alerts.length === 0 && styles.center}
      ListEmptyComponent={
        <Text style={styles.placeholder}>No hay alertas disponibles.</Text>
      }
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
      renderItem={({ item }) => (
        <View style={styles.card}>
          <View style={styles.topRow}>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={[styles.badge, { backgroundColor: PRIORITY_COLOR[item.priority] ?? Colors.subtitle }]}>
              {PRIORITY_LABEL[item.priority] ?? item.priority}
            </Text>
          </View>
          {item.body ? <Text style={styles.body}>{item.body}</Text> : null}
          <Text style={styles.date}>{new Date(item.created_at).toLocaleDateString()}</Text>
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
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  title: { flex: 1, fontSize: 16, fontWeight: '600', color: Colors.text, fontFamily: Fonts.family },
  badge: { color: '#FFFFFF', fontSize: 11, fontWeight: '700', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, overflow: 'hidden' },
  body: { fontSize: 14, color: Colors.subtitle, marginTop: 6, lineHeight: 20, fontFamily: Fonts.family },
  date: { fontSize: 12, color: Colors.subtitle, marginTop: 8, fontFamily: Fonts.family },
});
