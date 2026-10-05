import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Pressable, ScrollView, useWindowDimensions, View } from 'react-native';
import { useCatalog } from '@/providers/catalog';
import { ClubTile } from '@/components/club-tile';
import { Eyebrow, Loading, T } from '@/components/ui';
import { C, F, GUTTER } from '@/constants/theme';

export default function LeaguesScreen() {
  const { leagues, clubs, loading } = useCatalog();
  const { width } = useWindowDimensions();
  if (loading) return <Loading />;
  const cols = width >= 600 ? 5 : 3;
  const tile = (width - GUTTER * 2 - 10 * (cols - 1)) / cols;

  return (
    <ScrollView contentContainerStyle={{ padding: GUTTER, paddingBottom: 48, gap: 32 }}>
      {leagues.map((league) => (
        <View key={league.slug}>
          <Pressable
            onPress={() => router.push({ pathname: '/league/[slug]', params: { slug: league.slug } })}
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: C.line, paddingBottom: 10, marginBottom: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              {league.logo && <Image source={league.logo} style={{ width: 32, height: 32 }} contentFit="contain" />}
              <T style={{ fontFamily: F.light, fontSize: 20 }}>{league.name}</T>
            </View>
            <Eyebrow style={{ color: C.accent }}>Shop</Eyebrow>
          </Pressable>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {clubs
              .filter((c) => c.league.slug === league.slug)
              .map((c) => (
                <ClubTile key={c.slug} club={c} width={tile} />
              ))}
          </View>
        </View>
      ))}
    </ScrollView>
  );
}
