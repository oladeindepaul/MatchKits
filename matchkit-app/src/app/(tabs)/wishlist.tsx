import { useState } from 'react';
import { router } from 'expo-router';
import { RefreshControl, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/providers/auth';
import { useCatalog } from '@/providers/catalog';
import { useWishlist } from '@/providers/wishlist';
import { ProductGrid } from '@/components/product-grid';
import { Button, Empty, Title } from '@/components/ui';
import { C, GUTTER } from '@/constants/theme';

export default function WishlistScreen() {
  const { user } = useAuth();
  const { products } = useCatalog();
  const { ids, refresh } = useWishlist();
  const [refreshing, setRefreshing] = useState(false);
  const saved = products.filter((p) => ids.has(p.id));

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: C.cream }}>
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true);
              await refresh();
              setRefreshing(false);
            }}
            tintColor={C.ink}
          />
        }
        contentContainerStyle={{ padding: GUTTER, paddingBottom: 40, gap: 20 }}>
        <Title style={{ marginTop: 4 }}>Wishlist</Title>
        {!user ? (
          <Empty title="Log in to see your saved jerseys." message="Your wishlist is saved to your MatchKit account." action={<Button variant="outline" label="Log in or register" onPress={() => router.push('/login')} />} />
        ) : saved.length ? (
          <ProductGrid products={saved} />
        ) : (
          <Empty title="No saved jerseys yet." message="Tap the heart on any jersey to keep it here." action={<Button variant="outline" label="Browse jerseys" onPress={() => router.navigate('/shop')} />} />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
