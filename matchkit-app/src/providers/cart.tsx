import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { supabase } from '@/lib/supabase';
import { MAX_QTY, storageUrl } from '@/lib/format';
import { useAuth } from './auth';

export type CartLine = {
  productId: number;
  slug: string;
  name: string;
  clubName: string;
  kitType: string;
  price: number;
  image: string | null;
  size: string;
  quantity: number;
};

type CartValue = {
  lines: CartLine[];
  ready: boolean;
  count: number;
  subtotal: number;
  add: (line: Omit<CartLine, 'quantity'>, quantity: number) => void;
  setQuantity: (productId: number, size: string, quantity: number) => void;
  remove: (productId: number, size: string) => void;
  refresh: () => Promise<void>;
  clearLocal: () => void;
};

type DbCartRow = {
  product_id: number;
  size: string;
  quantity: number;
  products: { slug: string; name: string; price: number; kit_type: string; product_images: { path: string }[]; clubs: { name: string } };
};

const KEY = 'matchkit-cart';
const CartContext = createContext<CartValue | null>(null);
const same = (a: { productId: number; size: string }, b: { productId: number; size: string }) => a.productId === b.productId && a.size === b.size;

function readLocal(): CartLine[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]') as CartLine[];
  } catch {
    return [];
  }
}
function writeLocal(lines: CartLine[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(lines));
  } catch {
    // Storage unavailable: the cart still works for this session.
  }
}

// Works exactly like the website's cart: guests keep it on the device; signed-in shoppers share one
// cart in Supabase (cart_items) with the website, kept in step live in both directions.
export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const [lines, setLines] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);
  const linesRef = useRef<CartLine[]>([]);

  const commit = useCallback((next: CartLine[]) => {
    linesRef.current = next;
    setLines(next);
    writeLocal(next);
  }, []);

  const fetchSaved = useCallback(async (): Promise<CartLine[] | null> => {
    const { data, error } = await supabase
      .from('cart_items')
      .select('product_id, size, quantity, created_at, products(slug, name, price, kit_type, product_images(path), clubs(name))')
      .order('created_at');
    if (error) return null;
    return (data as unknown as DbCartRow[]).map((r) => ({
      productId: r.product_id,
      slug: r.products.slug,
      name: r.products.name,
      clubName: r.products.clubs.name,
      kitType: r.products.kit_type,
      price: r.products.price,
      image: storageUrl(r.products.product_images[0]?.path),
      size: r.size,
      quantity: r.quantity,
    }));
  }, []);

  // Initial load, and merging a guest cart into the account when someone logs in.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const local = readLocal();
      if (!userId) {
        if (!cancelled) commit(local);
        setReady(true);
        return;
      }
      const saved = await fetchSaved();
      if (!saved) {
        if (!cancelled) commit(local);
        setReady(true);
        return;
      }
      const guestOnly = local.filter((l) => !saved.some((s) => same(s, l)));
      if (guestOnly.length) {
        await supabase
          .from('cart_items')
          .upsert(
            guestOnly.map((l) => ({ user_id: userId, product_id: l.productId, size: l.size, quantity: l.quantity })),
            { onConflict: 'user_id,product_id,size' }
          );
      }
      if (!cancelled) commit([...saved, ...guestOnly]);
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [userId, commit, fetchSaved]);

  const refresh = useCallback(async () => {
    if (!userId) return;
    const saved = await fetchSaved();
    if (saved) commit(saved);
  }, [userId, fetchSaved, commit]);

  // Live sync: re-read the cart whenever Supabase reports a change (e.g. added on the website),
  // and whenever the app comes back to the foreground.
  useEffect(() => {
    if (!userId) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const soon = () => {
      clearTimeout(timer);
      timer = setTimeout(refresh, 300);
    };
    const channel = supabase
      .channel(`app-cart-${userId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cart_items', filter: `user_id=eq.${userId}` }, soon)
      .subscribe();
    const sub = AppState.addEventListener('change', (s) => s === 'active' && soon());
    return () => {
      clearTimeout(timer);
      supabase.removeChannel(channel);
      sub.remove();
    };
  }, [userId, refresh]);

  const save = useCallback(
    (line: CartLine) => {
      if (!userId) return;
      supabase
        .from('cart_items')
        .upsert({ user_id: userId, product_id: line.productId, size: line.size, quantity: line.quantity }, { onConflict: 'user_id,product_id,size' })
        .then(({ error }) => error && console.warn('Could not save cart', error.message));
    },
    [userId]
  );

  const del = useCallback(
    (productId: number, size: string) => {
      if (!userId) return;
      supabase
        .from('cart_items')
        .delete()
        .match({ user_id: userId, product_id: productId, size })
        .then(({ error }) => error && console.warn('Could not update cart', error.message));
    },
    [userId]
  );

  const add = useCallback<CartValue['add']>(
    (line, quantity) => {
      const current = linesRef.current;
      const existing = current.find((l) => same(l, line));
      const updated: CartLine = { ...line, quantity: Math.min(MAX_QTY, (existing?.quantity ?? 0) + quantity) };
      commit(existing ? current.map((l) => (same(l, line) ? updated : l)) : [...current, updated]);
      save(updated);
    },
    [commit, save]
  );

  const setQuantity = useCallback<CartValue['setQuantity']>(
    (productId, size, quantity) => {
      const key = { productId, size };
      if (quantity < 1) {
        commit(linesRef.current.filter((l) => !same(l, key)));
        del(productId, size);
        return;
      }
      const next = linesRef.current.map((l) => (same(l, key) ? { ...l, quantity: Math.min(MAX_QTY, quantity) } : l));
      commit(next);
      const line = next.find((l) => same(l, key));
      if (line) save(line);
    },
    [commit, save, del]
  );

  const remove = useCallback<CartValue['remove']>(
    (productId, size) => {
      commit(linesRef.current.filter((l) => !same(l, { productId, size })));
      del(productId, size);
    },
    [commit, del]
  );

  const value = useMemo<CartValue>(
    () => ({
      lines,
      ready,
      count: lines.reduce((n, l) => n + l.quantity, 0),
      subtotal: lines.reduce((n, l) => n + l.price * l.quantity, 0),
      add,
      setQuantity,
      remove,
      refresh,
      clearLocal: () => commit([]),
    }),
    [lines, ready, add, setQuantity, remove, refresh, commit]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside CartProvider');
  return ctx;
}
