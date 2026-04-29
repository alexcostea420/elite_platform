"use client";

import { useMemo, useState } from "react";

export type CalculatorDraft = {
  symbol: string;
  direction: "long" | "short";
  entry: number;
  stop: number;
  target: number | null;
  qty: number;
  riskAmount: number;
  rrPlanned: number | null;
  leverage: number;
  createdAt: string;
};

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

export function CalculatorPanel({
  onSaveAsDraft,
}: {
  onSaveAsDraft: (draft: CalculatorDraft) => void;
}) {
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
  const [collapsed, setCollapsed] = useState(false);

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

  const handleSaveAsDraft = () => {
    if (!result || result.wrongDirection) return;
    onSaveAsDraft({
      symbol: symbol.toUpperCase().trim() || "BTCUSDT",
      direction,
      entry: num(entry),
      stop: num(stop),
      target: num(target) || null,
      qty: result.positionUnits,
      riskAmount: result.riskAmount,
      rrPlanned: result.rrRatio,
      leverage: result.leverage,
      createdAt: new Date().toISOString(),
    });
  };

  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.03]">
      <header
        className="flex cursor-pointer items-center justify-between border-b border-white/10 px-5 py-3"
        onClick={() => setCollapsed((v) => !v)}
      >
        <div>
          <h2 className="text-sm font-bold text-white">🧮 Calculator Position Sizing</h2>
          <p className="mt-0.5 text-[11px] text-slate-500">
            Calculează mărimea, salvează direct în jurnal ca trade nou.
          </p>
        </div>
        <button
          type="button"
          className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-slate-400 hover:text-white"
        >
          {collapsed ? "Deschide ▾" : "Restrânge ▴"}
        </button>
      </header>

      {!collapsed ? (
        <div className="grid gap-5 p-5 lg:grid-cols-[1fr,1fr]">
          <div className="space-y-4">
            <div>
              <Label>Direcție</Label>
              <div className="mt-1.5 grid grid-cols-2 gap-2">
                {(["long", "short"] as const).map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDirection(d)}
                    className={`rounded-xl border px-3 py-1.5 text-sm font-semibold transition ${
                      direction === d
                        ? d === "long"
                          ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-300"
                          : "border-rose-400/40 bg-rose-400/10 text-rose-300"
                        : "border-white/10 bg-white/[0.02] text-slate-400 hover:bg-white/[0.04]"
                    }`}
                  >
                    {d === "long" ? "Long" : "Short"}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label>Symbol</Label>
                <input
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                  className={`${inputCls} mt-1.5`}
                  placeholder="BTCUSDT"
                />
              </div>
              <div>
                <Label>Cont (USDT)</Label>
                <input
                  inputMode="decimal"
                  value={account}
                  onChange={(e) => setAccount(e.target.value)}
                  className={`${inputCls} mt-1.5`}
                  placeholder="10000"
                />
              </div>
            </div>

            <div>
              <Label>Mod risc</Label>
              <div className="mt-1.5 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRiskMode("percent")}
                  className={`rounded-xl border px-3 py-1.5 text-sm font-semibold transition ${
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
                  className={`rounded-xl border px-3 py-1.5 text-sm font-semibold transition ${
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
                  Risc <span className="font-data text-emerald-400">{riskPct}%</span>{" "}
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
                  className="mt-2 w-full accent-emerald-500"
                />
                <div className="mt-2 flex flex-wrap gap-2">
                  {PRESETS.map((p) => (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => setRiskPct(String(p.risk))}
                      className={`rounded-full border px-3 py-0.5 text-xs font-medium transition ${
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
                  Sumă riscată ($){" "}
                  <span className="text-slate-500">
                    (~{((num(riskFixed) / Math.max(num(account), 1)) * 100).toFixed(2)}% din cont)
                  </span>
                </Label>
                <input
                  inputMode="decimal"
                  value={riskFixed}
                  onChange={(e) => setRiskFixed(e.target.value)}
                  className={`${inputCls} mt-1.5`}
                  placeholder="100"
                />
              </div>
            )}

            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <Label>Entry</Label>
                <input
                  inputMode="decimal"
                  value={entry}
                  onChange={(e) => setEntry(e.target.value)}
                  className={`${inputCls} mt-1.5`}
                  placeholder="65000"
                />
              </div>
              <div>
                <Label>Stop</Label>
                <input
                  inputMode="decimal"
                  value={stop}
                  onChange={(e) => setStop(e.target.value)}
                  className={`${inputCls} mt-1.5`}
                  placeholder={direction === "long" ? "63000" : "67000"}
                />
              </div>
              <div>
                <Label>Target (opt.)</Label>
                <input
                  inputMode="decimal"
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  className={`${inputCls} mt-1.5`}
                  placeholder={direction === "long" ? "70000" : "60000"}
                />
              </div>
            </div>

            {result?.wrongDirection ? (
              <p className="text-xs text-amber-400">
                ⚠ Pe {direction === "long" ? "long" : "short"}, stop-ul ar trebui să fie{" "}
                {direction === "long" ? "sub" : "deasupra"} prețului de intrare.
              </p>
            ) : null}

            <div>
              <Label>
                Levier <span className="text-slate-500">(1 = spot)</span>
              </Label>
              <div className="mt-1.5 flex flex-wrap gap-2">
                {[1, 2, 3, 5, 10, 20, 50].map((lev) => (
                  <button
                    key={lev}
                    type="button"
                    onClick={() => setLeverage(String(lev))}
                    className={`rounded-full border px-3 py-0.5 text-xs font-medium transition ${
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

          <div className="space-y-3 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.02] p-4">
            <h3 className="text-sm font-semibold text-white">Rezultat</h3>
            {!result ? (
              <p className="text-xs text-slate-500">
                Completează cont, risc, entry și stop ca să vezi mărimea poziției.
              </p>
            ) : result.wrongDirection ? (
              <p className="text-xs text-amber-400">
                Stop-ul nu e în direcția corectă pentru {direction}.
              </p>
            ) : (
              <div className="space-y-2">
                <Metric
                  label="Sumă riscată"
                  value={formatUsdt(result.riskAmount)}
                  hint={`${result.riskPctEffective.toFixed(2)}% din cont`}
                  tone="risk"
                />
                <Metric
                  label="Cantitate"
                  value={formatUnits(result.positionUnits)}
                  hint={`Stop la ${result.stopPct.toFixed(2)}%`}
                />
                <Metric
                  label="Valoare poziție"
                  value={formatUsdt(result.positionValue)}
                  hint={`${result.positionPctOfAccount.toFixed(1)}% notional`}
                />
                {result.leverage > 1 ? (
                  <Metric
                    label={`Margin (${result.leverage}x)`}
                    value={formatUsdt(result.marginRequired)}
                  />
                ) : null}
                {result.rrRatio != null && result.rewardAmount != null ? (
                  <Metric
                    label="R/R"
                    value={`1 : ${result.rrRatio.toFixed(2)}`}
                    hint={`Profit pot.: ${formatUsdt(result.rewardAmount)}`}
                    tone={result.rrRatio >= 2 ? "good" : result.rrRatio >= 1 ? "neutral" : "bad"}
                  />
                ) : null}

                <button
                  type="button"
                  onClick={handleSaveAsDraft}
                  className="mt-2 w-full rounded-xl bg-emerald-500 px-4 py-2 text-sm font-bold text-black transition hover:bg-emerald-400"
                >
                  📓 Salvează în jurnal →
                </button>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </section>
  );
}

const inputCls =
  "w-full rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2 font-data text-sm text-white tabular-nums placeholder:text-slate-600 focus:border-emerald-400/40 focus:outline-none focus:ring-1 focus:ring-emerald-400/30";

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
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-2.5">
      <p className="text-[10px] uppercase tracking-wider text-slate-500">{label}</p>
      <p className={`mt-0.5 font-data text-base font-bold tabular-nums ${valueColor}`}>{value}</p>
      {hint ? <p className="mt-0.5 text-[11px] text-slate-500">{hint}</p> : null}
    </div>
  );
}
