import { Image } from 'expo-image';
import { Stack, useLocalSearchParams } from 'expo-router';
import { ScrollView, useWindowDimensions, View } from 'react-native';
import { useCatalog } from '@/providers/catalog';
import { formatNaira } from '@/lib/format';
import { ClubTile } from '@/components/club-tile';
import { ProductGrid } from '@/components/product-grid';
import { Empty, Eyebrow, Loading, Title } from '@/components/ui';
import { GUTTER } from '@/constants/theme';

export default function LeagueScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { leagues, clubs, products, loading } = useCatalog();
  const { width } = useWindowDimensions();
  const league = leagues.find((l) => l.slug === slug);
  if (loading) return <Loading />;
  if (!league) return <Empty title="League not found" />;

  const leagueClubs = clubs.filter((c) => c.league.slug === slug);
  const leagueProducts = products.filter((p) => p.club.league.slug === slug);
  const prices = leagueProducts.map((p) => p.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const cols = width >= 600 ? 5 : 3;
  const tile = (width - GUTTER * 2 - 10 * (cols - 1)) / cols;
  const isIntl = slug === 'international';

  return (
    <>
      <Stack.Screen options={{ title: league.name }} />
      <ScrollView contentContainerStyle={{ padding: GUTTER, paddingBottom: 48 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <View style={{ flex: 1 }}>
            <Eyebrow>
              {leagueClubs.length} {isIntl ? 'nations' : 'clubs'} · {leagueProducts.length} jerseys
            </Eyebrow>
            <Eyebrow style={{ marginTop: 4 }}>{min === max ? formatNaira(min) : `${formatNaira(min)} – ${formatNaira(max)}`}</Eyebrow>
            <Title style={{ marginTop: 8 }}>{league.name}</Title>
          </View>
          {league.logo && <Image source={league.logo} style={{ width: 64, height: 64 }} contentFit="contain" />}
        </View>

        <Eyebrow style={{ marginTop: 28, marginBottom: 10 }}>Choose a {isIntl ? 'nation' : 'club'}</Eyebrow>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          {leagueClubs.map((c) => (
            <ClubTile key={c.slug} club={c} width={tile} />
          ))}
        </View>

        <Eyebrow style={{ marginTop: 32, marginBottom: 10 }}>All {league.shortName} jerseys</Eyebrow>
        <ProductGrid products={leagueProducts} />
      </ScrollView>
    </>
  );
}
