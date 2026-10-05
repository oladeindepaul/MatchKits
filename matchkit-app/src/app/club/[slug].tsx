import { Image } from 'expo-image';
import { Stack, useLocalSearchParams } from 'expo-router';
import { ScrollView, View } from 'react-native';
import { useCatalog } from '@/providers/catalog';
import { ProductGrid } from '@/components/product-grid';
import { Empty, Eyebrow, Loading, Title } from '@/components/ui';
import { GUTTER } from '@/constants/theme';

export default function ClubScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { clubs, products, loading } = useCatalog();
  const club = clubs.find((c) => c.slug === slug);
  if (loading) return <Loading />;
  if (!club) return <Empty title="Club not found" />;

  const kits = products.filter((p) => p.club.slug === slug);
  const more = products.filter((p) => p.club.league.slug === club.league.slug && p.club.slug !== slug && p.kitType === 'home').slice(0, 4);

  return (
    <>
      <Stack.Screen options={{ title: club.name }} />
      <ScrollView contentContainerStyle={{ padding: GUTTER, paddingBottom: 48 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 24 }}>
          {club.logo && <Image source={club.logo} style={{ width: 64, height: 64 }} contentFit="contain" />}
          <View style={{ flex: 1 }}>
            <Eyebrow>
              {club.league.name} · {kits.length} kit{kits.length === 1 ? '' : 's'}
            </Eyebrow>
            <Title size={28} style={{ marginTop: 6 }}>
              {club.name}
            </Title>
          </View>
        </View>
        <ProductGrid products={kits} />
        {more.length > 0 && (
          <View style={{ marginTop: 36 }}>
            <Title size={20} style={{ marginBottom: 14 }}>
              More from {club.league.name}
            </Title>
            <ProductGrid products={more} />
          </View>
        )}
      </ScrollView>
    </>
  );
}
