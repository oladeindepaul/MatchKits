"use client";

import Link from "next/link";
import { useSyncExternalStore, useState } from "react";

const KEY = "matchkit-cookie-notice";

function readDismissed() {
  try {
    return localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

// We only use essential cookies, so this is a notice rather than a consent prompt.
export function CookieNotice() {
  // Server render and first paint assume "dismissed" so the notice never flashes or causes a hydration mismatch.
  const storedDismissed = useSyncExternalStore(
    () => () => {},
    readDismissed,
    () => true
  );
  const [closed, setClosed] = useState(false);
  if (storedDismissed || closed) return null;

  function dismiss() {
    try {
      localStorage.setItem(KEY, "1");
    } catch {
      // Storage blocked: just hide it for this visit.
    }
    setClosed(true);
  }

  return (
    <div
      role="region"
      aria-label="Cookie notice"
      className="fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-40 mx-auto max-w-xl border border-line bg-paper px-5 py-4 shadow-[0_8px_30px_rgba(22,21,19,0.12)] sm:inset-x-6"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-5">
        <p className="text-sm leading-relaxed">
          We only use essential cookies to keep you logged in and remember your cart. No tracking or ads.{" "}
          <Link href="/cookies" className="text-accent underline underline-offset-2">
            Cookie policy
          </Link>
        </p>
        <button onClick={dismiss} className="btn-solid shrink-0 px-6 py-3">
          OK
        </button>
      </div>
    </div>
  );
}
