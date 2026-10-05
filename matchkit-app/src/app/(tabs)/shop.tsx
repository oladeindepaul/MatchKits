import { useMemo, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { Pressable, RefreshControl, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useCatalog } from '@/providers/catalog';
import { filterProducts, type Filters } from '@/lib/catalog';
import { PRICE_RANGES } from '@/lib/format';
import { ProductGrid } from '@/components/product-grid';
import { Chip } from '@/components/chip';
import { Button, Empty, Eyebrow, Loading, T, Title } from '@/components/ui';
import { C, F, GUTTER } from '@/constants/theme';

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Eyebrow style={{ paddingHorizontal: GUTTER, marginBottom: 8 }}>{label}</Eyebrow>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: GUTTER }}>
        {children}
      </ScrollView>
    </View>
  );
}

export default function Shop() {
  const params = useLocalSearchParams<{ league?: string; q?: string }>();
  const { products, leagues, clubs, loading, refresh } = useCatalog();
  const [filters, setFilters] = useState<Filters>(() => (params.league ? { league: params.league } : {}));
  const [query, setQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Arriving from Home with a league selected.
  const [lastLeagueParam, setLastLeagueParam] = useState(params.league);
  if (params.league !== lastLeagueParam) {
    setLastLeagueParam(params.league);
    if (params.league) setFilters((f) => ({ ...f, league: params.league, club: undefined }));
  }

  const set = (patch: Partial<Filters>) => setFilters((f) => ({ ...f, ...patch }));
  const toggle = (key: keyof Filters, value: string) => set({ [key]: filters[key] === value ? undefined : value });

  const results = useMemo(() => filterProducts(products, { ...filters, q: query }, PRICE_RANGES), [products, filters, query]);
  const visibleClubs = filters.league ? clubs.filter((c) => c.league.slug === filters.league) : clubs;
  const activeCount = [filters.league, filters.club, filters.kit, filters.price, filters.sort].filter(Boolean).length;

  const onRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: C.cream }}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.ink} />}
        contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={{ paddingHorizontal: GUTTER, paddingTop: 20 }}>
          <Eyebrow>{leagues.find((l) => l.slug === filters.league)?.name ?? 'All leagues'}</Eyebrow>
          <Title style={{ marginTop: 6 }}>{query ? `“${query}”` : 'All jerseys'}</Title>

          <View style={styles.search}>
            <Ionicons name="search-outline" size={17} color={C.stone} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search jerseys, clubs or leagues"
              placeholderTextColor={C.stone}
              style={styles.input}
              returnKeyType="search"
              autoCorrect={false}
              clearButtonMode="while-editing"
            />
            {query ? (
              <Pressable onPress={() => setQuery('')} hitSlop={8} accessibilityLabel="Clear search">
                <Ionicons name="close-circle" size={18} color={C.stone} />
              </Pressable>
            ) : null}
          </View>

          <View style={styles.toolbar}>
            <T style={{ color: C.stone, fontSize: 13 }}>
              {results.length} jersey{results.length === 1 ? '' : 's'}
            </T>
            <View style={{ flexDirection: 'row', gap: 18 }}>
              {activeCount > 0 && (
                <Pressable onPress={() => setFilters({})} hitSlop={8}>
                  <Eyebrow style={{ color: C.accent }}>Clear</Eyebrow>
                </Pressable>
              )}
              <Pressable onPress={() => setShowFilters((v) => !v)} hitSlop={8} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="options-outline" size={16} color={C.ink} />
                <Eyebrow style={{ color: C.ink }}>Filters{activeCount ? ` (${activeCount})` : ''}</Eyebrow>
              </Pressable>
            </View>
          </View>
        </View>

        {showFilters && (
          <View style={styles.filters}>
            <Row label="League">
              {leagues.map((l) => (
                <Chip key={l.slug} label={l.shortName} active={filters.league === l.slug} onPress={() => set({ league: filters.league === l.slug ? undefined : l.slug, club: undefined })} />
              ))}
            </Row>
            <Row label="Club">
              {visibleClubs.map((c) => (
                <Chip key={c.slug} label={c.name} active={filters.club === c.slug} onPress={() => toggle('club', c.slug)} />
              ))}
            </Row>
            <Row label="Kit">
              {['home', 'away', 'third'].map((k) => (
                <Chip key={k} label={k} active={filters.kit === k} onPress={() => toggle('kit', k)} />
              ))}
            </Row>
            <Row label="Price">
              {PRICE_RANGES.map((r) => (
                <Chip key={r.value} label={r.label} active={filters.price === r.value} onPress={() => toggle('price', r.value)} />
              ))}
            </Row>
            <Row label="Sort">
              {[
                { value: 'price-asc', label: 'Price ↑' },
                { value: 'price-desc', label: 'Price ↓' },
                { value: 'name', label: 'A–Z' },
              ].map((s) => (
                <Chip key={s.value} label={s.label} active={filters.sort === s.value} onPress={() => toggle('sort', s.value)} />
              ))}
            </Row>
          </View>
        )}

        <View style={{ paddingHorizontal: GUTTER }}>
          {loading ? (
            <Loading />
          ) : results.length ? (
            <ProductGrid products={results} />
          ) : (
            <Empty
              title="No jerseys match"
              message="Try a different club or league, or clear the filters."
              action={<Button variant="outline" label="Clear filters" onPress={() => { setFilters({}); setQuery(''); }} />}
            />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  search: { flexDirection: 'row', alignItems: 'center', gap: 10, borderBottomWidth: 1, borderBottomColor: C.ink, marginTop: 18, paddingBottom: 6 },
  input: { flex: 1, fontFamily: F.regular, fontSize: 16, color: C.ink, paddingVertical: 6 },
  toolbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 16 },
  filters: { paddingTop: 4, paddingBottom: 10, marginBottom: 12, borderTopWidth: 1, borderBottomWidth: 1, borderColor: C.line, backgroundColor: C.paper },
});
