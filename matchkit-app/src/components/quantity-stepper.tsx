import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { C, F } from '@/constants/theme';

export function QuantityStepper({ value, onChange, min = 1, max }: { value: number; onChange: (v: number) => void; min?: number; max: number }) {
  const step = (d: number) => {
    const next = Math.min(max, Math.max(min, value + d));
    if (next !== value) {
      Haptics.selectionAsync();
      onChange(next);
    }
  };
  return (
    <View style={styles.wrap} accessibilityRole="adjustable" accessibilityValue={{ min, max, now: value }}>
      <Pressable onPress={() => step(-1)} disabled={value <= min} style={styles.btn} accessibilityLabel="Decrease quantity" hitSlop={4}>
        <Text style={[styles.sign, value <= min && { color: C.line }]}>−</Text>
      </Pressable>
      <Text style={styles.value}>{value}</Text>
      <Pressable onPress={() => step(1)} disabled={value >= max} style={styles.btn} accessibilityLabel="Increase quantity" hitSlop={4}>
        <Text style={[styles.sign, value >= max && { color: C.line }]}>+</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', height: 46, borderWidth: 1, borderColor: C.line, backgroundColor: C.paper },
  btn: { width: 44, height: '100%', alignItems: 'center', justifyContent: 'center' },
  sign: { fontFamily: F.light, fontSize: 22, color: C.ink },
  value: { width: 30, textAlign: 'center', fontFamily: F.regular, fontSize: 15, color: C.ink },
});
