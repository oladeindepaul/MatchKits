// Quick health check of the Supabase catalog, using the public (anon) key like the site does.
//   npm run check:db

import { createClient } from "@supabase/supabase-js";

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
  auth: { persistSession: false },
});

for (const table of ["leagues", "clubs", "products", "product_images", "product_sizes"]) {
  const { count, error } = await sb.from(table).select("*", { count: "exact", head: true });
  console.log(`${table.padEnd(16)} ${error ? "ERROR: " + error.message : count}`);
}

// Private tables should look empty to a signed-out visitor.
for (const table of ["cart_items", "wishlist_items", "orders"]) {
  const { count, error } = await sb.from(table).select("*", { count: "exact", head: true });
  console.log(`${table.padEnd(16)} ${error ? "ERROR: " + error.message : `${count} visible when signed out`}`);
}
