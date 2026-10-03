"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { storageUrl } from "@/lib/format";

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

type CartContextValue = {
  lines: CartLine[];
  ready: boolean;
  count: number;
  subtotal: number;
  add: (line: Omit<CartLine, "quantity">, quantity: number) => void;
  setQuantity: (productId: number, size: string, quantity: number) => void;
  remove: (productId: number, size: string) => void;
  clear: () => void;
};

const STORAGE_KEY = "matchkit-cart";
export const MAX_QTY = 20;

const CartContext = createContext<CartContextValue | null>(null);

const sameLine = (a: { productId: number; size: string }, b: { productId: number; size: string }) =>
  a.productId === b.productId && a.size === b.size;

type DbCartRow = {
  product_id: number;
  size: string;
  quantity: number;
  products: {
    slug: string;
    name: string;
    price: number;
    kit_type: string;
    product_images: { path: string }[];
    clubs: { name: string };
  };
};

function readLocal(): CartLine[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CartLine[]) : [];
  } catch {
    return [];
  }
}

function writeLocal(lines: CartLine[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
  } catch {
    // Storage can be unavailable (private mode); the cart still works for this visit.
  }
}

// Guests keep their cart in the browser. Signed-in shoppers also have it saved to Supabase,
// and anything they added before signing in is merged into their saved cart.
export function CartProvider({ userId, children }: { userId: string | null; children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);
  const supabase = useMemo(() => createClient(), []);
  const linesRef = useRef<CartLine[]>([]);

  const commit = useCallback((next: CartLine[]) => {
    linesRef.current = next;
    setLines(next);
    writeLocal(next);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const local = readLocal();
      if (!userId) {
        if (!cancelled) commit(local);
        setReady(true);
        return;
      }

      const { data, error } = await supabase
        .from("cart_items")
        .select("product_id, size, quantity, products(slug, name, price, kit_type, product_images(path), clubs(name))");

      if (error) {
        if (!cancelled) commit(local);
        setReady(true);
        return;
      }

      const saved: CartLine[] = (data as unknown as DbCartRow[]).map((r) => ({
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

      const guestOnly = local.filter((l) => !saved.some((s) => sameLine(s, l)));
      if (guestOnly.length) {
        await supabase.from("cart_items").upsert(
          guestOnly.map((l) => ({ user_id: userId, product_id: l.productId, size: l.size, quantity: l.quantity })),
          { onConflict: "user_id,product_id,size" }
        );
      }

      if (!cancelled) commit([...saved, ...guestOnly]);
      setReady(true);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [userId, supabase, commit]);

  const saveLine = useCallback(
    (line: CartLine) => {
      if (!userId) return;
      supabase
        .from("cart_items")
        .upsert(
          { user_id: userId, product_id: line.productId, size: line.size, quantity: line.quantity },
          { onConflict: "user_id,product_id,size" }
        )
        .then(({ error }) => error && console.error("Could not save cart", error.message));
    },
    [userId, supabase]
  );

  const deleteLine = useCallback(
    (productId: number, size: string) => {
      if (!userId) return;
      supabase
        .from("cart_items")
        .delete()
        .match({ user_id: userId, product_id: productId, size })
        .then(({ error }) => error && console.error("Could not update cart", error.message));
    },
    [userId, supabase]
  );

  const add = useCallback<CartContextValue["add"]>(
    (line, quantity) => {
      const current = linesRef.current;
      const existing = current.find((l) => sameLine(l, line));
      const updated: CartLine = { ...line, quantity: Math.min(MAX_QTY, (existing?.quantity ?? 0) + quantity) };
      commit(existing ? current.map((l) => (sameLine(l, line) ? updated : l)) : [...current, updated]);
      saveLine(updated);
    },
    [commit, saveLine]
  );

  const setQuantity = useCallback<CartContextValue["setQuantity"]>(
    (productId, size, quantity) => {
      const key = { productId, size };
      if (quantity < 1) {
        commit(linesRef.current.filter((l) => !sameLine(l, key)));
        deleteLine(productId, size);
        return;
      }
      const q = Math.min(MAX_QTY, quantity);
      const next = linesRef.current.map((l) => (sameLine(l, key) ? { ...l, quantity: q } : l));
      commit(next);
      const line = next.find((l) => sameLine(l, key));
      if (line) saveLine(line);
    },
    [commit, saveLine, deleteLine]
  );

  const remove = useCallback<CartContextValue["remove"]>(
    (productId, size) => {
      commit(linesRef.current.filter((l) => !sameLine(l, { productId, size })));
      deleteLine(productId, size);
    },
    [commit, deleteLine]
  );

  // Only clears the browser copy; the saved cart is emptied by the database when an order is placed.
  const clear = useCallback(() => commit([]), [commit]);

  const value = useMemo<CartContextValue>(
    () => ({
      lines,
      ready,
      count: lines.reduce((n, l) => n + l.quantity, 0),
      subtotal: lines.reduce((n, l) => n + l.price * l.quantity, 0),
      add,
      setQuantity,
      remove,
      clear,
    }),
    [lines, ready, add, setQuantity, remove, clear]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
