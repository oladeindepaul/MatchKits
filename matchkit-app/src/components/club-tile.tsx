import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import type { Club } from '@/lib/catalog';
import { C, F } from '@/constants/theme';
import { T } from './ui';

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter((w) => /^[A-Za-zÀ-ÿ]/.test(w))
    .slice(0, 3)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

// Every tile is the same size: an identical square box for the crest, centred, with a fixed
// two-line space for the name underneath, so rows line up whatever the crest shape or name length.
// (A plain Pressable with router.push: wrapping it in <Link asChild> dropped these styles on Android.)
export function ClubTile({ club, width }: { club: Club; width: number }) {
  const logo = Math.round(Math.min(64, width * 0.48));
  return (
    <Pressable
      onPress={() => router.push({ pathname: '/club/[slug]', params: { slug: club.slug } })}
      accessibilityRole="button"
      accessibilityLabel={club.name}
      style={({ pressed }) => [styles.tile, { width, backgroundColor: pressed ? C.sandDark : C.sand }]}>
      <View style={[styles.logoBox, { width: logo, height: logo }]}>
        {club.logo ? (
          <Image source={club.logo} style={{ width: logo, height: logo }} contentFit="contain" />
        ) : (
          <View style={[styles.initials, { width: logo, height: logo, borderRadius: logo / 2 }]}>
            <T style={{ fontFamily: F.medium, fontSize: 12 }}>{initials(club.name)}</T>
          </View>
        )}
      </View>
      <View style={styles.nameBox}>
        <T numberOfLines={2} style={styles.name}>
          {club.name}
        </T>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: { alignItems: 'center', paddingTop: 16, paddingBottom: 10, paddingHorizontal: 6 },
  logoBox: { alignItems: 'center', justifyContent: 'center' },
  initials: { borderWidth: 1, borderColor: 'rgba(22,21,19,0.3)', alignItems: 'center', justifyContent: 'center' },
  // Fixed height for two lines keeps every tile the same height.
  nameBox: { height: 32, marginTop: 10, alignSelf: 'stretch', justifyContent: 'center' },
  name: { fontSize: 11, lineHeight: 14, textAlign: 'center' },
});
