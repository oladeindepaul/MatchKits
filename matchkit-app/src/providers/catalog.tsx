import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { fetchCatalog, type Club, type League, type Product } from '@/lib/catalog';

type CatalogValue = {
  products: Product[];
  leagues: League[];
  clubs: Club[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

const CatalogContext = createContext<CatalogValue | null>(null);

export function CatalogProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<{ products: Product[]; leagues: League[]; clubs: Club[] }>({ products: [], leagues: [], clubs: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setData(await fetchCatalog());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load jerseys');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCatalog()
      .then((d) => {
        setData(d);
        setError(null);
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Could not load jerseys'))
      .finally(() => setLoading(false));
  }, []);

  return <CatalogContext.Provider value={{ ...data, loading, error, refresh }}>{children}</CatalogContext.Provider>;
}

export function useCatalog() {
  const ctx = useContext(CatalogContext);
  if (!ctx) throw new Error('useCatalog must be used inside CatalogProvider');
  return ctx;
}
