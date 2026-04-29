"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

const PRESETS = [
  { label: "1% (recomandat)", risk: 1 },
  { label: "0.5% (conservator)", risk: 0.5 },
  { label: "2% (agresiv)", risk: 2 },
];

type RiskMode = "percent" | "fixed";

function formatUsdt(n: number): string {
  if (!Number.isFinite(n)) return "—";
  const v = n.toLocaleString("en-US", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  });
  return `$${v}`;
}

function formatUnits(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return "—";
  if (n < 0.001) return n.toExponential(2);
  if (n < 1) return n.toLocaleString("en-US", { maximumFractionDigits: 6 });
  if (n < 100) return n.toLocaleString("en-US", { maximumFractionDigits: 4 });
  return n.toLocaleString("en-US", { maximumFractionDigits: 2 });
}

function num(s: string): number {
  const v = parseFloat(s.replace(",", "."));
  return Number.isFinite(v) ? v : NaN;
}

export function CalculatorClient({ isAuthed }: { isAuthed: boolean }) {
  const [account, setAccount] = useState("10000");
  const [riskMode, setRiskMode] = useState<RiskMode>("percent");
  const [riskPct, setRiskPct] = useState("1");
  const [riskFixed, setRiskFixed] = useState("100");
  const [entry, setEntry] = useState("");
  const [stop, setStop] = useState("");
  const [target, setTarget] = useState("");
  const [direction, setDirection] = useState<"long" | "short">("long");
  const [leverage, setLeverage] = useState("1");
  const [symbol, setSymbol] = useState("BTCUSDT");

  const result = useMemo(() => {
    const acc = num(account);
    const e = num(entry);
    const s = num(stop);
    const t = num(target);
    const lev = Math.max(1, num(leverage) || 1);

    if (!Number.isFinite(acc) || acc <= 0) return null;
    if (!Number.isFinite(e) || e <= 0) return null;
    if (!Number.isFinite(s) || s <= 0) return null;
    if (e === s) return null;

    const wrongDirection =
      (direction === "long" && s >= e) || (direction === "short" && s <= e);

    let riskAmount: number;
    let riskPctEffective: number;
    if (riskMode === "fixed") {
      const fixed = num(riskFixed);
      if (!Number.isFinite(fixed) || fixed <= 0) return null;
      riskAmount = fixed;
      riskPctEffective = (fixed / acc) * 100;
    } else {
      const rPct = num(riskPct);
      if (!Number.isFinite(rPct) || rPct <= 0) return null;
      riskAmount = (acc * rPct) / 100;
      riskPctEffective = rPct;
    }

    const stopDistance = Math.abs(e - s);
    const stopPct = (stopDistance / e) * 100;
    const positionUnits = riskAmount / stopDistance;
    const positionValue = positionUnits * e;
    const positionPctOfAccount = (positionValue / acc) * 100;
    const marginRequired = positionValue / lev;

    let rrRatio: number | null = null;
    let rewardAmount: number | null = null;
    if (Number.isFinite(t) && t > 0 && t !== e) {
      const targetDistance = Math.abs(t - e);
      const targetWrongDir =
        (direction === "long" && t <= e) || (direction === "short" && t >= e);
      if (!targetWrongDir) {
        rrRatio = targetDistance / stopDistance;
        rewardAmount = positionUnits * targetDistance;
      }
    }

    return {
      riskAmount,
      riskPctEffective,
      stopDistance,
      stopPct,
      positionUnits,
      positionValue,
      positionPctOfAccount,
      marginRequired,
      leverage: lev,
      rrRatio,
      rewardAmount,
      wrongDirection,
    };
  }, [account, riskMode, riskPct, riskFixed, entry, stop, target, direction, leverage]);

  const saveToJournal = () => {
    if (!result || result.wrongDirection) return;
    const draft = {
      symbol,
      direction,
      entry: num(entry),
      stop: num(stop),
      target: num(target) || null,
      qty: result.positionUnits,
      riskAmount: result.riskAmount,
      rrPlanned: result.rrRatio,
      leverage: result.leverage,
      createdAt: new Date().toISOString(),
    };
    try {
      sessionStorage.setItem("journal_draft", JSON.stringify(draft));
      window.location.href = "/tools/journal?from=calculator";
    } catch {
      window.location.href = "/tools/journal";
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr,1fr]">
      <section className="glass-card rounded-2xl border border-white/10 p-5 sm:p-6">
        <h2 className="mb-4 text-base font-semibold text-white">Datele tale</h2>

        <div className="space-y-5">
          <div>
            <Label>Direcție</Label>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {(["long", "short"] as const).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDirection(d)}
                  className={`rounded-xl border px-3 py-2 text-sm font-semibold transition ${
                    direction === d
                      ? d === "long"
                        ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-300"
                        : "border-rose-400/40 bg-rose-400/10 text-rose-300"
                      : "border-white/10 bg-white/[0.02] text-slate-400 hover:bg-white/[0.04]"
                  }`}
                >
                  {d === "long" ? "Long (cumpăr)" : "Short (vând)"}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label>Simbol (pentru jurnal)</Label>
            <input
              value={symbol}
              onChange={(e) => setSymbol(e.target.value.toUpperCase())}
              className={`${inputCls} mt-2`}
              placeholder="BTCUSDT"
            />
          </div>

          <div>
            <Label>Mărimea contului</Label>
            <div className="mt-2 flex gap-2">
              <input
                inputMode="decimal"
                value={account}
                onChange={(e) => setAccount(e.target.value)}
                className={inputCls}
                placeholder="10000"
              />
              <div className="flex items-center rounded-xl border border-white/10 bg-white/[0.02] px-3 text-sm font-semibold text-slate-200">
                USDT
              </div>
            </div>
          </div>

          <div>
            <Label>Mod risc</Label>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setRiskMode("percent")}
                className={`rounded-xl border px-3 py-2 text-sm font-semibold transition ${
                  riskMode === "percent"
                    ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-300"
                    : "border-white/10 bg-white/[0.02] text-slate-400 hover:bg-white/[0.04]"
                }`}
              >
                Procent
              </button>
              <button
                type="button"
                onClick={() => setRiskMode("fixed")}
                className={`rounded-xl border px-3 py-2 text-sm font-semibold transition ${
                  riskMode === "fixed"
                    ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-300"
                    : "border-white/10 bg-white/[0.02] text-slate-400 hover:bg-white/[0.04]"
                }`}
              >
                Sumă fixă ($)
              </button>
            </div>
          </div>

          {riskMode === "percent" ? (
            <div>
              <Label>
                Risc per trade <span className="font-data text-emerald-400">{riskPct}%</span>{" "}
                <span className="text-slate-500">
                  (~{formatUsdt((num(account) * num(riskPct)) / 100)})
                </span>
              </Label>
              <input
                type="range"
                min={0.1}
                max={5}
                step={0.1}
                value={riskPct}
                onChange={(e) => setRiskPct(e.target.value)}
                className="mt-3 w-full accent-emerald-500"
              />
              <div className="mt-2 flex flex-wrap gap-2">
                {PRESETS.map((p) => (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => setRiskPct(String(p.risk))}
                    className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                      Math.abs(num(riskPct) - p.risk) < 0.01
                        ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-300"
                        : "border-white/10 bg-white/[0.02] text-slate-400 hover:bg-white/[0.04]"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div>
              <Label>
                Sumă riscată per trade ($){" "}
                <span className="text-slate-500">
                  (~{((num(riskFixed) / Math.max(num(account), 1)) * 100).toFixed(2)}% din cont)
                </span>
              </Label>
              <div className="mt-2 flex gap-2">
                <input
                  inputMode="decimal"
                  value={riskFixed}
                  onChange={(e) => setRiskFixed(e.target.value)}
                  className={inputCls}
                  placeholder="100"
                />
                <div className="flex items-center rounded-xl border border-white/10 bg-white/[0.02] px-3 text-sm font-semibold text-slate-200">
                  $
                </div>
              </div>
              <p className="mt-2 text-[11px] text-slate-500">
                Util când ai mai multe conturi sau vrei sumă constantă indiferent de balanță.
              </p>
            </div>
          )}

          <div>
            <Label>Preț de intrare</Label>
            <input
              inputMode="decimal"
              value={entry}
              onChange={(e) => setEntry(e.target.value)}
              className={`${inputCls} mt-2`}
              placeholder="65000"
            />
          </div>

          <div>
            <Label>Stop-loss</Label>
            <input
              inputMode="decimal"
              value={stop}
              onChange={(e) => setStop(e.target.value)}
              className={`${inputCls} mt-2`}
              placeholder={direction === "long" ? "63000" : "67000"}
            />
            {result?.wrongDirection ? (
              <p className="mt-1 text-xs text-amber-400">
                ⚠ Pe {direction === "long" ? "long" : "short"}, stop-ul ar trebui să fie{" "}
                {direction === "long" ? "sub" : "deasupra"} prețului de intrare.
              </p>
            ) : null}
          </div>

          <div>
            <Label>
              Preț target <span className="text-slate-500">(opțional, pentru R/R)</span>
            </Label>
            <input
              inputMode="decimal"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              className={`${inputCls} mt-2`}
              placeholder={direction === "long" ? "70000" : "60000"}
            />
          </div>

          <div>
            <Label>
              Levier <span className="text-slate-500">(pentru futures, 1 = spot)</span>
            </Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {[1, 2, 3, 5, 10, 20, 50].map((lev) => (
                <button
                  key={lev}
                  type="button"
                  onClick={() => setLeverage(String(lev))}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                    num(leverage) === lev
                      ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-300"
                      : "border-white/10 bg-white/[0.02] text-slate-400 hover:bg-white/[0.04]"
                  }`}
                >
                  {lev}x
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="glass-card rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.02] p-5 sm:p-6">
        <h2 className="mb-4 text-base font-semibold text-white">Rezultat</h2>

        {!result ? (
          <p className="text-sm text-slate-500">
            Completează cont, risc, entry și stop-loss ca să vezi mărimea poziției.
          </p>
        ) : result.wrongDirection ? (
          <p className="text-sm text-amber-400">
            Stop-loss-ul nu e în direcția corectă. Verifică Long/Short și corectează.
          </p>
        ) : (
          <div className="space-y-4">
            <Metric
              label="Sumă riscată"
              value={formatUsdt(result.riskAmount)}
              hint={`${result.riskPctEffective.toFixed(2)}% din cont`}
              tone="risk"
            />
            <Metric
              label="Mărime poziție (cantitate)"
              value={formatUnits(result.positionUnits)}
              hint={`Stop la ${result.stopPct.toFixed(2)}% distanță`}
            />
            <Metric
              label="Valoare poziție (notional)"
              value={formatUsdt(result.positionValue)}
              hint={`${result.positionPctOfAccount.toFixed(1)}% din cont (notional)`}
            />
            {result.leverage > 1 ? (
              <Metric
                label={`Margin necesar (${result.leverage}x)`}
                value={formatUsdt(result.marginRequired)}
                hint={`${((result.marginRequired / num(account)) * 100).toFixed(2)}% din cont blocat`}
                tone="neutral"
              />
            ) : null}
            {result.rrRatio != null && result.rewardAmount != null ? (
              <Metric
                label="Risk / Reward"
                value={`1 : ${result.rrRatio.toFixed(2)}`}
                hint={`Profit potențial: ${formatUsdt(result.rewardAmount)}`}
                tone={result.rrRatio >= 2 ? "good" : result.rrRatio >= 1 ? "neutral" : "bad"}
              />
            ) : null}

            {result.leverage === 1 && result.positionPctOfAccount > 100 ? (
              <div className="rounded-xl border border-amber-400/30 bg-amber-400/5 p-3 text-xs text-amber-300">
                ℹ Poziția depășește contul → ai nevoie de levier (
                {(result.positionPctOfAccount / 100).toFixed(1)}x). Atenție: levierul amplifică
                pierderile, nu doar profitul.
              </div>
            ) : null}

            <button
              type="button"
              onClick={saveToJournal}
              className="mt-2 w-full rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-bold text-black transition hover:bg-emerald-400"
            >
              📓 Salvează în jurnal →
            </button>
          </div>
        )}

        <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.02] p-4 text-xs text-slate-400">
          <p className="mb-2 font-semibold text-slate-300">De ce contează?</p>
          <p className="leading-relaxed">
            Cu risc de 1% pe trade, ai nevoie de 100 de pierderi consecutive ca să-ți pierzi contul.
            La 10% per trade, doar 10. Diferența între cei care rămân pe piață și cei care se
            prăbușesc.
          </p>
        </div>

        <div className="mt-3 flex gap-2 text-xs">
          <Link
            href="/tools/journal"
            className="flex-1 rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2 text-center text-slate-300 transition hover:border-emerald-400/30 hover:bg-emerald-400/5 hover:text-emerald-300"
          >
            📓 Jurnal trading
          </Link>
          <Link
            href="/tools/liquidation-map"
            className="flex-1 rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2 text-center text-slate-300 transition hover:border-emerald-400/30 hover:bg-emerald-400/5 hover:text-emerald-300"
          >
            🔥 Liquidation Map
          </Link>
        </div>

        {!isAuthed ? (
          <div className="mt-4 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.04] p-4">
            <p className="text-sm font-semibold text-white">Vrei și partea avansată?</p>
            <p className="mt-1 text-xs text-slate-400">
              În Elite primești zone exacte de Buy/Sell pe 16 acțiuni + 25 crypto, indicatori
              TradingView și analize live pe Discord.
            </p>
            <Link
              href="/upgrade"
              className="mt-3 inline-flex rounded-lg bg-emerald-500 px-4 py-2 text-xs font-semibold text-crypto-dark transition hover:bg-emerald-400"
            >
              Vezi planurile Elite →
            </Link>
          </div>
        ) : null}
      </section>
    </div>
  );
}

const inputCls =
  "w-full rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2 font-data text-base text-white tabular-nums placeholder:text-slate-600 focus:border-emerald-400/40 focus:outline-none focus:ring-1 focus:ring-emerald-400/30";

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
      {children}
    </label>
  );
}

function Metric({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "good" | "bad" | "neutral" | "risk";
}) {
  const valueColor =
    tone === "good"
      ? "text-emerald-400"
      : tone === "bad"
        ? "text-rose-400"
        : tone === "risk"
          ? "text-amber-300"
          : "text-white";
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
      <p className="text-[11px] uppercase tracking-wider text-slate-500">{label}</p>
      <p className={`mt-1 font-data text-xl font-bold tabular-nums sm:text-2xl ${valueColor}`}>
        {value}
      </p>
      {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
    </div>
  );
}
