"use client";

import { Suspense, useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";

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
  trial_3days: {
    slug: "trial_3days",
    label: "Trial Gratuit - 3 Zile",
    planDuration: "30_days",
    chain: "ARB",
  },
  elite_monthly: {
    slug: "elite_monthly",
    label: "Elite - 30 Zile",
    planDuration: "30_days",
    chain: "ARB",
  },
  elite_3mo: {
    slug: "elite_3mo",
    label: "Elite - 3 Luni",
    planDuration: "90_days",
    chain: "ARB",
  },
  elite_annual: {
    slug: "elite_annual",
    label: "Elite - 12 Luni",
    planDuration: "365_days",
    chain: "ARB",
  },
  bot_monthly: {
    slug: "bot_monthly",
    label: "Bot AI Trading - 30 Zile",
    planDuration: "bot_monthly",
    chain: "ARB",
  },
  bot_monthly_elite: {
    slug: "bot_monthly_elite",
    label: "Bot AI Trading (Elite) - 30 Zile",
    planDuration: "bot_monthly_elite",
    chain: "ARB",
  },
  elite_bot_bundle: {
    slug: "elite_bot_bundle",
    label: "Elite + Bot Bundle - 30 Zile",
    planDuration: "30_days",
    chain: "ARB",
  },
};

function formatAmount(amount: number): string {
  return amount.toFixed(1);
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

  // Error - special handling for unauthenticated
  if (step === "error") {
    const isAuthError = error === "Neautentificat.";
    return (
      <div className="flex min-h-screen items-center justify-center bg-crypto-dark px-4">
        <div className={`panel max-w-md px-6 py-8 text-center md:px-8 ${isAuthError ? "border-accent-emerald/30" : "border-red-500/30"}`}>
          <div className="text-5xl">{isAuthError ? "🔒" : "⚠️"}</div>
          <h2 className="mt-4 text-2xl font-bold text-white">
            {isAuthError ? "Ai nevoie de un cont" : "Eroare la plata"}
          </h2>
          <p className="mt-3 text-slate-300">
            {isAuthError
              ? "Pentru a plăti, trebuie să ai un cont. Creează-ți unul gratuit sau loghează-te."
              : error}
          </p>
          <div className="mt-6 flex flex-col gap-3">
            {isAuthError ? (
              <>
                <Link className="accent-button" href="/signup">
                  Creează cont gratuit
                </Link>
                <Link className="ghost-button" href="/login?next=/upgrade">
                  Am deja cont - Loghează-mă
                </Link>
              </>
            ) : (
              <>
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
              </>
            )}
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
      <div className="flex min-h-screen items-center justify-center bg-crypto-dark px-4">
        <div className="panel max-w-md border-accent-emerald/30 px-6 py-8 text-center md:px-8">
          <div className="text-5xl">✅</div>
          <h2 className="mt-4 text-2xl font-bold text-white sm:text-3xl">Plata confirmată!</h2>
          <p className="mt-3 text-slate-300">
            Accesul tau a fost activat{expiresAt
              ? ` pana pe ${new Date(expiresAt).toLocaleDateString("ro-RO")}`
              : ""}.
          </p>
          <p className="mt-2 text-sm font-semibold text-accent-emerald">{planInfo.label}</p>
          {txHash ? (
            <p className="mt-2 text-sm text-slate-500">
              TX: {txHash.slice(0, 16)}...{txHash.slice(-8)}
            </p>
          ) : null}

          {/* Discord connect prompt */}
          <div className="mt-6 rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-5">
            <p className="text-base font-semibold text-white">Conectează Discord</p>
            <p className="mt-2 text-sm text-slate-400">
              Primești automat rolul Elite și acces la canalele private.
            </p>
            <button
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#5865F2] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#4752C4]"
              onClick={() => router.push("/auth/discord/start")}
              type="button"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/></svg>
              Conectează Discord
            </button>
          </div>

          <button
            className="mt-4 text-sm text-slate-500 underline hover:text-slate-300"
            onClick={() => router.push("/dashboard")}
            type="button"
          >
            Mergi la Dashboard fără Discord
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
            <div className="rounded-2xl border border-accent-emerald/20 bg-accent-emerald/5 p-4 md:p-5">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                Suma exactă de trimis
              </p>
              <span className="block text-2xl font-bold text-accent-emerald sm:text-3xl">
                {paymentData ? formatAmount(paymentData.amount) : "-"}{" "}
                <span className="text-base sm:text-lg">{paymentData?.currency ?? "USDT"}</span>
              </span>
              <button
                className="mt-3 w-full rounded-xl border border-accent-emerald/30 px-4 py-3 text-sm font-semibold text-accent-emerald hover:bg-accent-emerald/10 sm:w-auto"
                onClick={() => paymentData && copyToClipboard(formatAmount(paymentData.amount), "amount")}
                type="button"
              >
                {copied === "amount" ? "Copiat!" : "Copiază suma"}
              </button>
              <p className="mt-3 text-xs text-slate-400 sm:text-sm">
                Suma include un identificator unic. Trimite exact această sumă.
              </p>
            </div>

            {/* Wallet Address */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 md:p-5">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                Adresa wallet (Arbitrum)
              </p>
              {paymentData?.wallet_address && (
                <div className="mb-3 flex justify-center">
                  <div className="rounded-xl bg-white p-3">
                    <QRCodeSVG value={paymentData.wallet_address} size={160} />
                  </div>
                </div>
              )}
              <code className="mb-3 block break-all text-xs text-white sm:text-sm">
                {paymentData?.wallet_address ?? "-"}
              </code>
              <button
                className="w-full rounded-xl border border-white/10 px-4 py-3 text-sm font-semibold text-slate-300 hover:bg-white/5 sm:w-auto"
                onClick={() => paymentData && copyToClipboard(paymentData.wallet_address, "address")}
                type="button"
              >
                {copied === "address" ? "Copiat!" : "Copiază adresa"}
              </button>
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
