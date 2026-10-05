import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet } from 'react-native';
import { useWishlist } from '@/providers/wishlist';
import { C } from '@/constants/theme';

export function HeartButton({ productId, size = 18 }: { productId: number; size?: number }) {
  const { has, toggle } = useWishlist();
  const saved = has(productId);
  return (
    <Pressable
      onPress={() => toggle(productId)}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={saved ? 'Remove from wishlist' : 'Add to wishlist'}
      style={({ pressed }) => [styles.btn, pressed && { opacity: 0.7 }]}>
      <Ionicons name={saved ? 'heart' : 'heart-outline'} size={size} color={saved ? C.accent : C.ink} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(253,251,247,0.85)', alignItems: 'center', justifyContent: 'center' },
});
