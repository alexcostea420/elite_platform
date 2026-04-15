"use client";

import Link from "next/link";
import { useState } from "react";

import { Container } from "@/components/ui/container";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "A apărut o eroare. Încearcă din nou.");
        return;
      }

      setSent(true);
    } catch {
      setError("Eroare de conexiune. Încearcă din nou.");
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-surface-night px-4">
        <Container className="max-w-md text-center">
          <div className="panel px-6 py-10">
            <div className="text-5xl">📧</div>
            <h1 className="mt-4 text-2xl font-bold text-white">Verifică emailul</h1>
            <p className="mt-3 text-slate-400">
              Dacă există un cont cu adresa <strong className="text-white">{email}</strong>,
              vei primi un link de resetare a parolei.
            </p>
            <p className="mt-2 text-sm text-slate-500">
              Verifică și folderul de spam.
            </p>
            <Link
              className="mt-6 inline-block text-sm text-accent-emerald hover:underline"
              href="/login"
            >
              Înapoi la login
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
            <h1 className="text-2xl font-bold text-white">Resetează parola</h1>
            <p className="mt-2 text-sm text-slate-400">
              Introdu adresa de email și îți trimitem un link de resetare.
            </p>
          </div>

          {error && (
            <div className="mb-4 rounded-xl bg-red-500/10 p-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-200" htmlFor="email">
                Email
              </label>
              <input
                className="w-full rounded-xl border border-white/10 bg-surface-graphite px-4 py-3 text-white outline-none transition focus:border-accent-emerald"
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nume@email.com"
                required
              />
            </div>
            <button
              className="accent-button w-full disabled:opacity-60"
              disabled={loading}
              type="submit"
            >
              {loading ? "Se trimite..." : "Trimite link de resetare"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-400">
            Ți-ai amintit parola?{" "}
            <Link className="font-semibold text-accent-emerald hover:text-crypto-green" href="/login">
              Înapoi la login
            </Link>
          </p>
        </div>
      </Container>
    </main>
  );
}
