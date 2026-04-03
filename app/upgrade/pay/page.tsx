"use client";

import { Suspense, useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";

type PaymentData = {
  payment_id: string;
  wallet_address: string;
  amount: number;
  currency: string;
  chain: string;
  expires_in_minutes: number;
  status: string;
};

type PlanInfo = {
  slug: string;
  label: string;
  planDuration: string;
  chain: string;
};

const PLAN_MAP: Record<string, PlanInfo> = {
  elite_monthly: {
    slug: "elite_monthly",
    label: "Elite — 30 Zile",
    planDuration: "30_days",
    chain: "ARB",
  },
  elite_3mo: {
    slug: "elite_3mo",
    label: "Elite — 3 Luni",
    planDuration: "90_days",
    chain: "ARB",
  },
  elite_annual: {
    slug: "elite_annual",
    label: "Elite — 12 Luni",
    planDuration: "365_days",
    chain: "ARB",
  },
  bot_monthly: {
    slug: "bot_monthly",
    label: "Bot AI Trading — 30 Zile",
    planDuration: "bot_monthly",
    chain: "ARB",
  },
  bot_monthly_elite: {
    slug: "bot_monthly_elite",
    label: "Bot AI Trading (Elite) — 30 Zile",
    planDuration: "bot_monthly_elite",
    chain: "ARB",
  },
  elite_bot_bundle: {
    slug: "elite_bot_bundle",
    label: "Elite + Bot Bundle — 30 Zile",
    planDuration: "30_days",
    chain: "ARB",
  },
};

function formatAmount(amount: number): string {
  return amount.toFixed(3);
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export default function PayPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-crypto-dark">
          <div className="panel max-w-md px-6 py-8 text-center md:px-8">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-accent-emerald border-t-transparent" />
            <p className="mt-4 text-slate-300">Se încarcă...</p>
          </div>
        </div>
      }
    >
      <PayPageInner />
    </Suspense>
  );
}

function PayPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const planSlug = searchParams.get("plan") ?? "";
  const planInfo = PLAN_MAP[planSlug];

  const [step, setStep] = useState<"loading" | "pay" | "confirmed" | "expired" | "error">("loading");
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<"address" | "amount" | null>(null);
  const [countdown, setCountdown] = useState(30 * 60);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const createPayment = useCallback(async () => {
    if (!planInfo) return;

    try {
      const res = await fetch("/api/payments/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan_duration: planInfo.planDuration,
          chain: planInfo.chain,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Eroare la creare cerere de plată.");
        setStep("error");
        return;
      }

      setPaymentData(data);
      setCountdown(data.expires_in_minutes * 60);
      setStep("pay");
    } catch {
      setError("Eroare de conexiune. Încearcă din nou.");
      setStep("error");
    }
  }, [planInfo]);

  // Create payment on mount
  useEffect(() => {
    if (planInfo) {
      createPayment();
    }
  }, [planInfo, createPayment]);

  // Countdown timer
  useEffect(() => {
    if (step !== "pay") return;

    countdownRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setStep("expired");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [step]);

  // Poll for payment status every 10 seconds
  useEffect(() => {
    if (step !== "pay" || !paymentData) return;

    const checkStatus = async () => {
      try {
        const res = await fetch(`/api/payments/status?id=${paymentData.payment_id}`);
        const data = await res.json();

        if (data.status === "confirmed") {
          setTxHash(data.tx_hash);
          setExpiresAt(data.expires_at);
          setStep("confirmed");
        } else if (data.status === "expired") {
          setStep("expired");
        }
      } catch {
        // Silent retry
      }
    };

    pollRef.current = setInterval(checkStatus, 10000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [step, paymentData]);

  const copyToClipboard = async (text: string, type: "address" | "amount") => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      // Clipboard API not available
    }
  };

  // Invalid plan
  if (!planInfo) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-crypto-dark">
        <div className="panel max-w-md border-red-500/30 px-6 py-8 text-center md:px-8">
          <div className="text-5xl">⚠️</div>
          <h1 className="mt-4 text-2xl font-bold text-white">Plan invalid</h1>
          <p className="mt-3 text-slate-300">
            Planul selectat nu există. Alege un plan valid din pagina de upgrade.
          </p>
          <Link className="accent-button mt-6 inline-block" href="/upgrade">
            Înapoi la planuri
          </Link>
        </div>
      </div>
    );
  }

  // Loading
  if (step === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-crypto-dark">
        <div className="panel max-w-md px-6 py-8 text-center md:px-8">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-accent-emerald border-t-transparent" />
          <p className="mt-4 text-slate-300">Se generează cererea de plată...</p>
        </div>
      </div>
    );
  }

  // Error
  if (step === "error") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-crypto-dark">
        <div className="panel max-w-md border-red-500/30 px-6 py-8 text-center md:px-8">
          <div className="text-5xl">⚠️</div>
          <h2 className="mt-4 text-2xl font-bold text-white">Eroare la plată</h2>
          <p className="mt-3 text-slate-300">{error}</p>
          <div className="mt-6 flex flex-col gap-3">
            <button
              className="accent-button"
              onClick={() => {
                setStep("loading");
                setError(null);
                createPayment();
              }}
              type="button"
            >
              Încearcă din nou
            </button>
            <Link className="ghost-button" href="/upgrade">
              Înapoi la planuri
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Expired
  if (step === "expired") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-crypto-dark">
        <div className="panel max-w-md border-amber-500/30 px-6 py-8 text-center md:px-8">
          <div className="text-5xl">⏰</div>
          <h2 className="mt-4 text-2xl font-bold text-white">Timpul a expirat</h2>
          <p className="mt-3 text-slate-300">
            Cererea de plată a expirat. Creează una nouă pentru a continua.
          </p>
          <div className="mt-6 flex flex-col gap-3">
            <button
              className="accent-button"
              onClick={() => {
                setStep("loading");
                setPaymentData(null);
                setCountdown(30 * 60);
                createPayment();
              }}
              type="button"
            >
              Generează cerere nouă
            </button>
            <Link className="ghost-button" href="/upgrade">
              Înapoi la planuri
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Confirmed
  if (step === "confirmed") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-crypto-dark">
        <div className="panel max-w-md border-accent-emerald/30 px-6 py-8 text-center md:px-8">
          <div className="text-5xl">✅</div>
          <h2 className="mt-4 text-3xl font-bold text-white">Plata confirmată!</h2>
          <p className="mt-3 text-slate-300">
            Accesul tău a fost activat{expiresAt
              ? ` până pe ${new Date(expiresAt).toLocaleDateString("ro-RO")}`
              : ""}.
          </p>
          <p className="mt-2 text-sm font-semibold text-accent-emerald">{planInfo.label}</p>
          {txHash ? (
            <p className="mt-2 text-sm text-slate-500">
              TX: {txHash.slice(0, 16)}...{txHash.slice(-8)}
            </p>
          ) : null}
          <button
            className="accent-button mt-6"
            onClick={() => router.push("/dashboard")}
            type="button"
          >
            Mergi la Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Pay step
  return (
    <div className="flex min-h-screen items-center justify-center bg-crypto-dark px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="panel border-accent-emerald/30 px-6 py-8 md:px-8">
          {/* Header */}
          <div className="mb-6 text-center">
            <p className="mb-2 text-sm font-semibold uppercase tracking-[0.3em] text-accent-emerald">
              Plată Crypto
            </p>
            <h1 className="text-2xl font-bold text-white md:text-3xl">
              {planInfo.label}
            </h1>
          </div>

          {/* Countdown */}
          <div className="mb-6 text-center">
            <div className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${
              countdown < 300
                ? "bg-red-500/10 text-red-400"
                : "bg-white/5 text-slate-400"
            }`}>
              <span>Expiră în</span>
              <span className="font-mono text-lg text-white">{formatTime(countdown)}</span>
            </div>
          </div>

          <div className="space-y-4">
            {/* Network & Currency */}
            <div className="flex gap-4">
              <div className="flex-1 rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="mb-1 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                  Rețea
                </p>
                <p className="font-semibold text-white">Arbitrum One</p>
              </div>
              <div className="flex-1 rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="mb-1 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                  Monedă
                </p>
                <p className="font-semibold text-white">USDT sau USDC</p>
              </div>
            </div>

            {/* Exact Amount */}
            <div className="rounded-2xl border border-accent-emerald/20 bg-accent-emerald/5 p-5">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                Sumă exactă de trimis
              </p>
              <div className="flex items-center gap-3">
                <span className="text-3xl font-bold text-accent-emerald">
                  {paymentData ? formatAmount(paymentData.amount) : "—"}{" "}
                  <span className="text-lg">{paymentData?.currency ?? "USDT"}</span>
                </span>
                <button
                  className="shrink-0 rounded-xl border border-accent-emerald/30 px-3 py-2 text-sm text-accent-emerald hover:bg-accent-emerald/10"
                  onClick={() => paymentData && copyToClipboard(formatAmount(paymentData.amount), "amount")}
                  type="button"
                >
                  {copied === "amount" ? "Copiat!" : "Copiază"}
                </button>
              </div>
              <p className="mt-2 text-sm text-slate-400">
                Suma include un identificator unic. Trimite exact această sumă pentru detectare automată.
              </p>
            </div>

            {/* Wallet Address */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                Adresa wallet (Arbitrum)
              </p>
              <div className="flex items-center gap-3">
                <code className="flex-1 break-all font-mono text-sm text-white">
                  {paymentData?.wallet_address ?? "—"}
                </code>
                <button
                  className="shrink-0 rounded-xl border border-white/10 px-3 py-2 text-sm text-slate-300 hover:bg-white/5"
                  onClick={() => paymentData && copyToClipboard(paymentData.wallet_address, "address")}
                  type="button"
                >
                  {copied === "address" ? "Copiat!" : "Copiază"}
                </button>
              </div>
            </div>

            {/* Important notes */}
            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 text-sm text-amber-200">
              <p className="font-semibold">Important:</p>
              <ul className="mt-2 space-y-1 text-amber-200/80">
                <li>- Trimite doar USDT sau USDC pe rețeaua Arbitrum One</li>
                <li>- Trimite exact suma afișată (inclusiv zecimalele)</li>
                <li>- Confirmarea este automată după detectarea tranzacției</li>
                <li>- Nu închide această pagină până la confirmare</li>
              </ul>
            </div>
          </div>

          {/* Status indicator */}
          <div className="mt-6 flex items-center justify-center gap-2 text-sm text-slate-400">
            <div className="h-3 w-3 animate-pulse rounded-full bg-accent-emerald" />
            Se verifică automat... (la fiecare 10 secunde)
          </div>

          {/* Back link */}
          <div className="mt-6 text-center">
            <Link className="text-sm text-slate-500 underline hover:text-slate-300" href="/upgrade">
              Anulează și alege alt plan
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
