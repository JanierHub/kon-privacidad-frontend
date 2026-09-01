import { StyleSheet, Text, View } from 'react-native';

import { Colors, Fonts } from '../navigation/theme';

type PlaceholderScreenProps = {
  /** In-screen header title shown at the top (Spanish UI text). */
  headerTitle: string;
  /** Muted placeholder text shown centered in the content area. */
  contentText: string;
};

/**
 * Shared placeholder layout used by the main tab screens.
 *
 * Renders a single in-screen header (the navigator's native header is
 * disabled on these screens, so the title appears exactly once) above a
 * centered, muted content area that will hold real content later.
 */
export function PlaceholderScreen({ headerTitle, contentText }: PlaceholderScreenProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{headerTitle}</Text>
      </View>
      <View style={styles.content}>
        <Text style={styles.contentText}>{contentText}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingTop: 16,
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  headerTitle: {
    color: Colors.primary,
    fontSize: 28,
    fontWeight: '700',
    fontFamily: Fonts.family,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentText: {
    color: Colors.subtitle,
    fontSize: 15,
    fontFamily: Fonts.family,
  },
});
