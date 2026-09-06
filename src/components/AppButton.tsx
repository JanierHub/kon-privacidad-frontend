import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';

import { Colors, Fonts } from '../navigation/theme';

type AppButtonProps = {
  /** Spanish label shown inside the button. */
  label: string;
  /** Visual style; primary is filled, secondary is outlined. */
  variant?: 'primary' | 'secondary';
  /** Called when the button is pressed. */
  onPress?: () => void;
  /** Shows a spinner and disables taps while an async action runs. */
  loading?: boolean;
};

/**
 * Shared app button with primary (filled) and secondary (outlined)
 * variants. Uses Pressable so it gives visual feedback while pressed.
 */
export function AppButton({ label, variant = 'primary', onPress, loading = false }: AppButtonProps) {
  const isPrimary = variant === 'primary';

  return (
    <Pressable
      onPress={onPress}
      disabled={loading}
      style={({ pressed }) => [
        styles.button,
        isPrimary ? styles.primary : styles.secondary,
        pressed && styles.pressed,
        loading && styles.disabled,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={isPrimary ? '#FFFFFF' : Colors.primary} />
      ) : (
        <Text style={[styles.label, isPrimary ? styles.primaryLabel : styles.secondaryLabel]}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: {
    backgroundColor: Colors.primary,
  },
  secondary: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  pressed: {
    opacity: 0.8,
  },
  disabled: {
    opacity: 0.6,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: Fonts.family,
  },
  primaryLabel: {
    color: '#FFFFFF',
  },
  secondaryLabel: {
    color: Colors.primary,
  },
});