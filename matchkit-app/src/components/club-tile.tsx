import { Image } from 'expo-image';
import { Link } from 'expo-router';
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

export function ClubTile({ club, width }: { club: Club; width: number }) {
  const logo = Math.round(Math.min(64, width * 0.45));
  return (
    <Link href={{ pathname: '/club/[slug]', params: { slug: club.slug } }} asChild>
      <Pressable style={({ pressed }) => [styles.tile, { width, height: width }, pressed && { backgroundColor: C.sandDark }]}>
        {club.logo ? (
          <Image source={club.logo} style={{ width: logo, height: logo }} contentFit="contain" />
        ) : (
          <View style={[styles.initials, { width: logo, height: logo, borderRadius: logo / 2 }]}>
            <T style={{ fontFamily: F.medium, fontSize: 12 }}>{initials(club.name)}</T>
          </View>
        )}
        <T numberOfLines={2} style={styles.name}>
          {club.name}
        </T>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  tile: { backgroundColor: C.sand, alignItems: 'center', justifyContent: 'center', gap: 8, padding: 6 },
  initials: { borderWidth: 1, borderColor: 'rgba(22,21,19,0.3)', alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: 11, textAlign: 'center', lineHeight: 14 },
});
