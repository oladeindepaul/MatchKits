import { Pressable, StyleSheet, Text } from 'react-native';
import * as Haptics from 'expo-haptics';
import { C, F } from '@/constants/theme';

export function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={() => {
        Haptics.selectionAsync();
        onPress();
      }}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      style={[styles.chip, active && styles.active]}>
      <Text style={[styles.text, active && { color: C.cream }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: { paddingHorizontal: 14, height: 34, justifyContent: 'center', borderWidth: 1, borderColor: C.line, backgroundColor: C.paper },
  active: { backgroundColor: C.ink, borderColor: C.ink },
  text: { fontFamily: F.medium, fontSize: 11, letterSpacing: 1.6, textTransform: 'uppercase', color: C.ink },
});
