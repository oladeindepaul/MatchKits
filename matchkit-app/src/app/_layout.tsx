import { useEffect } from 'react';
import { DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { Jost_300Light, Jost_400Regular, Jost_500Medium, Jost_600SemiBold, useFonts } from '@expo-google-fonts/jost';
import { AuthProvider } from '@/providers/auth';
import { CatalogProvider } from '@/providers/catalog';
import { CartProvider } from '@/providers/cart';
import { WishlistProvider } from '@/providers/wishlist';
import { C, F } from '@/constants/theme';

SplashScreen.preventAutoHideAsync();

const theme = { ...DefaultTheme, colors: { ...DefaultTheme.colors, background: C.cream, card: C.cream, text: C.ink, primary: C.accent, border: C.line } };

export default function RootLayout() {
  const [fontsLoaded] = useFonts({ Jost_300Light, Jost_400Regular, Jost_500Medium, Jost_600SemiBold });

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <ThemeProvider value={theme}>
      <AuthProvider>
        <CatalogProvider>
          <CartProvider>
            <WishlistProvider>
              <StatusBar style="dark" />
              <Stack
                screenOptions={{
                  headerStyle: { backgroundColor: C.cream },
                  headerTintColor: C.ink,
                  headerTitleStyle: { fontFamily: F.medium, fontSize: 16 },
                  headerShadowVisible: false,
                  headerBackButtonDisplayMode: 'minimal',
                  contentStyle: { backgroundColor: C.cream },
                }}>
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="product/[slug]" options={{ title: '' }} />
                <Stack.Screen name="league/[slug]" options={{ title: '' }} />
                <Stack.Screen name="club/[slug]" options={{ title: '' }} />
                <Stack.Screen name="leagues" options={{ title: 'Leagues & clubs' }} />
                <Stack.Screen name="checkout" options={{ title: 'Checkout' }} />
                <Stack.Screen name="order/[id]" options={{ title: 'Order' }} />
                <Stack.Screen name="login" options={{ title: 'Log in', presentation: 'modal' }} />
                <Stack.Screen name="register" options={{ title: 'Create account', presentation: 'modal' }} />
              </Stack>
            </WishlistProvider>
          </CartProvider>
        </CatalogProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
