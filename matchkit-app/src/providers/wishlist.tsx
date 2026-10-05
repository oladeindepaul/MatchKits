import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { AppState } from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { supabase } from '@/lib/supabase';
import { useAuth } from './auth';

type WishlistValue = { ids: Set<number>; has: (id: number) => boolean; toggle: (id: number) => void; refresh: () => Promise<void> };

const WishlistContext = createContext<WishlistValue | null>(null);

// Shared with the website's wishlist (wishlist_items). Requires an account, like on the web.
export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const [ids, setIds] = useState<Set<number>>(new Set());

  const refresh = useCallback(async () => {
    if (!userId) return;
    const { data, error } = await supabase.from('wishlist_items').select('product_id');
    if (!error) setIds(new Set((data ?? []).map((r) => r.product_id as number)));
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    supabase
      .from('wishlist_items')
      .select('product_id')
      .then(({ data, error }) => !error && setIds(new Set((data ?? []).map((r) => r.product_id as number))));
    const channel = supabase
      .channel(`app-wishlist-${userId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'wishlist_items', filter: `user_id=eq.${userId}` }, refresh)
      .subscribe();
    const sub = AppState.addEventListener('change', (s) => s === 'active' && refresh());
    return () => {
      supabase.removeChannel(channel);
      sub.remove();
    };
  }, [userId, refresh]);

  const toggle = useCallback(
    async (productId: number) => {
      if (!userId) {
        router.push('/login');
        return;
      }
      const adding = !ids.has(productId);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setIds((prev) => {
        const next = new Set(prev);
        if (adding) next.add(productId);
        else next.delete(productId);
        return next;
      });
      const { error } = adding
        ? await supabase.from('wishlist_items').upsert({ user_id: userId, product_id: productId })
        : await supabase.from('wishlist_items').delete().match({ user_id: userId, product_id: productId });
      if (error) refresh();
    },
    [userId, ids, refresh]
  );

  // Signed out: nothing is saved (the stored set is ignored until someone logs in).
  const visible = useMemo(() => (userId ? ids : new Set<number>()), [userId, ids]);
  const value = useMemo(() => ({ ids: visible, has: (id: number) => visible.has(id), toggle, refresh }), [visible, toggle, refresh]);
  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error('useWishlist must be used inside WishlistProvider');
  return ctx;
}
