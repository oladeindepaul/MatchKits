import { getLeagues } from "@/lib/catalog";
import { HeaderBar } from "./HeaderBar";

export async function Header({ signedIn }: { signedIn: boolean }) {
  const leagues = await getLeagues();
  return <HeaderBar signedIn={signedIn} leagues={leagues.map((l) => ({ slug: l.slug, name: l.name, logo: l.logo }))} />;
}
