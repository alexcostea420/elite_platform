"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { Container } from "@/components/ui/container";
import { createBrowserClient } from "@supabase/ssr";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  const supabase = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), []);

  useEffect(() => {
    // Supabase handles the token exchange from the URL hash automatically
    supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setReady(true);
      }
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Parola trebuie să aibă minim 8 caractere.");
      return;
    }

    if (password !== confirm) {
      setError("Parolele nu se potrivesc.");
      return;
    }

    setLoading(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });

      if (updateError) {
        setError(updateError.message);
        return;
      }

      setDone(true);
    } catch {
      setError("Eroare la resetarea parolei.");
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-surface-night px-4">
        <Container className="max-w-md text-center">
          <div className="panel px-6 py-10">
            <div className="text-5xl">✅</div>
            <h1 className="mt-4 text-2xl font-bold text-white">Parolă schimbată!</h1>
            <p className="mt-3 text-slate-400">
              Poți folosi noua parolă pentru a te autentifica.
            </p>
            <Link
              className="accent-button mt-6 inline-block px-8 py-3"
              href="/dashboard"
            >
              Mergi la Dashboard
            </Link>
          </div>
        </Container>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-surface-night px-4">
      <Container className="max-w-md">
        <div className="panel px-6 py-8">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold text-white">Setează parolă nouă</h1>
            <p className="mt-2 text-sm text-slate-400">
              Introdu noua parolă pentru contul tău.
            </p>
          </div>

          {!ready && (
            <div className="mb-4 rounded-xl bg-amber-500/10 p-3 text-sm text-amber-400">
              Se verifică linkul de resetare...
            </div>
          )}

          {error && (
            <div className="mb-4 rounded-xl bg-red-500/10 p-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-200" htmlFor="password">
                Parolă nouă
              </label>
              <input
                className="w-full rounded-xl border border-white/10 bg-surface-graphite px-4 py-3 text-white outline-none transition focus:border-accent-emerald"
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minim 8 caractere"
                required
                minLength={8}
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-200" htmlFor="confirm">
                Confirmă parola
              </label>
              <input
                className="w-full rounded-xl border border-white/10 bg-surface-graphite px-4 py-3 text-white outline-none transition focus:border-accent-emerald"
                id="confirm"
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Repetă parola"
                required
              />
            </div>
            <button
              className="accent-button w-full disabled:opacity-60"
              disabled={loading || !ready}
              type="submit"
            >
              {loading ? "Se salvează..." : "Salvează parola"}
            </button>
          </form>
        </div>
      </Container>
    </main>
  );
}
