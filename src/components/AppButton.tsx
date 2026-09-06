import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';

import { Colors, Fonts } from '../navigation/theme';

type AppButtonProps = {
  /** Spanish label shown inside the button. */
  label: string;
  /** Visual style; primary is filled, secondary is outlined, danger is red. */
  variant?: 'primary' | 'secondary' | 'danger';
  /** Called when the button is pressed. */
  onPress?: () => void;
  /** Shows a spinner and disables taps while an async action runs. */
  loading?: boolean;
  /** When true the button sizes to its label instead of stretching full width. */
  fit?: boolean;
};

/**
 * Shared app button with primary (filled), secondary (outlined) and danger
 * (red) variants. Uses Pressable so it gives visual feedback while pressed.
 */
export function AppButton({ label, variant = 'primary', onPress, loading = false, fit = false }: AppButtonProps) {
  const isPrimary = variant === 'primary';
  const isDanger = variant === 'danger';

  return (
    <Pressable
      onPress={onPress}
      disabled={loading}
      style={({ pressed }) => [
        styles.button,
        variant === 'primary' && styles.primary,
        variant === 'secondary' && styles.secondary,
        isDanger && styles.danger,
        fit && styles.fit,
        pressed && styles.pressed,
        loading && styles.disabled,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={isDanger ? '#FFFFFF' : isPrimary ? '#FFFFFF' : Colors.primary} />
      ) : (
        <Text style={[styles.label, isDanger ? styles.dangerLabel : isPrimary ? styles.primaryLabel : styles.secondaryLabel]}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'stretch',
  },
  fit: {
    alignSelf: 'flex-start',
  },
  primary: {
    backgroundColor: Colors.primary,
  },
  secondary: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  danger: {
    backgroundColor: Colors.danger,
  },
  dangerLabel: {
    color: '#FFFFFF',
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