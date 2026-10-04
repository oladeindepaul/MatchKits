import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Cookie policy",
  description: "How MatchKit uses cookies and browser storage.",
};

const UPDATED = "3 October 2026";

const ESSENTIAL = [
  {
    name: "sb-…-auth-token",
    type: "Cookie",
    purpose: "Keeps you logged in to your MatchKit account. It may be split into several parts (…auth-token.0, .1).",
    duration: "Until you sign out, refreshed while you use the site",
  },
  {
    name: "sb-…-auth-token-code-verifier",
    type: "Cookie",
    purpose: "Securely completes Google sign-in and email magic links. Used once, then removed.",
    duration: "A few minutes",
  },
  {
    name: "matchkit-cart",
    type: "Local storage",
    purpose: "Remembers the jerseys, sizes and quantities in your cart, including before you log in.",
    duration: "Until you empty your cart, place an order or clear your browser data",
  },
  {
    name: "matchkit-cookie-notice",
    type: "Local storage",
    purpose: "Remembers that you've seen our cookie notice so we don't show it again.",
    duration: "Until you clear your browser data",
  },
];

export default function CookiePolicyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 pt-10 sm:px-8 sm:pt-14">
      <p className="eyebrow mb-3 text-stone">Last updated {UPDATED}</p>
      <h1 className="text-3xl font-light sm:text-4xl">
        <span className="text-stone">/ </span>Cookie policy
      </h1>

      <div className="mt-10 space-y-10 text-[15px] leading-relaxed text-ink/85">
        <section>
          <p>
            This policy explains how MatchKit (&ldquo;we&rdquo;, &ldquo;us&rdquo;) uses cookies and similar technologies when you visit our
            shop. We keep it simple: <strong>we only use what&apos;s needed to run the shop</strong>. We do not use advertising,
            tracking or analytics cookies, and we don&apos;t sell or share your data with advertisers.
          </p>
        </section>

        <section>
          <h2 className="eyebrow mb-3 text-ink">What are cookies?</h2>
          <p>
            Cookies are small text files a website saves on your device. Local storage is a similar feature that lets a site remember
            information in your browser. Both help a site work properly, for example keeping you logged in or remembering your cart.
          </p>
        </section>

        <section>
          <h2 className="eyebrow mb-3 text-ink">Strictly necessary cookies and storage</h2>
          <p className="mb-5">
            These are essential for the shop to work, so they can&apos;t be switched off in our system. Under the Nigeria Data Protection
            Act 2023 and similar laws, strictly necessary cookies don&apos;t require consent, but we still want you to know about them.
          </p>

          {/* Cards on small screens, a table from tablet width up. */}
          <ul className="space-y-3 md:hidden">
            {ESSENTIAL.map((c) => (
              <li key={c.name} className="bg-sand p-4 text-sm">
                <p className="break-all font-medium">{c.name}</p>
                <p className="mt-0.5 text-xs text-stone">{c.type}</p>
                <p className="mt-2">{c.purpose}</p>
                <p className="mt-2 text-xs text-stone">Lasts: {c.duration}</p>
              </li>
            ))}
          </ul>
          <div className="hidden md:block">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-ink/70">
                  <th className="label py-2 pr-4">Name</th>
                  <th className="label py-2 pr-4">Type</th>
                  <th className="label py-2 pr-4">Purpose</th>
                  <th className="label py-2">Duration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {ESSENTIAL.map((c) => (
                  <tr key={c.name} className="align-top">
                    <td className="break-all py-3 pr-4 font-medium">{c.name}</td>
                    <td className="whitespace-nowrap py-3 pr-4 text-stone">{c.type}</td>
                    <td className="py-3 pr-4">{c.purpose}</td>
                    <td className="py-3 text-stone">{c.duration}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="eyebrow mb-3 text-ink">Third-party services</h2>
          <ul className="list-disc space-y-2 pl-5">
            <li>
              <strong>Supabase</strong> stores your account, cart, wishlist and orders, and serves our jersey images. The login cookies
              above are issued for this.
            </li>
            <li>
              <strong>Google</strong>: if you choose &ldquo;Continue with Google&rdquo;, you&apos;ll sign in on Google&apos;s own website,
              which sets its own cookies under{" "}
              <a href="https://policies.google.com/technologies/cookies" className="text-accent underline underline-offset-2" target="_blank" rel="noreferrer">
                Google&apos;s cookie policy
              </a>
              .
            </li>
            <li>
              <strong>Resend</strong> sends your order confirmation emails. It does not set cookies on this website.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="eyebrow mb-3 text-ink">Managing cookies</h2>
          <p>
            You can view and delete cookies and site data in your browser settings at any time. If you block or delete the cookies
            above, you&apos;ll be logged out and your cart may be emptied, and some parts of the shop such as checkout and your wishlist
            won&apos;t work until you log in again.
          </p>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm">
            <li>Chrome (Android and desktop): Settings → Privacy and security → Cookies and other site data</li>
            <li>Safari (iPhone and iPad): Settings → Safari → Advanced → Website Data</li>
            <li>Samsung Internet: Settings → Browsing privacy dashboard → Delete browsing data</li>
            <li>Firefox: Settings → Privacy &amp; Security → Cookies and Site Data</li>
          </ul>
        </section>

        <section>
          <h2 className="eyebrow mb-3 text-ink">Changes to this policy</h2>
          <p>
            If we start using any other kind of cookie, such as analytics, we&apos;ll update this page and ask for your permission first
            where the law requires it.
          </p>
        </section>

        <section className="border-t border-line pt-8">
          <h2 className="eyebrow mb-3 text-ink">Questions</h2>
          <p>
            If you have questions about this policy or your data, contact us through your{" "}
            <Link href="/account" className="text-accent underline underline-offset-2">
              account page
            </Link>{" "}
            or reply to any MatchKit order email.
          </p>
        </section>
      </div>
    </div>
  );
}
