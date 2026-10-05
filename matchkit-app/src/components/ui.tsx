import { ActivityIndicator, Pressable, StyleSheet, Text, View, type PressableProps, type TextProps, type ViewStyle } from 'react-native';
import { C, F } from '@/constants/theme';

export function T({ style, ...props }: TextProps) {
  return <Text {...props} style={[styles.body, style]} />;
}

// Small spaced capitals, as in the website's nav and labels.
export function Eyebrow({ style, ...props }: TextProps) {
  return <Text {...props} style={[styles.eyebrow, style]} />;
}

// "/ Heading" titles, the website's signature style.
export function Title({ children, size = 30, style }: { children: React.ReactNode; size?: number; style?: TextProps['style'] }) {
  return (
    <Text style={[styles.title, { fontSize: size }, style]}>
      <Text style={styles.slash}>/ </Text>
      {children}
    </Text>
  );
}

type ButtonProps = Omit<PressableProps, 'style'> & {
  label: string;
  variant?: 'solid' | 'outline';
  loading?: boolean;
  style?: ViewStyle;
};

export function Button({ label, variant = 'solid', loading, disabled, style, ...props }: ButtonProps) {
  const solid = variant === 'solid';
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || loading}
      {...props}
      style={({ pressed }) => [
        styles.button,
        solid ? styles.solid : styles.outline,
        pressed && { opacity: 0.85 },
        (disabled || loading) && { opacity: 0.45 },
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={solid ? C.cream : C.accent} />
      ) : (
        <Text style={[styles.buttonText, { color: solid ? C.cream : C.accent }]}>{label}</Text>
      )}
    </Pressable>
  );
}

export function Empty({ title, message, action }: { title: string; message?: string; action?: React.ReactNode }) {
  return (
    <View style={styles.empty}>
      <T style={styles.emptyTitle}>{title}</T>
      {message ? <T style={styles.emptyMessage}>{message}</T> : null}
      {action ? <View style={{ marginTop: 24 }}>{action}</View> : null}
    </View>
  );
}

export function Loading() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 }}>
      <ActivityIndicator color={C.ink} />
    </View>
  );
}

export const styles = StyleSheet.create({
  body: { fontFamily: F.regular, fontSize: 15, color: C.ink },
  eyebrow: { fontFamily: F.medium, fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: C.stone },
  title: { fontFamily: F.light, color: C.ink },
  slash: { color: C.stone },
  button: { minHeight: 50, paddingHorizontal: 24, alignItems: 'center', justifyContent: 'center' },
  solid: { backgroundColor: C.ink },
  outline: { borderWidth: 1, borderColor: C.accent },
  buttonText: { fontFamily: F.medium, fontSize: 12, letterSpacing: 2.4, textTransform: 'uppercase' },
  empty: { backgroundColor: C.sand, paddingVertical: 48, paddingHorizontal: 24, alignItems: 'center' },
  emptyTitle: { fontFamily: F.light, fontSize: 19, textAlign: 'center' },
  emptyMessage: { color: C.stone, marginTop: 8, textAlign: 'center', fontSize: 14 },
});
