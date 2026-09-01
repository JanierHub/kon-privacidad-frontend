import type { RouteProp } from '@react-navigation/native';
import { StyleSheet, Text, View } from 'react-native';

import { Colors } from '../navigation/theme';
import type { DetailScreenParams } from '../navigation/types';

type DetailScreenProps = {
  /**
   * Minimal route typing: this screen is registered in every tab's
   * stack, each with its own param list, so we only read the shared
   * detail params instead of tying the component to one navigator.
   */
  route: RouteProp<Record<string, DetailScreenParams>, string>;
};

/**
 * Generic detail screen shared by every tab's stack.
 *
 * It exists solely to demonstrate that the stack nested inside each tab
 * can push a sub-screen on top of the tab's main screen. Real detail
 * screens will replace this when the corresponding features are built.
 */
export function DetailScreen({ route }: DetailScreenProps) {
  const title = route.params?.title ?? 'Detalle';

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.caption}>Pantalla de detalle (en construcción)</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
  },
  caption: {
    fontSize: 14,
    color: Colors.subtitle,
  },
});
