import { useWindowDimensions, View } from 'react-native';
import type { Product } from '@/lib/catalog';
import { GUTTER } from '@/constants/theme';
import { ProductCard } from './product-card';

const GAP = 10;

// 2 columns on phones, 3 on large phones in landscape, foldables and tablets.
export function useGridColumns() {
  const { width } = useWindowDimensions();
  const columns = width >= 900 ? 4 : width >= 600 ? 3 : 2;
  const cardWidth = (width - GUTTER * 2 - GAP * (columns - 1)) / columns;
  return { columns, cardWidth };
}

export function ProductGrid({ products }: { products: Product[] }) {
  const { cardWidth } = useGridColumns();
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: GAP }}>
      {products.map((p) => (
        <ProductCard key={p.id} product={p} width={cardWidth} />
      ))}
    </View>
  );
}
