"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  EmbeddedCheckout,
  EmbeddedCheckoutProvider,
} from "@stripe/react-stripe-js";

import { getStripe } from "@/lib/payments/stripe-client";

type PlanInfo = {
  slug: string;
  label: string;
  days: number;
  priceEur: number;
  veteranPriceEur: number;
};

const PLAN_MAP: Record<string, PlanInfo> = {
  elite_monthly: {
    slug: "elite_monthly",
    label: "Elite — 30 zile",
    days: 30,
    priceEur: 49,
    veteranPriceEur: 33,
  },
  elite_3mo: {
    slug: "elite_3mo",
    label: "Elite — 3 luni",
    days: 90,
    priceEur: 137,
    veteranPriceEur: 100,
  },
  elite_annual: {
    slug: "elite_annual",
    label: "Elite — 12 luni",
    days: 365,
    priceEur: 497,
    veteranPriceEur: 300,
  },
};

const stripePromise = getStripe();

export function CardCheckoutClient() {
  return (
    <Suspense fallback={<LoadingShell />}>
      <CheckoutInner />
    </Suspense>
  );
}

function CheckoutInner() {
  const searchParams = useSearchParams();
  const planSlug = searchParams.get("plan") ?? "";
  const plan = PLAN_MAP[planSlug];

  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const requested = useRef(false);

  const requestSession = useCallback(async () => {
    if (!plan) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/payments/stripe-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: plan.slug }),
      });
      const data = await res.json();
      if (!res.ok || !data.clientSecret) {
        setErrorMsg(data.error ?? "Nu am putut iniția plata. Încearcă din nou.");
        return;
      }
      setClientSecret(data.clientSecret);
    } catch {
      setErrorMsg("Eroare de conexiune. Verifică internetul și încearcă din nou.");
    } finally {
      setLoading(false);
    }
  }, [plan]);

  useEffect(() => {
    if (!plan || requested.current) return;
    requested.current = true;
    void requestSession();
  }, [plan, requestSession]);

  if (!plan) {
    return (
      <div className="glass-card p-7 text-center">
        <div className="text-4xl">⚠️</div>
        <h2 className="mt-4 font-display text-2xl font-bold text-white">
          Plan invalid
        </h2>
        <p className="mt-3 text-sm text-slate-400">
          Linkul nu conține un plan valid. Alege un plan din pagina de upgrade.
        </p>
        <Link className="accent-button mt-6 inline-flex" href="/upgrade">
          Înapoi la planuri
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-[1fr_minmax(0,420px)]">
      <PlanSummary plan={plan} />

      <div className="glass-card overflow-hidden p-0">
        {loading ? (
          <div className="flex min-h-[420px] items-center justify-center p-6">
            <LoadingShell />
          </div>
        ) : errorMsg ? (
          <ErrorState message={errorMsg} onRetry={requestSession} />
        ) : clientSecret ? (
          <EmbeddedCheckoutProvider
            stripe={stripePromise}
            options={{ clientSecret }}
          >
            <EmbeddedCheckout />
          </EmbeddedCheckoutProvider>
        ) : null}
      </div>
    </div>
  );
}

function PlanSummary({ plan }: { plan: PlanInfo }) {
  return (
    <aside className="space-y-4">
      <section className="glass-card p-5 md:p-6">
        <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-500 sm:text-xs">
          Plan ales
        </p>
        <h2 className="mt-1 text-xl font-bold text-white sm:text-2xl">
          {plan.label}
        </h2>
        <p className="mt-3 font-data text-3xl font-bold tabular-nums text-accent-emerald sm:text-4xl">
          €{plan.priceEur}
        </p>
        <p className="mt-1 text-xs text-slate-500">
          Plată unică · {plan.days} zile acces Elite
        </p>
        {plan.veteranPriceEur < plan.priceEur ? (
          <p className="mt-3 text-xs text-amber-300/80">
            Reducere veteran disponibilă (€{plan.veteranPriceEur}) — se aplică
            automat dacă ai contul marcat veteran.
          </p>
        ) : null}
      </section>

      <section className="glass-card p-5 md:p-6">
        <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-500 sm:text-xs">
          Ce primești
        </p>
        <ul className="mt-3 space-y-2 text-sm text-slate-300">
          <li className="flex gap-2">
            <span className="text-accent-emerald">·</span> Acces complet la
            dashboard-uri și unelte
          </li>
          <li className="flex gap-2">
            <span className="text-accent-emerald">·</span> Bibliotecă video +
            indicatori privați
          </li>
          <li className="flex gap-2">
            <span className="text-accent-emerald">·</span> Rol Elite pe Discord
            (sincronizat automat)
          </li>
          <li className="flex gap-2">
            <span className="text-accent-emerald">·</span> Plată unică, fără
            reînnoire automată
          </li>
        </ul>
      </section>

      <section className="glass-card p-5 md:p-6">
        <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-500 sm:text-xs">
          Securitate
        </p>
        <p className="mt-2 text-sm text-slate-300">
          Plata este procesată de Stripe (PCI DSS Level 1). Cardul tău nu este
          stocat pe serverele noastre.
        </p>
      </section>

      <Link
        className="block text-center text-xs text-slate-500 underline hover:text-slate-300"
        href="/upgrade"
      >
        ← Schimbă planul
      </Link>
    </aside>
  );
}

function LoadingShell() {
  return (
    <div className="text-center">
      <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-accent-emerald border-t-transparent" />
      <p className="mt-4 text-sm text-slate-400">
        Se pregătește plata securizată…
      </p>
    </div>
  );
}

function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  const isAuthError = message === "Neautorizat";
  return (
    <div className="flex min-h-[420px] flex-col items-center justify-center gap-4 p-6 text-center">
      <div className="text-4xl">{isAuthError ? "🔒" : "⚠️"}</div>
      <h2 className="text-xl font-bold text-white">
        {isAuthError ? "Trebuie să fii autentificat" : "Plata nu a putut fi inițiată"}
      </h2>
      <p className="max-w-sm text-sm text-slate-400">
        {isAuthError
          ? "Loghează-te sau creează-ți un cont gratuit ca să continui."
          : message}
      </p>
      {isAuthError ? (
        <div className="flex flex-col gap-2 sm:flex-row">
          <Link className="accent-button" href="/signup">
            Creează cont
          </Link>
          <Link className="ghost-button" href="/login?next=/upgrade">
            Loghează-mă
          </Link>
        </div>
      ) : (
        <button className="accent-button" onClick={onRetry} type="button">
          Încearcă din nou
        </button>
      )}
    </div>
  );
}
