"use client";

import { useState } from "react";
import Link from "next/link";
import { loginAction } from "@/app/auth/actions";

export function LoginForm({
  error,
  message,
  nextPath,
}: {
  error?: string | null;
  message?: string | null;
  nextPath: string;
}) {
  const [submitting, setSubmitting] = useState(false);

  return (
    <>
      {message ? (
        <div className="mb-4 rounded-xl border border-crypto-green/30 bg-crypto-green/10 px-4 py-3 text-sm text-slate-100">
          {message}
        </div>
      ) : null}

      {error ? (
        <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      <form
        action={async (formData) => {
          setSubmitting(true);
          try {
            await loginAction(formData);
          } catch {
            // redirect throws, which is expected
          }
          setSubmitting(false);
        }}
        className="space-y-4"
      >
        <input name="next" type="hidden" value={nextPath} />
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-200" htmlFor="email">
            Email
          </label>
          <input
            className="w-full rounded-xl border border-white/10 bg-surface-graphite px-4 py-3 text-white outline-none transition focus:border-accent-emerald"
            id="email"
            name="email"
            placeholder="nume@email.com"
            required
            type="email"
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-200" htmlFor="password">
            Parolă
          </label>
          <input
            className="w-full rounded-xl border border-white/10 bg-surface-graphite px-4 py-3 text-white outline-none transition focus:border-accent-emerald"
            id="password"
            name="password"
            placeholder="Introdu parola"
            required
            type="password"
          />
        </div>
        <button className="accent-button w-full disabled:opacity-60" disabled={submitting} type="submit">
          {submitting ? "Se autentifică..." : "Intră în cont"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-400">
        Nu ai cont?{" "}
        <Link className="font-semibold text-accent-emerald hover:text-crypto-green" href="/signup">
          Creează unul acum
        </Link>
      </p>
    </>
  );
}
