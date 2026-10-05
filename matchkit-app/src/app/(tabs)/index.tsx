import { useMemo, useState } from 'react';
import { Image } from 'expo-image';
import { Link, router } from 'expo-router';
import { Pressable, RefreshControl, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useCatalog } from '@/providers/catalog';
import { useCart } from '@/providers/cart';
import { Hero } from '@/components/hero';
import { ProductGrid } from '@/components/product-grid';
import { Chip } from '@/components/chip';
import { Empty, Eyebrow, Loading, T, Title } from '@/components/ui';
import type { Product } from '@/lib/catalog';
import { C, F, GUTTER } from '@/constants/theme';

// One jersey per club, spread across leagues, so the default grid isn't all Premier League.
function interleave(items: Product[]) {
  const byLeague = new Map<string, Product[]>();
  const seen = new Set<string>();
  for (const p of items) {
    if (seen.has(p.club.slug)) continue;
    seen.add(p.club.slug);
    byLeague.set(p.club.league.slug, [...(byLeague.get(p.club.league.slug) ?? []), p]);
  }
  const lists = [...byLeague.values()];
  const out: Product[] = [];
  for (let i = 0; out.length < seen.size; i++) for (const l of lists) if (l[i]) out.push(l[i]);
  return out;
}

export default function Home() {
  const { products, leagues, loading, error, refresh } = useCatalog();
  const cart = useCart();
  const { width } = useWindowDimensions();
  const [league, setLeague] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const featured = useMemo(() => products.filter((p) => p.featured), [products]);
  const pool = useMemo(() => (league ? products.filter((p) => p.club.league.slug === league) : interleave(products)), [products, league]);
  const tileWidth = (width - GUTTER * 2 - 10 * 2) / 3;

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refresh(), cart.refresh()]);
    setRefreshing(false);
  };

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: C.cream }}>
      <View style={styles.header}>
        <Pressable onPress={() => router.push('/leagues')} hitSlop={8} accessibilityLabel="Leagues and clubs">
          <Ionicons name="grid-outline" size={20} color={C.ink} />
        </Pressable>
        <Image source={require('@/assets/images/matchkit-logo.jpeg')} style={styles.logo} contentFit="cover" accessibilityLabel="MatchKit" />
        <Pressable onPress={() => router.push('/shop')} hitSlop={8} accessibilityLabel="Search jerseys">
          <Ionicons name="search-outline" size={21} color={C.ink} />
        </Pressable>
      </View>

      {loading ? (
        <Loading />
      ) : error ? (
        <View style={{ padding: GUTTER }}>
          <Empty title="Couldn't load jerseys" message="Check your internet connection and pull down to try again." />
        </View>
      ) : (
        <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.ink} />} contentContainerStyle={{ paddingBottom: 40 }}>
          <View style={{ paddingTop: 12 }}>
            <Hero slides={featured} />
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
            <Chip label="All" active={!league} onPress={() => setLeague(null)} />
            {leagues.map((l) => (
              <Chip key={l.slug} label={l.shortName} active={league === l.slug} onPress={() => setLeague(league === l.slug ? null : l.slug)} />
            ))}
          </ScrollView>

          <View style={{ paddingHorizontal: GUTTER }}>
            <ProductGrid products={pool.slice(0, 8)} />
            <Pressable
              onPress={() => router.push({ pathname: '/shop', params: league ? { league } : {} })}
              style={styles.viewAll}>
              <Eyebrow style={{ color: C.accent }}>
                View all {league ? pool.length : products.length} jerseys
              </Eyebrow>
              <Ionicons name="arrow-forward" size={16} color={C.accent} />
            </Pressable>

            <View style={styles.sectionHead}>
              <Title size={22}>Shop by league</Title>
              <Link href="/leagues">
                <Eyebrow style={{ color: C.accent }}>All clubs</Eyebrow>
              </Link>
            </View>
            <View style={styles.leagueGrid}>
              {leagues.map((l) => (
                <Pressable
                  key={l.slug}
                  onPress={() => router.push({ pathname: '/league/[slug]', params: { slug: l.slug } })}
                  style={({ pressed }) => [styles.leagueTile, { width: tileWidth }, pressed && { backgroundColor: C.sandDark }]}>
                  {l.logo ? (
                    <Image source={l.logo} style={{ width: tileWidth * 0.5, height: tileWidth * 0.5 }} contentFit="contain" />
                  ) : (
                    <T style={{ fontFamily: F.light, fontSize: 22, letterSpacing: 4 }}>INT</T>
                  )}
                  <Eyebrow numberOfLines={1} style={{ fontSize: 9, color: C.ink, letterSpacing: 1.2 }}>
                    {l.name}
                  </Eyebrow>
                </Pressable>
              ))}
            </View>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: GUTTER, borderBottomWidth: 1, borderBottomColor: C.line },
  logo: { width: 170, height: 56 },
  chips: { gap: 8, paddingHorizontal: GUTTER, paddingVertical: 24 },
  viewAll: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 24 },
  sectionHead: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 24, marginBottom: 14 },
  leagueGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  leagueTile: { aspectRatio: 0.9, backgroundColor: C.sand, alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, paddingHorizontal: 6 },
});
