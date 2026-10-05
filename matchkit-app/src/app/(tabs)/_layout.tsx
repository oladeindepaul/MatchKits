import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';
import type { ColorValue } from 'react-native';
import { useCart } from '@/providers/cart';
import { useWishlist } from '@/providers/wishlist';
import { C, F } from '@/constants/theme';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

function TabIcon({ name, active, color, focused }: { name: IconName; active: IconName; color: ColorValue; focused: boolean }) {
  return <Ionicons name={focused ? active : name} size={22} color={color} />;
}

const icon = (name: IconName, active: IconName) =>
  function Icon({ color, focused }: { color: ColorValue; focused: boolean }) {
    return <TabIcon name={name} active={active} color={color} focused={focused} />;
  };

export default function TabsLayout() {
  const { count } = useCart();
  const { ids } = useWishlist();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: C.ink,
        tabBarInactiveTintColor: C.stone,
        tabBarStyle: { backgroundColor: C.cream, borderTopColor: C.line },
        tabBarLabelStyle: { fontFamily: F.medium, fontSize: 10, letterSpacing: 0.6 },
        tabBarBadgeStyle: { backgroundColor: C.accent, color: C.white, fontFamily: F.semibold, fontSize: 10 },
      }}>
      <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: icon('home-outline', 'home') }} />
      <Tabs.Screen name="shop" options={{ title: 'Shop', tabBarIcon: icon('shirt-outline', 'shirt') }} />
      <Tabs.Screen
        name="wishlist"
        options={{ title: 'Wishlist', tabBarIcon: icon('heart-outline', 'heart'), tabBarBadge: ids.size || undefined }}
      />
      <Tabs.Screen name="cart" options={{ title: 'Cart', tabBarIcon: icon('bag-outline', 'bag'), tabBarBadge: count || undefined }} />
      <Tabs.Screen name="account" options={{ title: 'Account', tabBarIcon: icon('person-outline', 'person') }} />
    </Tabs>
  );
}
