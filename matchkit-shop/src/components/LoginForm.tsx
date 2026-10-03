"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Mode = "login" | "register" | "magic";

function friendly(message: string) {
  if (/invalid login credentials/i.test(message)) return "That email and password don't match. Try again, or use a magic link.";
  if (/email not confirmed/i.test(message)) return "Please confirm your email first: click the link we sent when you registered.";
  if (/rate limit|too many/i.test(message)) return "Too many emails sent just now. Please wait a few minutes and try again.";
  if (/password should be at least/i.test(message)) return "Password must be at least 6 characters.";
  if (/signups not allowed|user not found/i.test(message)) return "No account found for that email. Create one instead.";
  return message;
}

export function LoginForm({
  next,
  initialMode,
  initialError,
  reason,
}: {
  next: string;
  initialMode: "login" | "register";
  initialError?: string;
  reason?: string;
}) {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const [mode, setMode] = useState<Mode>(initialMode);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(initialError ?? "");
  const [sentTo, setSentTo] = useState<{ email: string; kind: "register" | "magic" } | null>(null);

  const callbackUrl = () => `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");

    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(friendly(error.message));
        setBusy(false);
        return;
      }
      router.replace(next);
      router.refresh();
      return;
    }

    if (mode === "register") {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: callbackUrl(), data: { full_name: name.trim() } },
      });
      setBusy(false);
      if (error) return setError(friendly(error.message));
      setSentTo({ email, kind: "register" });
      return;
    }

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: callbackUrl(), shouldCreateUser: false },
    });
    setBusy(false);
    if (error) return setError(friendly(error.message));
    setSentTo({ email, kind: "magic" });
  }

  async function google() {
    setError("");
    const { error } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: callbackUrl() } });
    if (error) setError(friendly(error.message));
  }

  const heading = (
    <>
      <h1 className="text-center text-3xl font-light">
        <span className="text-stone">/ </span>
        {mode === "register" ? "Create account" : "Welcome back"}
      </h1>
      {reason && <p className="mt-4 text-center text-sm text-stone">{reason}</p>}
    </>
  );

  if (sentTo) {
    return (
      <>
      {heading}
      <div className="mt-10 bg-sand px-6 py-10 text-center">
        <p className="eyebrow mb-4 text-accent">Check your inbox</p>
        <p className="text-sm leading-relaxed">
          We&apos;ve sent a {sentTo.kind === "register" ? "verification" : "sign-in"} link to <strong>{sentTo.email}</strong>.
          <br />
          Open it on this device to {sentTo.kind === "register" ? "activate your account and continue" : "log in"}.
        </p>
        <p className="mt-4 text-xs text-stone">No email after a minute? Check your spam folder.</p>
        <button onClick={() => setSentTo(null)} className="eyebrow mt-6 text-accent hover:text-ink">
          Use a different email
        </button>
      </div>
      </>
    );
  }

  return (
    <>
    {heading}
    <div className="mt-10">
      <div className="mb-8 grid grid-cols-2 border-b border-line" role="tablist">
        {(["login", "register"] as const).map((m) => (
          <button
            key={m}
            role="tab"
            aria-selected={mode === m || (m === "login" && mode === "magic")}
            onClick={() => {
              setMode(m);
              setError("");
            }}
            className={`eyebrow -mb-px border-b pb-3 transition-colors ${
              mode === m || (m === "login" && mode === "magic") ? "border-ink text-ink" : "border-transparent text-stone hover:text-ink"
            }`}
          >
            {m === "login" ? "Log in" : "Register"}
          </button>
        ))}
      </div>

      <button onClick={google} type="button" className="flex h-12 w-full items-center justify-center gap-3 border border-line bg-paper text-sm transition-colors hover:border-ink">
        <GoogleLogo />
        Continue with Google
      </button>

      <div className="my-6 flex items-center gap-4 text-xs text-stone">
        <span className="h-px flex-1 bg-line" /> or <span className="h-px flex-1 bg-line" />
      </div>

      <form onSubmit={submit} className="space-y-4">
        {mode === "register" && (
          <label className="block">
            <span className="label">Full name</span>
            <input className="field" value={name} onChange={(e) => setName(e.target.value)} required autoComplete="name" />
          </label>
        )}
        <label className="block">
          <span className="label">Email</span>
          <input className="field" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
        </label>
        {mode !== "magic" && (
          <label className="block">
            <span className="label">Password</span>
            <input
              className="field"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete={mode === "register" ? "new-password" : "current-password"}
            />
          </label>
        )}

        {error && (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        )}

        <button type="submit" disabled={busy} className="btn-solid w-full">
          {busy ? "Please wait…" : mode === "login" ? "Log in" : mode === "register" ? "Create account" : "Email me a magic link"}
        </button>
      </form>

      <p className="mt-6 text-center text-xs text-stone">
        {mode === "register" ? (
          "We'll email you a magic link to verify your address."
        ) : (
          <button onClick={() => { setMode(mode === "magic" ? "login" : "magic"); setError(""); }} className="text-accent hover:text-ink">
            {mode === "magic" ? "Log in with a password instead" : "Forgot your password? Log in with a magic link"}
          </button>
        )}
      </p>
    </div>
    </>
  );
}

function GoogleLogo() {
  return (
    <svg viewBox="0 0 48 48" className="size-[18px]" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}
