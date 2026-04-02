"use client";

import Link from "next/link";
import { useState } from "react";

import {
  connectWalletAction,
  createBotSubscriptionAction,
  updateBotSettingsAction,
} from "@/app/bots/actions";

type SubscribeFlowProps = {
  isElite: boolean;
  botPrice: number;
  walletAddress: string;
  userId: string;
};

const STEP_LABELS = [
  "Confirmare",
  "Plată",
  "Wallet",
  "Configurare",
  "Activare",
];

/* ------------------------------------------------------------------ */
/*  Step indicator                                                      */
/* ------------------------------------------------------------------ */

function StepIndicator({
  currentStep,
  total,
}: {
  currentStep: number;
  total: number;
}) {
  return (
    <div className="mb-10 flex items-center justify-center gap-3">
      {Array.from({ length: total }, (_, i) => {
        const stepNum = i + 1;
        const isCompleted = stepNum < currentStep;
        const isActive = stepNum === currentStep;

        return (
          <div key={stepNum} className="flex items-center gap-3">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold transition-all duration-300 ${
                  isCompleted
                    ? "bg-accent-emerald text-crypto-dark"
                    : isActive
                      ? "border-2 border-accent-emerald text-accent-emerald"
                      : "border border-white/20 text-slate-500"
                }`}
              >
                {isCompleted ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="h-4 w-4"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  stepNum
                )}
              </div>
              <span
                className={`hidden text-[10px] font-semibold uppercase tracking-wider sm:block ${
                  isCompleted
                    ? "text-accent-emerald"
                    : isActive
                      ? "text-accent-emerald"
                      : "text-slate-500"
                }`}
              >
                {STEP_LABELS[i]}
              </span>
            </div>
            {i < total - 1 && (
              <div
                className={`mb-5 hidden h-px w-8 sm:block md:w-12 ${
                  stepNum < currentStep ? "bg-accent-emerald" : "bg-white/10"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main component                                                      */
/* ------------------------------------------------------------------ */

export function SubscribeFlow({
  isElite,
  botPrice,
  walletAddress,
  userId,
}: SubscribeFlowProps) {
  const [step, setStep] = useState(1);

  return (
    <div className="mx-auto max-w-2xl">
      <StepIndicator currentStep={step} total={5} />

      {/* Step 1: Confirm Plan */}
      {step === 1 && (
        <div className="panel p-8">
          <h3 className="mb-2 text-lg font-bold text-white">
            Confirmă Planul
          </h3>
          <p className="mb-6 text-slate-300">
            {isElite
              ? `Ca membru Elite, ai acces la prețul preferențial de $${botPrice}/lună.`
              : `Prețul standard pentru botul de trading este de $${botPrice}/lună.`}
          </p>

          <div className="mb-6 rounded-xl border border-white/10 bg-white/5 p-5">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Bot AI Trading</span>
              <span className="text-xl font-bold text-accent-emerald">
                ${botPrice}/lună
              </span>
            </div>
            {isElite && (
              <p className="mt-2 text-sm text-crypto-green">
                Discount Elite aplicat (-$53)
              </p>
            )}
          </div>

          <form
            action={async (formData: FormData) => {
              await createBotSubscriptionAction(formData);
              setStep(2);
            }}
          >
            <input type="hidden" name="user_id" value={userId} />
            <button type="submit" className="accent-button w-full py-3 font-bold">
              Continua la plata &mdash; ${botPrice}/luna
            </button>
          </form>
        </div>
      )}

      {/* Step 2: Payment */}
      {step === 2 && (
        <div className="panel p-8">
          <h3 className="mb-2 text-lg font-bold text-white">Plata Crypto</h3>
          <p className="mb-6 text-slate-300">
            Trimite suma exacta la adresa de mai jos (USDC/USDT pe Arbitrum):
          </p>

          <div className="space-y-5 rounded-xl border border-white/10 bg-white/5 p-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Suma de plata
              </p>
              <p className="mt-1 text-3xl font-bold text-accent-emerald">
                ${botPrice}.00
              </p>
              <p className="mt-1 text-sm text-slate-400">
                USDC / USDT pe Arbitrum One
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Adresa wallet
              </p>
              <p className="mt-1 break-all rounded-lg border border-white/10 bg-surface-graphite px-4 py-3 font-mono text-sm text-white">
                {walletAddress}
              </p>
            </div>
          </div>

          <div className="mt-6 flex items-center gap-3 text-slate-400">
            <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-accent-emerald" />
            <span className="text-sm">Asteptam confirmarea platii...</span>
          </div>

          <div className="mt-6 rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-4">
            <p className="text-sm text-yellow-200">
              <span className="font-semibold">Important:</span> Trimite suma
              exacta. Plata va fi confirmata automat de monitorul blockchain.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setStep(3)}
            className="ghost-button mt-6 w-full py-3 text-sm"
          >
            Am platit, continua
          </button>
        </div>
      )}

      {/* Step 3: Connect Wallet */}
      {step === 3 && (
        <div className="panel p-8">
          <h3 className="mb-2 text-lg font-bold text-white">
            Conecteaza Wallet Hyperliquid
          </h3>
          <p className="mb-6 text-slate-300">
            Introdu datele API pentru a permite botului sa execute tranzactii pe
            contul tau.
          </p>

          <form
            action={async (formData: FormData) => {
              await connectWalletAction(formData);
              setStep(4);
            }}
            className="space-y-5"
          >
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.3em] text-accent-emerald">
                Adresa Wallet Hyperliquid
              </label>
              <input
                name="hl_address"
                type="text"
                placeholder="0x..."
                required
                className="w-full rounded-xl border border-white/10 bg-surface-graphite px-4 py-3 text-white outline-none transition focus:border-accent-emerald"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.3em] text-accent-emerald">
                API Key (read + trade only)
              </label>
              <input
                name="hl_api_key"
                type="text"
                placeholder="API Key"
                required
                className="w-full rounded-xl border border-white/10 bg-surface-graphite px-4 py-3 text-white outline-none transition focus:border-accent-emerald"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.3em] text-accent-emerald">
                API Secret
              </label>
              <input
                name="hl_api_secret"
                type="password"
                placeholder="API Secret"
                required
                className="w-full rounded-xl border border-white/10 bg-surface-graphite px-4 py-3 text-white outline-none transition focus:border-accent-emerald"
              />
            </div>

            <div className="rounded-xl border border-accent-emerald/20 bg-accent-emerald/5 p-4">
              <p className="text-sm text-slate-300">
                <span className="font-semibold text-accent-emerald">
                  Securitate:
                </span>{" "}
                Folosim API-ul DOAR pentru a plasa tranzactii. NU avem acces la
                fondurile tale. Cheia API trebuie sa aiba permisiuni{" "}
                <span className="font-semibold text-white">read + trade</span>{" "}
                (fara withdraw).
              </p>
            </div>

            <button type="submit" className="accent-button w-full py-3 font-bold">
              Conecteaza Wallet
            </button>
          </form>
        </div>
      )}

      {/* Step 4: Configure */}
      {step === 4 && (
        <div className="panel p-8">
          <h3 className="mb-2 text-lg font-bold text-white">
            Configureaza Botul
          </h3>
          <p className="mb-6 text-slate-300">
            Alege setarile de risc pentru tranzactiile automate.
          </p>

          <form
            action={async (formData: FormData) => {
              await updateBotSettingsAction(formData);
              setStep(5);
            }}
            className="space-y-6"
          >
            {/* Auto-sizing toggle */}
            <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-5">
              <div>
                <p className="font-semibold text-white">Auto-sizing</p>
                <p className="mt-1 text-sm text-slate-400">
                  Marimea pozitiilor se calculeaza automat pe baza capitalului tau
                </p>
              </div>
              <label className="relative inline-flex cursor-pointer items-center">
                <input
                  type="checkbox"
                  name="auto_sizing"
                  defaultChecked
                  className="peer sr-only"
                />
                <div className="h-7 w-12 rounded-full bg-white/10 transition-colors after:absolute after:left-1 after:top-1 after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow after:transition-transform peer-checked:bg-accent-emerald peer-checked:after:translate-x-5" />
              </label>
            </div>

            {/* Max risk */}
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.3em] text-accent-emerald">
                Risc Maxim per Tranzactie (%)
              </label>
              <input
                name="max_risk_pct"
                type="number"
                min={0.5}
                max={5}
                step={0.1}
                defaultValue={2}
                required
                className="w-full rounded-xl border border-white/10 bg-surface-graphite px-4 py-3 text-white outline-none transition focus:border-accent-emerald"
              />
              <p className="mt-2 text-sm text-slate-400">
                Recomandat: 1-2% din capital per tranzactie. Valoare implicita:
                2%.
              </p>
            </div>

            <button type="submit" className="accent-button w-full py-3 font-bold">
              Activeaza Botul
            </button>
          </form>
        </div>
      )}

      {/* Step 5: Success */}
      {step === 5 && (
        <div className="panel p-8 text-center">
          <div className="mx-auto mb-5 flex h-20 w-20 animate-[scale-in_0.4s_ease-out] items-center justify-center rounded-full border border-accent-emerald/30 bg-accent-emerald/10">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="h-10 w-10 text-accent-emerald"
            >
              <path
                fillRule="evenodd"
                d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z"
                clipRule="evenodd"
              />
            </svg>
          </div>

          <h3 className="text-3xl font-bold text-white">Esti live!</h3>
          <p className="mx-auto mt-3 max-w-md text-slate-300">
            Tranzactiile vor fi copiate automat pe contul tau Hyperliquid. Poti
            monitoriza totul din dashboard.
          </p>

          <Link
            href="/bots/dashboard"
            className="accent-button mt-8 inline-flex px-8 py-3 text-lg font-bold"
          >
            Mergi la Dashboard Bot
          </Link>
        </div>
      )}
    </div>
  );
}
