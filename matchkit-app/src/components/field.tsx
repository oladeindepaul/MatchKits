import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';
import { C, F } from '@/constants/theme';
import { Eyebrow, T } from './ui';

export function Field({ label, error, ...props }: TextInputProps & { label: string; error?: string }) {
  return (
    <View style={{ gap: 6 }}>
      <Eyebrow>{label}</Eyebrow>
      <TextInput placeholderTextColor={C.stone} {...props} style={[styles.input, error ? { borderColor: C.danger } : null, props.style]} />
      {error ? <T style={{ color: C.danger, fontSize: 12 }}>{error}</T> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  input: { borderWidth: 1, borderColor: C.line, backgroundColor: C.paper, paddingHorizontal: 14, paddingVertical: 12, fontFamily: F.regular, fontSize: 16, color: C.ink },
});
