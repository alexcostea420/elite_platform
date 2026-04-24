"use client";

import {
  Chart,
  registerables,
  type ChartConfiguration,
  type Plugin,
} from "chart.js";
import { motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  CONCEPTS,
  CURRENT_VERDICT,
  DOM_HIGHS,
  DOM_LOWS,
  ECLIPSES_LUNAR,
  ECLIPSES_SOLAR,
  FIB_DATES,
  FIB_LEVELS_SCORE,
  FIB_TIMELINE,
  GANN_INTERVALS,
  GLOSSARY,
  KNOWN_FULL_MOON,
  MERCURY_DATA,
  MONTH_BOTTOMS,
  MONTH_NAMES_RO,
  MONTH_TOPS,
  NEXT_EVENTS,
  ON_CHAIN_METRICS,
  SECTION_INFO,
  SUBNAV_LINKS,
  type ConceptData,
  type EclipseEvent,
} from "@/lib/data/pivots-data";

import { eventLinePlugin } from "./pivots-dashboard/chart-plugin";
import { cx, fmtP, fmtDate, diffDays } from "./pivots-dashboard/formatters";
import { calcScore } from "./pivots-dashboard/score";
import type { ActiveMethod, UpcomingEvent } from "./pivots-dashboard/score";
import s from "./pivots-dashboard.module.css";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Info Tooltip — small "?" badge with hover/click popover
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function InfoTooltip({ id, label }: { id: string; label?: string }) {
  const [open, setOpen] = useState(false);
  const text = SECTION_INFO[id];
  const wrapRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [open]);

  if (!text) return null;

  return (
    <span
      ref={wrapRef}
      style={{ position: "relative", display: "inline-flex", alignItems: "center" }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        className={s.infoTrigger}
        aria-label="Ce înseamnă"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
      >
        ?
      </button>
      <span
        className={cx(s.infoPopover, open && s.infoPopoverShow)}
        style={{ top: "calc(100% + 8px)", left: 0 }}
      >
        <span className={s.infoPopoverTitle}>{label ?? "Ce înseamnă"}</span>
        {text}
      </span>
    </span>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Verdict Hero — TL;DR card for noobs at the top of the page
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function VerdictHero() {
  const v = CURRENT_VERDICT;
  return (
    <motion.div
      className={s.verdictHero}
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className={s.verdictTop}>
        <span className={s.verdictBadge}>
          <span className={s.verdictBadgePulse} />
          Verdict azi · {new Date().toLocaleDateString("ro-RO", { day: "2-digit", month: "long", year: "numeric" })}
        </span>
        <InfoTooltip id="s-onchain" label="Cum se calculează?" />
      </div>
      <h2 className={s.verdictTitle}>
        <span className={s.verdictTitleEmoji}>{v.emoji}</span>
        {v.title}
      </h2>
      <p className={s.verdictDesc}>
        <span className={s.verdictDescStrong}>{v.shortDescription}</span>{" "}
        {v.longDescription}
      </p>

      <div className={s.verdictMetrics}>
        <div className={s.verdictMetric}>
          <div className={s.verdictMetricVal} style={{ color: "var(--green)" }}>
            {v.confidenceScore}%
          </div>
          <div className={s.verdictMetricLbl}>Convicție</div>
        </div>
        <div className={s.verdictMetric}>
          <div className={s.verdictMetricVal} style={{ color: "var(--green)" }}>
            {v.bullishSignals}/{v.totalSignals}
          </div>
          <div className={s.verdictMetricLbl}>Semnale Bullish</div>
        </div>
        <div className={s.verdictMetric}>
          <div className={s.verdictMetricVal} style={{ color: "var(--red)" }}>
            {v.bearishSignals}
          </div>
          <div className={s.verdictMetricLbl}>Semnale Bearish</div>
        </div>
      </div>

      <div className={s.verdictActions}>
        <div className={cx(s.verdictActionBox, s.verdictActionBoxDo)}>
          <div className={s.verdictActionTitle} style={{ color: "var(--green)" }}>
            ✓ Ce să faci acum
          </div>
          <ul className={cx(s.verdictActionList, s.do)}>
            {v.doNow.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </div>
        <div className={cx(s.verdictActionBox, s.verdictActionBoxDont)}>
          <div className={s.verdictActionTitle} style={{ color: "var(--red)" }}>
            ✗ Ce să NU faci
          </div>
          <ul className={cx(s.verdictActionList, s.dont)}>
            {v.dontDo.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </div>
      </div>
    </motion.div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// On-Chain Metrics — grid of fact-checked indicators
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function formatMetricValue(value: number, unit: string): string {
  if (unit === "$") {
    if (value >= 1000) return "$" + (value / 1000).toFixed(value >= 10000 ? 1 : 2) + "K";
    return "$" + value.toFixed(0);
  }
  if (unit === "×") return value.toFixed(2) + "×";
  if (unit === "" && value < 10) return value.toFixed(2);
  return value.toLocaleString("en-US");
}

function OnChainSection() {
  return (
    <>
      <p className={cx(s.small, s.muted, s.mb20, s.reveal)}>
        6 indicatori on-chain fact-checked Aprilie 2026 — surse: Glassnode,
        BitcoinMagazinePro, CoinGlass, CoinDesk. Fiecare are <strong style={{ color: "var(--text)" }}>hit rate istoric verificat</strong>.
      </p>
      <div className={cx(s.onchainGrid, s.reveal)}>
        {ON_CHAIN_METRICS.map((m, i) => {
          const markerLeft = `${Math.max(2, Math.min(98, m.rangePos * 100))}%`;
          return (
            <motion.div
              key={m.key}
              className={s.onchainCard}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.4, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className={s.onchainCardBeam} style={{ color: m.zoneColor }} />
              <div className={s.onchainHeader}>
                <div>
                  <div className={s.onchainName}>{m.name}</div>
                </div>
                <span
                  className={s.onchainZoneBadge}
                  style={{
                    background: m.zoneColor + "22",
                    color: m.zoneColor,
                    border: `1px solid ${m.zoneColor}55`,
                  }}
                >
                  {m.zoneLabel}
                </span>
              </div>

              <div className={s.onchainValue} style={{ color: m.zoneColor }}>
                {formatMetricValue(m.value, m.unit)}
              </div>

              <div className={s.onchainBar}>
                <div className={s.onchainBarMarker} style={{ left: markerLeft }} />
              </div>
              <div className={s.onchainRanges}>
                <span>BOTTOM</span>
                <span>NEUTRU</span>
                <span>TOP</span>
              </div>

              <div className={s.onchainSignal}>
                <strong style={{ color: m.zoneColor }}>● Semnal: </strong>
                {m.signal}
              </div>

              <div className={s.onchainExplain}>
                <div className={s.onchainExplainItem}>
                  <span className={s.onchainExplainLbl}>Ce este</span>
                  {m.whatIs}
                </div>
                <div className={s.onchainExplainItem}>
                  <span className={s.onchainExplainLbl}>De ce contează</span>
                  {m.whyMatters}
                </div>
              </div>

              <div className={s.onchainFooter}>
                <span>{m.source}</span>
                <span className={s.onchainHitRate}>✓ {m.hitRate}</span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Glossary — beginner-friendly term explanations
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function GlossarySection() {
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  return (
    <>
      <p className={cx(s.small, s.muted, s.mb20, s.reveal)}>
        Termeni tehnici explicați pe înțelesul tuturor. Click pe un termen pentru explicație completă.
      </p>
      <div className={cx(s.glossaryGrid, s.reveal)}>
        {GLOSSARY.map((g, i) => {
          const isOpen = openIdx === i;
          return (
            <div
              key={g.term}
              className={cx(s.glossaryCard, isOpen && s.glossaryCardOpen)}
              onClick={() => setOpenIdx(isOpen ? null : i)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setOpenIdx(isOpen ? null : i);
                }
              }}
            >
              <span className={s.glossaryArrow}>{"▾"}</span>
              <div className={s.glossaryTerm}>{g.term}</div>
              <div className={s.glossaryShort}>{g.short}</div>
              <div className={s.glossaryFull}>{g.full}</div>
            </div>
          );
        })}
      </div>
    </>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Quick Jump — floating mobile FAB to scroll back to top/subnav
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function QuickJump() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handler = () => setVisible(window.scrollY > 600);
    handler();
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  if (!visible) return null;
  return (
    <button
      type="button"
      className={s.quickJump}
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="Înapoi sus"
    >
      ↑ Sus
    </button>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Bar Chart sub-component
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function BarChart({
  data,
  maxV,
  hotColor,
  isMonth,
}: {
  data: Record<number, number>;
  maxV: number;
  hotColor: string;
  isMonth?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    if (!ref.current) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setAnimated(true);
          obs.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  const keys = Object.keys(data)
    .map(Number)
    .sort((a, b) => a - b)
    .filter((d) => data[d] >= 1.0);

  return (
    <div ref={ref}>
      {keys.map((d, i) => {
        const v = data[d];
        const pct = Math.min(100, ((v - 1) / (maxV - 1)) * 100);
        const fc = v >= 1.8 ? hotColor : v >= 1.4 ? hotColor + "bb" : "#334155";
        const vc = v >= 1.5 ? hotColor : "#64748b";
        return (
          <div key={d} className={s.barRow}>
            <div className={s.barLabel}>{isMonth ? MONTH_NAMES_RO[d - 1] : `ziua ${d}`}</div>
            <div className={s.barTrack}>
              <div
                className={s.barFill}
                style={{
                  background: fc,
                  width: animated ? `${pct}%` : "0%",
                  transitionDelay: `${i * 30}ms`,
                }}
              />
            </div>
            <div className={s.barVal} style={{ color: vc }}>
              +{Math.round((v - 1) * 100)}%{v >= 1.5 ? " \u2605" : ""}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Eclipse Table sub-component
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

interface IntervalData {
  price: number;
  pct: number;
}

function getIntervals(ev: EclipseEvent) {
  const p = ev.pre || [];
  const pr = ev.prices || [];
  const evPrice = pr[0];
  if (!evPrice) return null;
  const pct = (v: number | null | undefined) =>
    v != null && evPrice ? ((v - evPrice) / evPrice) * 100 : null;
  return {
    d28b: p[1] != null ? { price: p[1], pct: pct(p[1])! } : null,
    d14b: p[3] != null ? { price: p[3], pct: pct(p[3])! } : null,
    d7b: p[4] != null ? { price: p[4], pct: pct(p[4])! } : null,
    event: { price: evPrice, pct: 0 },
    d7a: pr[1] != null ? { price: pr[1], pct: pct(pr[1])! } : null,
    d14a: pr[2] != null ? { price: pr[2], pct: pct(pr[2])! } : null,
    d28a: pr[4] != null ? { price: pr[4], pct: pct(pr[4])! } : null,
    d90a: pr[12] != null ? { price: pr[12], pct: pct(pr[12])! } : null,
  } as Record<string, IntervalData | null>;
}

const INTERVAL_SLOTS = [
  { key: "d28b", label: "-28z", isEvent: false },
  { key: "d14b", label: "-14z", isEvent: false },
  { key: "d7b", label: "-7z", isEvent: false },
  { key: "event", label: "ECLIPS\u0102", isEvent: true },
  { key: "d7a", label: "+7z", isEvent: false },
  { key: "d14a", label: "+14z", isEvent: false },
  { key: "d28a", label: "+28z", isEvent: false },
  { key: "d90a", label: "+90z", isEvent: false },
];

const AGG_KEYS = ["d28b", "d14b", "d7b", "d7a", "d14a", "d28a", "d90a"];
const ALL_KEYS = ["d28b", "d14b", "d7b", "event", "d7a", "d14a", "d28a", "d90a"];
const KEY_LABELS: Record<string, string> = {
  d28b: "-28 zile", d14b: "-14 zile", d7b: "-7 zile", event: "Eclipsă",
  d7a: "+7 zile", d14a: "+14 zile", d28a: "+28 zile", d90a: "+90 zile",
};

function EclipseCompactTable({ events, color: conceptColor }: { events: EclipseEvent[]; color: string }) {
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const real = events.filter((e) => e.prices.length > 2);

  // Compute aggregates for conclusion
  const agg = useMemo(() => {
    const result: Record<string, { sum: number; wins: number; n: number; avg?: number; winRate?: number }> = {};
    AGG_KEYS.forEach((k) => { result[k] = { sum: 0, wins: 0, n: 0 }; });
    const bottomAt: Record<string, number> = {};
    const topAt: Record<string, number> = {};
    ALL_KEYS.forEach((k) => { bottomAt[k] = 0; topAt[k] = 0; });

    real.forEach((ev) => {
      const ivs = getIntervals(ev);
      if (!ivs) return;
      AGG_KEYS.forEach((k) => {
        const d = ivs[k];
        if (d && d.pct != null) {
          result[k].sum += d.pct;
          if (d.pct > 0) result[k].wins++;
          result[k].n++;
        }
      });
      let minK: string | null = null;
      let maxK: string | null = null;
      let minV = Infinity;
      let maxV = -Infinity;
      ALL_KEYS.forEach((k) => {
        const d = ivs[k];
        if (!d || d.price == null) return;
        if (d.price < minV) { minV = d.price; minK = k; }
        if (d.price > maxV) { maxV = d.price; maxK = k; }
      });
      if (minK) bottomAt[minK]++;
      if (maxK) topAt[maxK]++;
    });

    AGG_KEYS.forEach((k) => {
      const a = result[k];
      if (a.n >= 2) {
        a.avg = a.sum / a.n;
        a.winRate = Math.round((a.wins / a.n) * 100);
      }
    });

    let topBottom: string | null = null;
    let topBottomN = 0;
    let topTop: string | null = null;
    let topTopN = 0;
    ALL_KEYS.forEach((k) => {
      if (bottomAt[k] > topBottomN) { topBottomN = bottomAt[k]; topBottom = k; }
      if (topAt[k] > topTopN) { topTopN = topAt[k]; topTop = k; }
    });

    let bestEntry: string | null = null;
    AGG_KEYS.forEach((k) => {
      const a = result[k];
      if (a.n < 2 || a.avg == null) return;
      if (k.includes("b") && (!bestEntry || a.avg < (result[bestEntry]?.avg ?? 0))) bestEntry = k;
    });

    return { result, bottomAt, topAt, topBottom, topBottomN, topTop, topTopN, bestEntry };
  }, [real]);

  if (events.length === 0) return null;

  return (
    <div>
      <table className={s.eclTable}>
        <thead>
          <tr>
            <th>Data</th>
            <th>Tip</th>
            <th style={{ textAlign: "right" }}>90z Return</th>
            <th style={{ width: 30 }}></th>
          </tr>
        </thead>
        <tbody>
          {events.map((ev, idx) => {
            const retClass = ev.bull === true ? s.eclRetBull : ev.bull === false ? s.eclRetBear : "";
            const isOpen = openIdx === idx;
            const ivs = getIntervals(ev);
            return (
              <tr key={idx} style={{ display: "contents" }}>
                <tr
                  className={cx(s.eclRow, isOpen && s.eclRowOpen)}
                  onClick={() => setOpenIdx(isOpen ? null : idx)}
                >
                  <td>
                    <span className={s.eclDate}>{ev.date}</span>
                    {ev.live === "live" && (
                      <span className={s.liveBadge} style={{ marginLeft: 6 }}>
                        <span className={s.liveDot} />LIVE
                      </span>
                    )}
                    {ev.live === "next" && (
                      <span className={s.nextBadge} style={{ marginLeft: 6 }}>URM\u0102TOR</span>
                    )}
                  </td>
                  <td><span className={s.eclType}>{ev.type}</span></td>
                  <td style={{ textAlign: "right" }}>
                    <span className={cx(s.eclRet, retClass)}>{ev.ret}</span>
                  </td>
                  <td className={s.eclChev}>{"\u25BE"}</td>
                </tr>
                <tr>
                  <td colSpan={4} style={{ padding: 0 }}>
                    <div className={cx(s.eclDetail, isOpen && s.eclDetailOpen)}>
                      {ivs && (
                        <div className={s.eclDetailInner}>
                          <div className={s.eclIntervals}>
                            {INTERVAL_SLOTS.map((slot) => {
                              const d = ivs[slot.key];
                              return (
                                <div key={slot.key} className={cx(s.eclIv, slot.isEvent && s.eclIvEvent)}>
                                  <div className={s.eclIvLabel}>{slot.label}</div>
                                  <div className={s.eclIvPrice}>{d ? fmtP(d.price) : "\u2014"}</div>
                                  {d && !slot.isEvent && (
                                    <div className={cx(
                                      s.eclIvPct,
                                      d.pct > 0.5 ? s.eclIvPctUp : d.pct < -0.5 ? s.eclIvPctDn : s.eclIvPctFlat
                                    )}>
                                      {d.pct > 0 ? "+" : ""}{d.pct.toFixed(1)}%
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Conclusion */}
      {real.length >= 3 && (
        <div className={s.eclConclusion}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text)", textTransform: "uppercase", letterSpacing: ".8px", marginBottom: 10, fontFamily: "var(--font-mono)" }}>
            Analiză Bottom/Top - {real.length} eclipse
          </div>

          {/* Bottom/Top frequency */}
          <div style={{ display: "flex", gap: 4, marginBottom: 12, flexWrap: "wrap" }}>
            {ALL_KEYS.map((k) => {
              const isBot = k === agg.topBottom;
              const isTop = k === agg.topTop;
              const bCount = agg.bottomAt[k] || 0;
              const tCount = agg.topAt[k] || 0;
              const pctVal = agg.result[k]?.avg;
              return (
                <div key={k} style={{
                  flex: 1, minWidth: 65, textAlign: "center", padding: "6px 4px", borderRadius: 6,
                  fontFamily: "var(--font-mono)", fontSize: 10,
                  border: `1px solid ${isBot ? "var(--green)" : isTop ? "var(--red)" : "var(--border)"}`,
                  background: isBot ? "rgba(11,102,35,.08)" : isTop ? "rgba(239,68,68,.08)" : "var(--bg3)",
                }}>
                  <div style={{ fontSize: 8, color: "var(--muted)", textTransform: "uppercase", marginBottom: 3 }}>{KEY_LABELS[k] || k}</div>
                  {bCount > 0 && <div style={{ color: "var(--green)", fontWeight: 600 }}>{"\u25BC"} {bCount}/{real.length}</div>}
                  {tCount > 0 && <div style={{ color: "var(--red)", fontWeight: 600 }}>{"\u25B2"} {tCount}/{real.length}</div>}
                  {bCount === 0 && tCount === 0 && <div style={{ color: "var(--dim)" }}>{"\u2014"}</div>}
                  {pctVal != null && k !== "event" && (
                    <div style={{ fontSize: 9, color: pctVal >= 0 ? "var(--green)" : "var(--red)" }}>
                      {pctVal >= 0 ? "+" : ""}{pctVal.toFixed(1)}%
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Win rate bars */}
          <div style={{ fontSize: 9, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 2, fontFamily: "var(--font-mono)" }}>Win Rate per Interval</div>
          <div style={{ fontSize: 10, color: "var(--dim)", marginBottom: 8, lineHeight: 1.5 }}>
            {"\u25B6"} Win Rate = în câte % din eclipse prețul la acel interval a fost MAI MARE decât în ziua eclipsei. Avg = media procentuală față de prețul eclipsei.
          </div>
          {AGG_KEYS.map((k) => {
            const a = agg.result[k];
            if (!a || a.n < 2 || a.winRate == null || a.avg == null) return null;
            const bc = a.avg >= 0 ? "var(--green)" : "var(--red)";
            return (
              <div key={k} className={s.eclCRow}>
                <span className={s.eclCLabel} style={{ color: bc }}>{KEY_LABELS[k]}</span>
                <div className={s.eclCBar}>
                  <div className={s.eclCFill} style={{ width: `${a.winRate}%`, background: bc }} />
                </div>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, minWidth: 40, color: bc }}>{a.winRate}%</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--muted)" }}>(avg {a.avg >= 0 ? "+" : ""}{a.avg.toFixed(1)}%)</span>
              </div>
            );
          })}

          {/* Insight text */}
          <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid var(--border)" }}>
            {agg.topBottom && (
              <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>
                <strong style={{ color: "var(--green)" }}>{"\u25BC"} Bottom probabil: </strong>
                {KEY_LABELS[agg.topBottom]} - {agg.topBottomN}/{real.length} eclipse ({Math.round((agg.topBottomN / real.length) * 100)}%) au format bottom local la acest interval.
              </p>
            )}
            {agg.topTop && (
              <p style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>
                <strong style={{ color: "var(--red)" }}>{"\u25B2"} Top probabil: </strong>
                {KEY_LABELS[agg.topTop]} - {agg.topTopN}/{real.length} eclipse ({Math.round((agg.topTopN / real.length) * 100)}%) au format top local la acest interval.
              </p>
            )}
            {agg.bestEntry && agg.result[agg.bestEntry]?.avg != null && (
              <p style={{ fontSize: 12, color: "var(--muted)" }}>
                <strong style={{ color: conceptColor }}>{"\u25B6"} Intrare optimă: </strong>
                {KEY_LABELS[agg.bestEntry]} - preț mediu {Math.abs(agg.result[agg.bestEntry].avg!).toFixed(1)}% {agg.result[agg.bestEntry].avg! < 0 ? "sub" : "peste"} prețul eclipsei.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Chart Card sub-component (Halving / Cycle / Pi)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function ChartCard({ ev, lineColor, id }: { ev: EclipseEvent; lineColor: string; id: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [drawn, setDrawn] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    return () => {
      chartRef.current?.destroy();
    };
  }, []);

  const handleClick = useCallback(() => {
    const willOpen = !isOpen;
    setIsOpen(willOpen);
    if (willOpen && !drawn && ev.prices.length > 2) {
      setDrawn(true);
      setTimeout(() => {
        if (!canvasRef.current) return;
        const ctx = canvasRef.current.getContext("2d");
        if (!ctx) return;

        const pre = ev.pre || [];
        const post = ev.prices;
        const allPrices = [...pre, ...post];
        const n = allPrices.length;
        const eventIdx = pre.length;

        const labels = allPrices.map((_, i) => {
          const rel = i - eventIdx;
          if (rel < 0) return rel + "z";
          if (rel === 0) return "\u25B6";
          return "S+" + rel;
        });

        const gradient = ctx.createLinearGradient(0, 0, 0, 220);
        gradient.addColorStop(0, lineColor + "18");
        gradient.addColorStop(0.6, lineColor + "08");
        gradient.addColorStop(1, "transparent");

        function fmtPrice(v: number | string) {
          const num = typeof v === "string" ? parseFloat(v) : v;
          if (num >= 1000) return "$" + (num / 1000).toFixed(num >= 10000 ? 0 : 1) + "K";
          return "$" + num;
        }

        const cfg: ChartConfiguration & { _eventIdx?: number } = {
          type: "line",
          data: {
            labels,
            datasets: [{
              data: allPrices,
              borderColor: lineColor,
              backgroundColor: gradient,
              borderWidth: 2.5,
              pointRadius: allPrices.map((_, j) => j === eventIdx ? 5 : j === 0 || j === n - 1 ? 3 : 0),
              pointBackgroundColor: allPrices.map((_, j) => j === eventIdx ? lineColor : j === 0 ? "#475569" : "#fff"),
              pointBorderColor: allPrices.map((_, j) => j === eventIdx ? "#fff" : "transparent"),
              pointBorderWidth: allPrices.map((_, j) => j === eventIdx ? 2 : 0),
              pointHoverRadius: 5,
              pointHoverBackgroundColor: "#fff",
              pointHoverBorderColor: lineColor,
              pointHoverBorderWidth: 2,
              fill: true,
              tension: 0.25,
            }],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: { duration: 800 },
            layout: { padding: { top: 16, right: 4, bottom: 0, left: 4 } },
            interaction: { mode: "index", intersect: false },
            scales: {
              x: {
                display: true,
                grid: { display: false },
                ticks: {
                  color: (c) => (c.tick?.label === "\u25B6" ? lineColor : "#475569"),
                  font: { family: "JetBrains Mono", size: 9 },
                  maxRotation: 0,
                  autoSkip: true,
                  maxTicksLimit: 9,
                },
              },
              y: {
                type: "logarithmic",
                display: true,
                position: "right",
                grid: { color: "rgba(30,50,80,.35)", lineWidth: 1 },
                border: { display: false },
                ticks: {
                  color: "#94a3b8",
                  font: { family: "JetBrains Mono", size: 10 },
                  padding: 8,
                  maxTicksLimit: 6,
                  callback: fmtPrice,
                },
              },
            },
            plugins: {
              legend: { display: false },
              tooltip: {
                backgroundColor: "rgba(15,23,42,.92)",
                titleColor: "#e2e8f0",
                bodyColor: "#f1f5f9",
                titleFont: { family: "JetBrains Mono", size: 10, weight: "normal" as const },
                bodyFont: { family: "JetBrains Mono", size: 12, weight: "bold" as const },
                borderColor: "rgba(100,116,139,.3)",
                borderWidth: 1,
                cornerRadius: 8,
                padding: { x: 10, y: 8 },
                displayColors: false,
                callbacks: {
                  title: (items) => {
                    const l = items[0].label;
                    return l === "\u25B6" ? "EVENIMENT" : l.startsWith("-") ? l.replace("z", " zile înainte") : "Săptămâna " + l.replace("S+", "");
                  },
                  label: (c) => fmtPrice(c.parsed.y ?? 0),
                },
              },
            },
          },
          plugins: [eventLinePlugin],
        };
        cfg._eventIdx = eventIdx;
        chartRef.current?.destroy();
        chartRef.current = new Chart(ctx, cfg);
      }, 120);
    }
  }, [isOpen, drawn, ev, lineColor]);

  const retClass = ev.bull === true ? s.chartCardRetBull : ev.bull === false ? s.chartCardRetBear : "";

  return (
    <div className={cx(s.chartCard, isOpen && s.chartCardOpen)}>
      <div className={s.chartCardHd} onClick={handleClick}>
        <span className={s.chartCardDate}>{ev.date}</span>
        <span className={s.chartCardType}>{ev.type}</span>
        {ev.live === "live" && (
          <span className={s.liveBadge}><span className={s.liveDot} />LIVE</span>
        )}
        {ev.live === "next" && <span className={s.nextBadge}>URMATOR</span>}
        <span className={cx(s.chartCardRet, retClass)}>{ev.ret}</span>
        <span className={s.chartCardChevron}>{"\u25BE"}</span>
      </div>
      <div className={s.chartCardBody}>
        <div className={s.chartCanvasWrap}>
          <canvas ref={canvasRef} id={id} />
        </div>
      </div>
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Concept Group (Eclipse / Halving / Cycle / Pi)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function MetricBar({ events }: { events: EclipseEvent[] }) {
  const real = events.filter((e) => e.prices.length > 2);
  const bullish = real.filter((e) => e.bull === true);
  const avgRet = real.length
    ? real.reduce((sum, e) => { const p = parseFloat(e.ret); return sum + (isNaN(p) ? 0 : p); }, 0) / real.length
    : 0;

  return (
    <div className={s.metricBar}>
      <div className={s.metricPill}><span className={s.metricVal}>{real.length}</span> evenimente</div>
      <div className={s.metricPill}>
        <span className={s.metricVal} style={{ color: bullish.length / real.length >= 0.6 ? "var(--green)" : "var(--red)" }}>
          {Math.round((bullish.length / real.length) * 100)}%
        </span> bullish
      </div>
      <div className={s.metricPill}>
        <span className={s.metricVal} style={{ color: avgRet >= 0 ? "var(--green)" : "var(--red)" }}>
          {avgRet >= 0 ? "+" : ""}{avgRet.toFixed(0)}%
        </span> return mediu
      </div>
    </div>
  );
}

function ConceptGroup({ conceptKey, data }: { conceptKey: string; data: ConceptData }) {
  const sortedEvents = useMemo(() => {
    const evs = [...data.events];
    if (conceptKey === "solar" || conceptKey === "lunar") {
      evs.sort((a, b) => b.date.localeCompare(a.date));
    }
    return evs;
  }, [data.events, conceptKey]);

  const isEclipse = conceptKey === "solar" || conceptKey === "lunar";

  return (
    <div className={s.conceptGroup}>
      <div className={s.conceptHeader}>
        {conceptKey === "solar" && <span className={cx(s.astroIcon, s.solarEclipse)} style={{ width: 24, height: 24 }} />}
        {conceptKey === "lunar" && <span className={cx(s.astroIcon, s.lunarEclipse)} style={{ width: 24, height: 24 }} />}
        {!isEclipse && <div className={s.conceptDot} style={{ background: data.color }} />}
        <div className={s.conceptName}>{data.label}</div>
        <div className={s.conceptSub}>
          {conceptKey === "solar" ? "-7z pre-eclipsă · 90z" :
           conceptKey === "lunar" ? "±3z · 90z" :
           conceptKey === "halving" ? "performanță 1 an post-halving" :
           conceptKey === "cycle" ? "bottom-uri ciclice intermediare" :
           "top indicator istoric"}
        </div>
      </div>
      <MetricBar events={data.events} />
      {isEclipse ? (
        <EclipseCompactTable events={sortedEvents} color={data.color} />
      ) : (
        sortedEvents.map((ev, idx) => (
          <ChartCard key={idx} ev={ev} lineColor={data.color} id={`cc-${conceptKey}-${idx}`} />
        ))
      )}
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Gann Table
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function GannTable({ anchorDate }: { anchorDate: string }) {
  const now = useMemo(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; }, []);
  const anchor = useMemo(() => { const d = new Date(anchorDate); d.setHours(0, 0, 0, 0); return d; }, [anchorDate]);

  return (
    <div style={{ overflowX: "auto" }}>
      <table className={s.methodTable}>
        <thead>
          <tr>
            <th>Interval</th>
            <th>Grad</th>
            <th>Data</th>
            <th>Status</th>
            <th style={{ fontSize: 9 }}>Ce reprezintă</th>
          </tr>
        </thead>
        <tbody>
          {GANN_INTERVALS.map((g) => {
            const target = new Date(anchor.getTime() + g.days * 86400000);
            const daysFromNow = diffDays(now, target);
            const isPast = daysFromNow < -3;
            const isNear = Math.abs(daysFromNow) <= 7;
            const isFuture = daysFromNow > 3;
            const isMajor = g.cat === "Major";
            const statusText = isPast ? "Trecut" : isNear ? "ACUM" : `în ${daysFromNow}z`;
            const statusColor = isNear ? "var(--solar)" : isPast ? "var(--dim)" : "var(--green)";
            const rowBg = isNear ? "rgba(245,158,11,.08)" : isMajor && isFuture ? "rgba(11,102,35,.03)" : "transparent";
            const labelColor = isMajor ? "var(--text)" : "var(--muted)";

            return (
              <tr key={g.days} style={{ background: rowBg }}>
                <td style={{ color: labelColor, fontWeight: isMajor ? 600 : 400 }} className={s.mono}>
                  {g.label}z{isMajor ? " \u2605" : ""}
                </td>
                <td className={cx(s.muted, s.mono)} style={{ fontSize: 11 }}>{g.deg}</td>
                <td className={s.mono} style={{ fontSize: 12, color: "var(--text)" }}>{fmtDate(target)}</td>
                <td style={{ color: statusColor, fontSize: 11, fontFamily: "var(--font-mono)", fontWeight: isNear ? 700 : 400 }}>
                  {statusText}
                </td>
                <td className={s.muted} style={{ fontSize: 10 }}>{g.desc}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Collapsible section wrapper
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function Section({
  id,
  title,
  subtitle,
  children,
  icon,
}: {
  id: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
}) {
  const [open, setOpen] = useState(true);
  const nextEvent = NEXT_EVENTS.find((ne) => ne.id === id);
  const hasInfo = Boolean(SECTION_INFO[id]);

  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setOpen(false);
    }
  }, []);

  return (
    <>
      <div className={cx(s.sectionTitle, s.reveal, s.visible)} id={id}>
        {icon}
        {title}
        {subtitle && <span className={s.stSub}>- {subtitle}</span>}
        {hasInfo && <InfoTooltip id={id} label={title} />}
        {nextEvent && <span className={s.nextBadgeInline}>{nextEvent.text}</span>}
        <button className={s.sectionToggle} onClick={() => setOpen(!open)} title="Ascunde/arată secțiunea">
          {open ? "\u2212" : "+"}
        </button>
      </div>
      <div className={cx(s.sectionCollapsible, !open && s.sectionCollapsed)}>
        {children}
      </div>
    </>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Fibonacci Timeline with today marker
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function FibTimeline() {
  const today = useMemo(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; }, []);

  let insertAfterIdx = -1;
  for (let i = 0; i < FIB_DATES.length - 1; i++) {
    if (today >= FIB_DATES[i] && today < FIB_DATES[i + 1]) {
      insertAfterIdx = i;
      break;
    }
  }

  const ds = today.toLocaleDateString("ro-RO", { day: "2-digit", month: "short", year: "numeric" });

  return (
    <div className={s.tl}>
      {FIB_TIMELINE.map((item, idx) => (
        <div key={idx}>
          <div className={s.tlItem}>
            <div className={cx(
              s.tlDot,
              item.hit === true ? s.tlDotHit : item.hit === false ? s.tlDotMiss : item.future ? s.tlDotFuture : ""
            )} />
            <div className={s.tlDate}>{item.date} · nivel {item.level}</div>
            <div className={s.tlLabel} style={{
              color: item.hit === true ? "var(--fib)" : item.special ? "var(--solar)" : item.future ? "var(--solar)" : "var(--muted)"
            }}>
              {item.label}
            </div>
          </div>
          {idx === insertAfterIdx && (
            <div className={s.tlToday}>
              <div className={s.tlTodayDot} />
              <div className={s.tlTodayLabel}>{"\u25B6"} AZI - {ds}</div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Score Widget
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function ScoreWidget() {
  const sc = useMemo(() => calcScore(), []);
  const today = new Date();
  const ds = today.toLocaleDateString("ro-RO", { day: "2-digit", month: "long", year: "numeric" });

  let status: string;
  let scClass: string;
  if (sc.total >= 4 && sc.hasPrimary) { status = "\u26A1 FEREASTR\u0102 ACTIV\u0102"; scClass = s.swActive; }
  else if (sc.total >= 3) { status = "\uD83D\uDC41 WATCH"; scClass = s.swWatch; }
  else { status = "\u25CF INACTIV"; scClass = s.swInactive; }

  const scoreColor = sc.total >= 4 ? "var(--green)" : sc.total >= 3 ? "var(--solar)" : "var(--muted)";
  const pct = Math.min(100, (sc.total / 4) * 100);
  const isGlowing = sc.total >= 4 && sc.hasPrimary;

  return (
    <div className={cx(s.scoreWidget, isGlowing && s.glowActive)}>
      <div>
        <div className={s.swDate}>{ds}</div>
        <div className={s.swScore} style={{ color: scoreColor }}>{sc.total}</div>
        <div className={s.swLabel}>puncte active</div>
        <div style={{ marginTop: 10 }}><span className={cx(s.swStatus, scClass)}>{status}</span></div>
      </div>
      <div style={{ width: 1, background: "var(--border)", alignSelf: "stretch" }} />
      <div className={s.swMethods}>
        <div style={{ fontSize: 10, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".8px", marginBottom: 8, fontFamily: "var(--font-mono)" }}>
          Metode Active
        </div>
        {sc.active.length > 0 ? (
          sc.active.map((x, i) => (
            <div key={i} className={s.swMethodItem}>
              <span className={s.swDotActive} />
              <span style={{ color: "var(--text)" }}>{x.name}</span>
              <span className={s.mono} style={{ color: x.type === "PRIMAR" ? "var(--solar)" : "var(--muted)", fontSize: 11, marginLeft: 4 }}>
                +{x.pts}pt
              </span>
              {x.detail && <span style={{ color: "var(--dim)", fontSize: 10 }}>({x.detail})</span>}
            </div>
          ))
        ) : (
          <div className={s.muted} style={{ fontSize: 12, padding: "4px 0" }}>Nicio metodă activă momentan</div>
        )}
        {sc.upcoming.length > 0 && (
          <div className={s.swNext}>
            <span className={s.mono} style={{ fontSize: 10, color: "var(--solar)" }}>URMĂTOR →</span>{" "}
            {sc.upcoming.slice(0, 2).map((u, i) => (
              <span key={i}>
                {i > 0 && " · "}
                <strong style={{ color: "var(--text)" }}>{u.name}</strong>{" "}
                <span style={{ color: "var(--muted)" }}>în {u.days} zile</span>
              </span>
            ))}
          </div>
        )}
      </div>
      <div className={s.swProgressWrap}>
        <div style={{ fontSize: 10, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".8px", marginBottom: 10, fontFamily: "var(--font-mono)" }}>
          Progres spre fereastră
        </div>
        <div style={{ background: "rgba(255,255,255,.05)", borderRadius: 6, height: 10, overflow: "hidden" }}>
          <div style={{ width: `${pct}%`, height: "100%", background: scoreColor, borderRadius: 6, transition: "width 1.2s ease" }} />
        </div>
        <div style={{ marginTop: 8, display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--dim)", fontFamily: "var(--font-mono)" }}>
          <span>{sc.total} / 4 minim</span><span style={{ color: "var(--border2)" }}>max ~11</span>
        </div>
        <div style={{ marginTop: 12, fontSize: 10, color: "var(--dim)", lineHeight: 1.6 }}>
          Necesită: <strong style={{ color: "var(--text)" }}>4+ pct + 1 metodă PRIMARĂ</strong>
        </div>
      </div>
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Gann Calculator
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function GannCalculator() {
  const [date, setDate] = useState("");
  const [type, setType] = useState("high");
  const [calcDate, setCalcDate] = useState<string | null>(null);

  return (
    <div className={s.card}>
      <h2 className={s.cardH2}><span className={s.dot} style={{ background: "var(--cycle)" }} />Calculator Gann - Introdu propriul pivot</h2>
      <p className={cx(s.small, s.muted)} style={{ marginBottom: 12 }}>
        Selectează o dată și tipul pivotului. Focusează pe <strong style={{ color: "var(--green)" }}>+45z, +49z, +60z și +144z</strong> - intervalele cu edge real (±5z). Tratează ca <strong style={{ color: "var(--text)" }}>zonă de alertă ±1 săptămână</strong>.
      </p>
      <div style={{ display: "flex", gap: 12, alignItems: "end", flexWrap: "wrap", marginBottom: 16 }}>
        <div>
          <label style={{ fontSize: 10, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".5px", display: "block", marginBottom: 4, fontFamily: "var(--font-mono)" }}>Data Pivot</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={s.gannInput} />
        </div>
        <div>
          <label style={{ fontSize: 10, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".5px", display: "block", marginBottom: 4, fontFamily: "var(--font-mono)" }}>Tip</label>
          <select value={type} onChange={(e) => setType(e.target.value)} className={s.gannInput}>
            <option value="high">HIGH (Top)</option>
            <option value="low">LOW (Bottom)</option>
          </select>
        </div>
        <button className={s.gannButton} onClick={() => { if (date) setCalcDate(date); }}>CALCULEAZĂ</button>
      </div>
      {calcDate && <GannTable anchorDate={calcDate} />}
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Subnav with active tracking
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function Subnav() {
  const [activeId, setActiveId] = useState("");
  const navRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setActiveId(e.target.id);
            // Scroll subnav link into view
            const link = navRef.current?.querySelector(`[href="#${e.target.id}"]`);
            if (link) link.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
          }
        });
      },
      { rootMargin: "-20% 0px -70% 0px" }
    );

    // Small delay to ensure sections are rendered
    const timer = setTimeout(() => {
      document.querySelectorAll(`.${s.sectionTitle}[id]`).forEach((el) => observer.observe(el));
    }, 500);

    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, []);

  return (
    <nav className={s.subnav} ref={navRef}>
      {SUBNAV_LINKS.map((link) => (
        <a
          key={link.href}
          className={cx(s.subnavLink, activeId === link.href.slice(1) && s.subnavLinkActive)}
          href={link.href}
        >
          {link.label}
        </a>
      ))}
    </nav>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Dynamic Header Badges
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function HeaderBadges() {
  const sc = useMemo(() => calcScore(), []);
  const now = new Date();
  const months = ['Ianuarie', 'Februarie', 'Martie', 'Aprilie', 'Mai', 'Iunie', 'Iulie', 'August', 'Septembrie', 'Octombrie', 'Noiembrie', 'Decembrie'];
  const dateBadge = months[now.getMonth()] + " " + now.getFullYear();

  let pivotText = "Nicio fereastră activă";
  let pivotColor = "var(--accent)";
  let pivotBorder = "rgba(11,102,35,.15)";

  if (sc.upcoming.length > 0) {
    const u = sc.upcoming[0];
    const pivotDate = new Date(now.getTime() + u.days * 86400000);
    pivotText = `Next Pivot: ${u.name} - ${fmtDate(pivotDate)} (${u.days} zile)`;
    pivotColor = "#F59E0B";
    pivotBorder = "rgba(245,158,11,.3)";
  } else if (sc.active.length > 0) {
    pivotText = `\u26A1 Pivot activ: ${sc.active[0].name}`;
    pivotColor = "#10B981";
    pivotBorder = "rgba(16,185,129,.3)";
  }

  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
      <span style={{
        background: "rgba(11,102,35,.06)", border: "1px solid rgba(11,102,35,.15)",
        borderRadius: 20, padding: "4px 12px", fontSize: 11, color: "var(--accent)", fontFamily: "var(--font-mono)"
      }}>{dateBadge}</span>
      <span style={{
        background: "rgba(11,102,35,.06)", border: `1px solid ${pivotBorder}`,
        borderRadius: 20, padding: "4px 12px", fontSize: 11, color: pivotColor, fontFamily: "var(--font-mono)"
      }}>{pivotText}</span>
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MAIN COMPONENT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export default function PivotsDashboard() {
  // Register Chart.js
  useEffect(() => {
    Chart.register(...registerables);
    Chart.register(eventLinePlugin);
  }, []);

  // Scroll reveal observer
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add(s.visible);
            obs.unobserve(e.target);
          }
        });
      },
      { threshold: 0.08 }
    );
    document.querySelectorAll(`.${s.reveal}`).forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  return (
    <div className={s.root}>
      {/* Subnav */}
      <Subnav />

      <div className={s.container}>
        {/* Header badges */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
          <HeaderBadges />
        </div>

        {/* TL;DR Verdict for noobs */}
        <VerdictHero />

        {/* Philosophy */}
        <div className={cx(s.philosophy, s.reveal)}>
          <p><strong>Filozofie:</strong> Elite-Pivots NU este un semnal de tranzacționare. Este un <strong>sistem de alerte bazat pe timp</strong> - identifică ferestre în care BTC are mai mari șanse să formeze un pivot semnificativ. Când o fereastră se activează, verifici singur tehnicele pentru a confirma direcția. Indicatorul îți spune <em>când să fii atent</em>, nu ce să faci.</p>
          <p style={{ marginTop: 8, color: "#94a3b8" }}>O fereastră necesită <strong>scor ≥ 4 + cel puțin o metodă PRIMARĂ</strong>. Metodele secundare singure nu pot declanșa un semnal.</p>
        </div>

        {/* Stats */}
        <div className={cx(s.grid4, s.mb20, s.reveal)}>
          <div className={s.stat}><div className={s.statVal} style={{ color: "var(--solar)" }}>5</div><div className={s.statLbl}>Metode Primare</div><div className={s.statSub}>Eclipse, Halving, Fibonacci, Pi Cycle</div></div>
          <div className={s.stat}><div className={s.statVal} style={{ color: "var(--cycle)" }}>6</div><div className={s.statLbl}>Metode Secundare</div><div className={s.statSub}>Ciclu C, Lună, Gann, Ian, DOM, Electoral</div></div>
          <div className={s.stat}><div className={s.statVal} style={{ color: "var(--fib)" }}>4+</div><div className={s.statLbl}>Scor Minim Activare</div><div className={s.statSub}>Optimizat prin backtest</div></div>
          <div className={s.stat}><div className={s.statVal} style={{ color: "var(--halving)" }}>3144</div><div className={s.statLbl}>Bare Analizate</div><div className={s.statSub}>DOM: 2017–2026 · Eclipse/Cicluri: 2012–2026</div></div>
        </div>

        {/* Score Widget */}
        <div className={s.reveal}>
          <ScoreWidget />
        </div>

        {/* ── ON-CHAIN ── */}
        <Section id="s-onchain" title="Indicatori On-Chain" subtitle="6 metrici fact-checked din blockchain">
          <OnChainSection />
        </Section>

        {/* ── CYCLES ── */}
        <Section id="s-cycles" title="Teoria Ciclurilor BTC">
          <div className={cx(s.reveal, s.mb20)} style={{ display: "grid", gridTemplateColumns: "3fr 2fr", gap: 20 }}>
            {/* Pattern 1064/364 */}
            <div className={s.card}>
              <h2 className={s.cardH2}><span className={s.dot} style={{ background: "var(--cycle)" }} />Pattern 1064 / 364 Zile <span style={{ color: "var(--green)", fontSize: 11, fontWeight: 500, textTransform: "none", letterSpacing: 0 }}>✓ Confirmat 3/3 cicluri mature</span></h2>
              <p className={cx(s.small, s.muted)} style={{ marginBottom: 14 }}>BTC &quot;respiră&quot; cu un ritm consistent: <strong style={{ color: "var(--green)" }}>~1064 zile urcare</strong> (bottom → top), urmate de <strong style={{ color: "var(--red)" }}>~364 zile corecție</strong> (top → bottom).</p>
              <table className={s.methodTable}>
                <thead><tr><th>Ciclu</th><th>Bottom → Top</th><th>Zile ↑</th><th>Top → Bottom</th><th>Zile ↓</th></tr></thead>
                <tbody>
                  <tr style={{ background: "rgba(100,116,139,.04)" }}><td className={s.muted}>Ciclu 0</td><td className={cx(s.muted, s.small)}>18 Nov 2011 → 30 Nov 2013</td><td style={{ color: "var(--muted)" }} className={s.mono}>742</td><td className={cx(s.muted, s.small)}>30 Nov 2013 → 14 Ian 2015</td><td style={{ color: "var(--muted)" }} className={s.mono}>~410</td></tr>
                  <tr><td>Ciclu 1</td><td className={cx(s.muted, s.small)}>14 Ian 2015 → 17 Dec 2017</td><td style={{ color: "var(--green)" }} className={s.mono}><strong>1067</strong></td><td className={cx(s.muted, s.small)}>17 Dec 2017 → 15 Dec 2018</td><td style={{ color: "var(--red)" }} className={s.mono}>~364</td></tr>
                  <tr><td>Ciclu 2</td><td className={cx(s.muted, s.small)}>15 Dec 2018 → 10 Nov 2021</td><td style={{ color: "var(--green)" }} className={s.mono}><strong>1059</strong></td><td className={cx(s.muted, s.small)}>10 Nov 2021 → 9 Nov 2022</td><td style={{ color: "var(--red)" }} className={s.mono}>~364</td></tr>
                  <tr style={{ background: "rgba(245,158,11,.04)" }}><td style={{ color: "var(--solar)" }}>Ciclu 3</td><td className={cx(s.muted, s.small)}>9 Nov 2022 → 6 Oct 2025</td><td style={{ color: "var(--green)" }} className={s.mono}><strong>1062 ✓</strong></td><td className={cx(s.muted, s.small)}>6 Oct 2025 → ?</td><td style={{ color: "var(--orange)" }} className={s.mono}>~364 (în curs)</td></tr>
                </tbody>
              </table>
              <div className={s.grid2} style={{ marginTop: 14, gap: 10 }}>
                <div className={s.stat}><div className={s.statVal} style={{ color: "var(--green)" }}>1062</div><div className={s.statLbl}>Medie zile Bottom→Top</div><div className={s.statSub}>±5 zile pe cicluri 1–3 (ciclu 0: 742d - piață imatură)</div></div>
                <div className={s.stat}><div className={s.statVal} style={{ color: "var(--red)" }}>364</div><div className={s.statLbl}>Medie zile Top→Bottom</div><div className={s.statSub}>Proiecție bottom: ~5 Oct 2026</div></div>
              </div>
              <div className={cx(s.infoBox, s.infoBoxRed)} style={{ marginTop: 12 }}><strong style={{ color: "var(--red)" }}>Proiecție bottom ciclu 3:</strong> <span className={s.muted}>6 Oct 2025 + 364 zile = <strong style={{ color: "var(--text)" }}>~5 Oct 2026</strong>. Pe baza drawdown-urilor descrescătoare (-87%→-84%→-78%→ în curs), proiecție: <strong style={{ color: "var(--text)" }}>-52% la -57% → zona $54–$60K</strong>.</span></div>
            </div>

            {/* Quarterly Performance */}
            <div className={s.card} style={{ paddingBottom: 12 }}>
              <h2 className={s.cardH2}><span className={s.dot} style={{ background: "var(--halving)" }} />Performanță pe Trimestre (2013–2025)</h2>
              <p className={cx(s.small, s.muted)} style={{ marginBottom: 14 }}>Sursa: CoinGlass. <strong style={{ color: "var(--text)" }}>Mediana</strong> e mai relevantă decât media - nu e distorsionată de anii extremi (2013, 2019).</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10 }}>
                {[
                  { q: "Q4", sub: "Oct–Dec", val: "+47.7%", color: "var(--solar)", bg: "rgba(245,158,11,.06)", border: "rgba(245,158,11,.25)", valColor: "var(--green)", desc: "Cel mai puternic. Toate ATH-urile: Dec 2017, Nov 2021, Oct 2025" },
                  { q: "Q2", sub: "Apr–Iun", val: "+7.6%", color: "var(--fib)", bg: "rgba(11,102,35,.06)", border: "rgba(11,102,35,.2)", valColor: "var(--green)", desc: "Post-halving rally. Al doilea cel mai consistent trimestru" },
                  { q: "Q1", sub: "Ian–Mar", val: "-2.3%", color: "var(--text)", bg: "rgba(100,116,139,.06)", border: "rgba(100,116,139,.2)", valColor: "var(--red)", desc: "Mixt - puternic in bull, slab in bear. Q1 2026: -21%" },
                  { q: "Q3", sub: "Iul–Sep", val: "+1.0%", color: "var(--red)", bg: "rgba(239,68,68,.05)", border: "rgba(239,68,68,.2)", valColor: "var(--orange)", desc: "Cel mai slab. Bottom-uri posibile dar fara directie clara" },
                ].map((item) => (
                  <div key={item.q} style={{ background: item.bg, border: `2px solid ${item.border}`, borderRadius: 16, padding: "12px 14px", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center" }}>
                    <div style={{ fontFamily: "var(--font-head)", fontSize: 15, fontWeight: 700, color: item.color }}>{item.q}</div>
                    <div style={{ fontSize: 9, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".5px", margin: "2px 0 6px" }}>{item.sub}</div>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: 22, fontWeight: 700, color: item.valColor, lineHeight: 1 }}>{item.val}</div>
                    <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 8, lineHeight: 1.4 }}>{item.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Elections + ATH Break */}
          <div className={cx(s.grid2, s.reveal, s.mb20)}>
            <div className={s.card}>
              <h2 className={s.cardH2}><span className={s.dot} style={{ background: "var(--solar)" }} />Corelație Alegeri SUA - ATH Post-Alegeri</h2>
              <p className={cx(s.small, s.muted)} style={{ marginBottom: 14 }}>BTC formează ATH la <strong style={{ color: "var(--text)" }}>~11–13 luni</strong> după alegerile prezidențiale americane. Distanța se comprimă cu fiecare ciclu.</p>
              <table className={s.methodTable}>
                <thead><tr><th>Alegeri</th><th>Dată</th><th>ATH ciclu</th><th>Zile după</th></tr></thead>
                <tbody>
                  <tr><td>2012 (Obama)</td><td className={cx(s.muted, s.mono)}>6 Nov 2012</td><td className={s.muted}>Nov 2013 ~$1,150</td><td style={{ color: "var(--orange)" }} className={s.mono}>~365</td></tr>
                  <tr><td>2016 (Trump)</td><td className={cx(s.muted, s.mono)}>8 Nov 2016</td><td className={s.muted}>17 Dec 2017 $19,799</td><td style={{ color: "var(--orange)" }} className={s.mono}>~404</td></tr>
                  <tr><td>2020 (Biden)</td><td className={cx(s.muted, s.mono)}>3 Nov 2020</td><td className={s.muted}>10 Nov 2021 $69,000</td><td style={{ color: "var(--orange)" }} className={s.mono}>~372</td></tr>
                  <tr style={{ background: "rgba(245,158,11,.04)" }}><td style={{ color: "var(--solar)" }}>2024 (Trump)</td><td className={cx(s.muted, s.mono)}>5 Nov 2024</td><td className={s.muted}>6 Oct 2025 $126,000</td><td style={{ color: "var(--green)" }} className={s.mono}>~335</td></tr>
                </tbody>
              </table>
              <div className={cx(s.infoBox, s.infoBoxGreen)} style={{ marginTop: 12 }}><strong style={{ color: "var(--green)" }}>Pattern: 4/4 confirmat.</strong> <span className={s.muted}>ATH vine la <strong style={{ color: "var(--text)" }}>335–404 zile</strong> după alegeri (~12 luni). Distanța se <strong style={{ color: "var(--text)" }}>comprimă</strong>: 404→372→335. Următor: Alegeri Nov 2028 → ATH proiectat ~Oct 2029.</span></div>
            </div>
            <div className={s.card}>
              <h2 className={s.cardH2}><span className={s.dot} style={{ background: "var(--fib)" }} />Spargere ATH Vechi → Top-ul de Ciclu</h2>
              <p className={cx(s.small, s.muted)} style={{ marginBottom: 14 }}>Câte zile de la spargerea ATH-ului anterior până la top-ul de ciclu?</p>
              <table className={s.methodTable}>
                <thead><tr><th>Ciclu</th><th>Spargere ATH vechi</th><th>Top ciclu</th><th>Zile</th></tr></thead>
                <tbody>
                  <tr><td>2017</td><td className={cx(s.muted, s.small)}>~Ian 2017 ($1,150)</td><td className={s.muted}>17 Dec 2017</td><td style={{ color: "var(--green)" }} className={s.mono}>~340</td></tr>
                  <tr><td>2021</td><td className={cx(s.muted, s.small)}>30 Nov 2020 ($19,666)</td><td className={s.muted}>10 Nov 2021</td><td style={{ color: "var(--green)" }} className={s.mono}>~345</td></tr>
                  <tr style={{ background: "rgba(245,158,11,.04)" }}><td style={{ color: "var(--solar)" }}>2025</td><td className={cx(s.muted, s.small)}>14 Mar 2024 ($73,800) ← pre-halving!</td><td className={s.muted}>6 Oct 2025</td><td style={{ color: "var(--orange)" }} className={s.mono}>~571 ⚠️</td></tr>
                </tbody>
              </table>
              <div className={s.infoBox} style={{ marginTop: 12 }}><strong style={{ color: "var(--fib)" }}>Pattern cicluri 2 și 3:</strong> <span className={s.muted}>Spargere ATH → <strong style={{ color: "var(--text)" }}>~340–345 zile</strong> până la top. Ciclul 4 este excepție - a spart ATH pre-halving pentru prima dată (ETF-uri aprobate ian 2024).</span></div>
              <div className={s.infoBox} style={{ marginTop: 10 }}><strong style={{ color: "var(--solar)" }}>Proiecție Ciclu 5:</strong> <span className={s.muted}>Dacă BTC sparge $126k în 2027, adaugă ~345 zile → top estimat <strong style={{ color: "var(--text)" }}>2027–2028</strong>. Dacă sparge pre-halving, top-ul vine mai târziu.</span></div>
            </div>
          </div>

          {/* Halving History */}
          <div className={s.card}>
            <h2 className={s.cardH2}><span className={s.dot} style={{ background: "var(--halving)" }} />Top-uri după Halving - Istoric</h2>
            <table className={s.methodTable}>
              <thead><tr><th>Halving</th><th>Dată</th><th>Zile până la ATH</th><th>Luni</th><th>ATH</th></tr></thead>
              <tbody>
                <tr style={{ background: "rgba(100,116,139,.04)" }}><td className={s.muted}>Halving 1</td><td className={s.muted}>2012-11-28</td><td className={s.mono}>365</td><td style={{ color: "var(--muted)" }}>12 luni</td><td className={s.muted}>$1,150 <span className={cx(s.muted, s.small)}>(Nov 2013)</span></td></tr>
                <tr><td>Halving 2</td><td className={s.muted}>2016-07-09</td><td className={s.mono}>526</td><td style={{ color: "var(--green)" }}>17.5 luni</td><td>$19,799</td></tr>
                <tr><td>Halving 3</td><td className={s.muted}>2020-05-11</td><td className={s.mono}>548</td><td style={{ color: "var(--green)" }}>18.3 luni</td><td>$69,000</td></tr>
                <tr style={{ background: "rgba(245,158,11,.04)" }}><td style={{ color: "var(--halving)" }}>Halving 4</td><td className={s.muted}>2024-04-19</td><td className={s.mono} style={{ color: "var(--green)" }}>535</td><td style={{ color: "var(--green)" }}>17.5 luni ✓</td><td style={{ color: "var(--solar)" }}>$126,000 <span className={cx(s.muted, s.small)}>(6 Oct 2025)</span></td></tr>
              </tbody>
            </table>
            <p className={cx(s.small, s.muted)} style={{ marginTop: 8 }}>H1 a fost mai rapid (12 luni) - piață imatură, lichiditate mică. De la H2, pattern-ul se stabilizează la <strong style={{ color: "var(--green)" }}>17–18 luni</strong> consistent.</p>
            <h2 className={s.cardH2} style={{ marginTop: 20 }}><span className={s.dot} style={{ background: "var(--cycle)" }} />Acuratețe Faze Ciclu Halving 4</h2>
            <table className={s.methodTable}>
              <thead><tr><th>Fază</th><th>Zile</th><th>Acuratețe indicator</th></tr></thead>
              <tbody>
                <tr><td style={{ color: "var(--green)" }}>Acumulare</td><td className={cx(s.muted, s.mono)}>0–108</td><td style={{ color: "var(--green)" }}>62%</td></tr>
                <tr><td style={{ color: "var(--green)" }}>Impuls Bullish</td><td className={cx(s.muted, s.mono)}>108–276</td><td style={{ color: "var(--orange)" }}>50%</td></tr>
                <tr><td style={{ color: "var(--green)" }}>IC Pullback</td><td className={cx(s.muted, s.mono)}>276–353</td><td style={{ color: "var(--green)" }}>62%</td></tr>
                <tr><td style={{ color: "var(--orange)" }}>ATH Push</td><td className={cx(s.muted, s.mono)}>353–535</td><td style={{ color: "var(--orange)" }}>67%</td></tr>
                <tr><td style={{ color: "var(--red)" }}>Post-ATH</td><td className={cx(s.muted, s.mono)}>535+</td><td style={{ color: "var(--red)" }}>43%</td></tr>
              </tbody>
            </table>
            <p className={cx(s.small, s.muted)} style={{ marginTop: 8 }}>Curent: <strong style={{ color: "var(--red)" }}>Post-ATH (ziua ~707, din 6 Oct 2025)</strong> - acuratețe 43%, folosește cu precauție suplimentară.</p>
          </div>
        </Section>

        {/* ── BEAR MARKET ── */}
        <Section id="s-bear" title="Analiză Bear Market - Unde Suntem?">
          <p className={cx(s.small, s.muted, s.mb20, s.reveal)}>7 indicatori independenți analizați în Martie 2026. Fiecare derivat independent - nicio metodă nu e construită pe alta.</p>
          <div className={cx(s.grid3, s.reveal, s.mb20)}>
            <div className={s.card}>
              <h2 className={s.cardH2}><span className={s.dot} style={{ background: "var(--red)" }} />Drawdown-uri Descrescătoare</h2>
              <p className={cx(s.small, s.muted)} style={{ marginBottom: 14 }}>Fiecare ciclu bear a fost mai puțin sever decât precedentul. Piața maturizează.</p>
              <table className={s.methodTable}>
                <thead><tr><th>Ciclu Bear</th><th>Drawdown ATH</th><th>Bottom</th></tr></thead>
                <tbody>
                  <tr><td className={s.muted}>2014</td><td style={{ color: "var(--red)" }} className={s.mono}>-86.8%</td><td className={cx(s.muted, s.small)}>$152</td></tr>
                  <tr><td className={s.muted}>2018</td><td style={{ color: "var(--red)" }} className={s.mono}>-83.8%</td><td className={cx(s.muted, s.small)}>$3,200</td></tr>
                  <tr><td className={s.muted}>2022</td><td style={{ color: "var(--orange)" }} className={s.mono}>-77.6%</td><td className={cx(s.muted, s.small)}>$15,500</td></tr>
                  <tr style={{ background: "rgba(245,158,11,.04)" }}><td style={{ color: "var(--solar)" }}>2026 (proj.)</td><td style={{ color: "var(--green)" }} className={s.mono}>-52% la -57%</td><td style={{ color: "var(--solar)" }} className={s.small}><strong>$54K–$60K</strong></td></tr>
                </tbody>
              </table>
              <div className={cx(s.infoBox, s.infoBoxGreen)} style={{ marginTop: 12 }}>Fiecare crash: mai mic cu ~6–7pp. La $126K ATH: -52% = $60.5K · -57% = $54.2K</div>
            </div>
            <div className={s.card}>
              <h2 className={s.cardH2}><span className={s.dot} style={{ background: "var(--fib)" }} />RSI Săptămânal &lt; 30 - 5/5</h2>
              <p className={cx(s.small, s.muted)} style={{ marginBottom: 14 }}>De fiecare dată când RSI weekly a scăzut sub 30, a urmat un rally masiv. Niciodată nu a eșuat.</p>
              <table className={s.methodTable}>
                <thead><tr><th>An</th><th>RSI min</th><th>Ce a urmat</th></tr></thead>
                <tbody>
                  <tr><td className={s.muted}>2012</td><td className={s.mono} style={{ color: "var(--red)" }}>&lt;30</td><td className={cx(s.small, s.muted)}>Bull run 2013 → $1,150</td></tr>
                  <tr><td className={s.muted}>2015</td><td className={s.mono} style={{ color: "var(--red)" }}>&lt;30</td><td className={cx(s.small, s.muted)}>Bottom exact bear → $152</td></tr>
                  <tr><td className={s.muted}>Mar 2020</td><td className={s.mono} style={{ color: "var(--red)" }}>29.5</td><td className={cx(s.small, s.muted)}>+1,002% în 12 luni</td></tr>
                  <tr><td className={s.muted}>Iun 2022</td><td className={s.mono} style={{ color: "var(--red)" }}>25.8</td><td className={cx(s.small, s.muted)}>+59% în 12 luni (FTX retest -15%)</td></tr>
                  <tr style={{ background: "rgba(11,102,35,.04)" }}><td style={{ color: "var(--green)" }}>Feb 2026</td><td className={s.mono} style={{ color: "var(--red)" }}>26.8</td><td className={s.small} style={{ color: "var(--solar)" }}>??? - în curs</td></tr>
                </tbody>
              </table>
              <div className={cx(s.infoBox, s.infoBoxGreen)} style={{ marginTop: 12 }}><strong style={{ color: "var(--fib)" }}>Hit rate: 5/5 - 100%</strong> în toată istoria BTC. RSI a revenit la ~31 după low-ul de 26.8 din Feb 2026.</div>
            </div>
            <div className={s.card}>
              <h2 className={s.cardH2}><span className={s.dot} style={{ background: "var(--solar)" }} />Raport Aur / BTC (XAU/BTC)</h2>
              <p className={cx(s.small, s.muted)} style={{ marginBottom: 14 }}>Aurul bate BTC în bear markets. Când raportul XAU/BTC depășește +70–80% față de minim, BTC se apropie de bottom.</p>
              <table className={s.methodTable}>
                <thead><tr><th>Ciclu</th><th>Rebound XAU/BTC</th><th>Semnal</th></tr></thead>
                <tbody>
                  <tr><td className={s.muted}>2018</td><td className={s.mono} style={{ color: "var(--orange)" }}>masiv</td><td className={cx(s.small, s.muted)}>Bottom BTC $3,200</td></tr>
                  <tr><td className={s.muted}>2022</td><td className={s.mono} style={{ color: "var(--orange)" }}>~4.3×</td><td className={cx(s.small, s.muted)}>Bottom BTC $15,500</td></tr>
                  <tr style={{ background: "rgba(11,102,35,.04)" }}><td style={{ color: "var(--green)" }}>2026</td><td className={s.mono} style={{ color: "var(--green)" }}>+92% ✓</td><td className={s.small} style={{ color: "var(--solar)" }}>Prag 70–80% depășit</td></tr>
                </tbody>
              </table>
              <div className={cx(s.infoBox, s.infoBoxGreen)} style={{ marginTop: 12 }}>XAU/BTC a atins minimul în Oct 2025 (BTC ATH: 0.024). Martie 2026: 0.046 = <strong style={{ color: "var(--fib)" }}>+92%</strong> față de minim - trecut de pragul istoric de semnal.</div>
            </div>
          </div>

          {/* Convergence card */}
          <div className={cx(s.card, s.reveal, s.mb20)}>
            <h2 className={s.cardH2}><span className={s.dot} style={{ background: "var(--solar)" }} />Convergență - 6 Indicatori, Același Window</h2>
            <p className={cx(s.small, s.muted)} style={{ marginBottom: 16 }}>Fiecare metodă e independentă. Când 6 lentile diferite arată același lucru, probabilitatea de coincidență aleatorie este extrem de mică.</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 10 }}>
              {[
                { title: "Timing Ciclu (top confirmat)", desc: "Oct 2025 - 1062 zile după bottom Nov 2022" },
                { title: "RSI Săptămânal < 30", desc: "Februarie 2026 - 26.8 · 5/5 hit rate" },
                { title: "XAU/BTC rebound > 80%", desc: "Martie 2026 - +92% față de minim (Oct 2025)" },
                { title: "Spargere ATH → Bottom", desc: "Martie 2024 + 693 zile med. = Februarie 2026" },
                { title: "Fed Rate BPS = Zile la Bottom", desc: "550 bps · Sep 2024 + 550 zile = Martie 2026" },
                { title: "Drawdown Comprimat (-52–57%)", desc: "Zonă de bottom: $54K–$60K față de ATH $126K" },
              ].map((item, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: 12, background: "rgba(11,102,35,.06)", border: "1px solid rgba(11,102,35,.2)", borderRadius: 8 }}>
                  <span style={{ color: "var(--fib)", fontSize: 18, fontFamily: "var(--font-mono)" }}>✓</span>
                  <div><div style={{ fontWeight: 600, color: "var(--text)", fontSize: 13 }}>{item.title}</div><div className={cx(s.small, s.muted)}>{item.desc}</div></div>
                </div>
              ))}
            </div>
            <div className={s.infoBox} style={{ marginTop: 14 }}><strong style={{ color: "var(--solar)" }}>Disclaimer:</strong> <span className={s.muted}>Aceasta este analiză de pattern, nu sfat financiar. Unele metode au doar 3 date istorice (Fed Rate, drawdowns). Corelația nu înseamnă cauzalitate. Pozitionează-te în funcție de toleranța ta la risc.</span></div>
          </div>
        </Section>

        {/* ── SEASONS ── */}
        <Section id="s-seasons" title="Sezoane Top & Bottom" subtitle="în ce luni apar cel mai des">
          <div className={cx(s.grid2, s.reveal, s.mb20)} style={{ alignItems: "start" }}>
            <div className={s.card}>
              <h2 className={s.cardH2}><span className={s.dot} style={{ background: "var(--solar)" }} />Top-uri BTC - lunile cele mai active</h2>
              <BarChart data={MONTH_TOPS} maxV={1.5} hotColor="#F59E0B" isMonth />
              <div style={{ marginTop: 14, fontSize: 11, color: "var(--muted)", lineHeight: 1.6 }}><strong style={{ color: "var(--solar)" }}>Sep</strong> (+41%) cel mai activ · <strong style={{ color: "var(--fib)" }}>Mai · Iun · Dec</strong> (+14–28%) · <strong style={{ color: "var(--red)" }}>Nov</strong> = aproape zero top-uri</div>
            </div>
            <div className={s.card}>
              <h2 className={s.cardH2}><span className={s.dot} style={{ background: "var(--cycle)" }} />Bottom-uri BTC - lunile cele mai active</h2>
              <BarChart data={MONTH_BOTTOMS} maxV={2.7} hotColor="#06B6D4" isMonth />
              <div style={{ marginTop: 14, fontSize: 11, color: "var(--muted)", lineHeight: 1.6 }}><strong style={{ color: "var(--cycle)" }}>Iun–Sep</strong> (+110–150%) zona de acumulare · <strong style={{ color: "var(--solar)" }}>Ian–Feb</strong> (+79%) · <strong style={{ color: "var(--red)" }}>Oct</strong> = zero low-uri majore</div>
            </div>
          </div>
        </Section>

        {/* ── DOM ── */}
        <Section id="s-dom" title="Analiză Zi din Lună" subtitle="3144 bare · Aug 2017–Mar 2026">
          <div className={cx(s.grid2, s.reveal)}>
            <div className={s.card}>
              <h2 className={s.cardH2}><span className={s.dot} style={{ background: "var(--solar)" }} />Top-uri Pivot - % mai frecvente decât media</h2>
              <BarChart data={DOM_HIGHS} maxV={3} hotColor="#F59E0B" />
            </div>
            <div className={s.card}>
              <h2 className={s.cardH2}><span className={s.dot} style={{ background: "var(--cycle)" }} />Bottom-uri Pivot - % mai frecvente decât media</h2>
              <BarChart data={DOM_LOWS} maxV={3} hotColor="#06B6D4" />
            </div>
          </div>
        </Section>

        {/* ── ECLIPSE ── */}
        <Section id="s-eclipse" title="Eclipse" subtitle="performanță BTC la fiecare eclipsă solară și lunară">
          <div className={cx(s.grid2, s.reveal)} style={{ alignItems: "stretch" }}>
            <ConceptGroup conceptKey="solar" data={CONCEPTS.solar} />
            <ConceptGroup conceptKey="lunar" data={CONCEPTS.lunar} />
          </div>
          <ConceptGroup conceptKey="halving" data={CONCEPTS.halving} />
          <ConceptGroup conceptKey="cycle" data={CONCEPTS.cycle} />
          <ConceptGroup conceptKey="pi" data={CONCEPTS.pi} />
        </Section>

        {/* ── BLOOD MOON ── */}
        <Section id="s-blood" title="Blood Moon Bottom Pattern" subtitle="a 3-a eclipsă lunară totală = bottom de ciclu" icon={<span className={cx(s.astroIcon, s.bloodMoon)} />}>
          <div className={cx(s.philosophy, s.reveal)} style={{ marginBottom: 16 }}>
            <p><strong>Pattern:</strong> Eclipsele lunare totale (Blood Moons) vin în serii de 3-4 în fiecare ciclu BTC, urmate de o pauză de ~2.5 ani fără niciuna. <strong style={{ color: "var(--green)" }}>A 3-a (sau ultima) Blood Moon din fiecare serie a marcat bottom-ul ciclului BTC</strong> - confirmat pe toate cele 3 cicluri anterioare. După ultima Blood Moon, BTC a urcat masiv în fiecare caz.</p>
          </div>
          <div className={cx(s.card, s.reveal, s.mb20)}>
            <h2 className={s.cardH2}><span className={cx(s.astroIcon, s.bloodMoon)} style={{ width: 20, height: 20 }} /> Blood Moon Serii - Istoric Complet</h2>
            <div style={{ overflowX: "auto" }}>
              <table className={s.methodTable}>
                <thead><tr><th>Seria</th><th>#1</th><th>#2</th><th>#3</th><th>#4</th><th>Bottom BTC</th><th>Rally după</th></tr></thead>
                <tbody>
                  <tr style={{ background: "rgba(100,116,139,.04)" }}>
                    <td className={s.muted}>2014–2015</td>
                    <td className={cx(s.muted, s.small, s.mono)}>15 Apr 2014<br/>~$430</td>
                    <td className={cx(s.muted, s.small, s.mono)}>8 Oct 2014<br/>~$353</td>
                    <td className={cx(s.muted, s.small, s.mono)}>4 Apr 2015<br/>~$255</td>
                    <td style={{ color: "var(--green)" }} className={cx(s.small, s.mono)}><strong>28 Sep 2015</strong><br/><strong>~$235</strong></td>
                    <td style={{ color: "var(--green)" }}><strong>$152</strong> <span className={cx(s.muted, s.small)}>(Ian 2015)</span></td>
                    <td style={{ color: "var(--green)" }}>$235 → $20,000<br/><span className={cx(s.muted, s.small)}>+8,400%</span></td>
                  </tr>
                  <tr>
                    <td>2018–2019</td>
                    <td className={cx(s.muted, s.small, s.mono)}>31 Ian 2018<br/>~$10,100</td>
                    <td className={cx(s.muted, s.small, s.mono)}>27 Iul 2018<br/>~$7,600</td>
                    <td style={{ color: "var(--green)" }} className={cx(s.small, s.mono)}><strong>21 Ian 2019</strong><br/><strong>~$3,331</strong></td>
                    <td className={cx(s.muted, s.small)}>-</td>
                    <td style={{ color: "var(--green)" }}><strong>$3,200</strong> <span className={cx(s.muted, s.small)}>(Dec 2018)</span></td>
                    <td style={{ color: "var(--green)" }}>$3,331 → $69,000<br/><span className={cx(s.muted, s.small)}>+1,970%</span></td>
                  </tr>
                  <tr>
                    <td>2021–2022</td>
                    <td className={cx(s.muted, s.small, s.mono)}>26 Mai 2021<br/>~$39,000</td>
                    <td className={cx(s.muted, s.small, s.mono)}>16 Mai 2022<br/>~$30,000</td>
                    <td style={{ color: "var(--green)" }} className={cx(s.small, s.mono)}><strong>8 Nov 2022</strong><br/><strong>~$15,563</strong></td>
                    <td className={cx(s.muted, s.small)}>-</td>
                    <td style={{ color: "var(--green)" }}><strong>$15,500</strong> <span className={cx(s.muted, s.small)}>(Nov 2022 FTX)</span></td>
                    <td style={{ color: "var(--green)" }}>$15,563 → $126,000<br/><span className={cx(s.muted, s.small)}>+710%</span></td>
                  </tr>
                  <tr style={{ background: "rgba(245,158,11,.05)" }}>
                    <td style={{ color: "var(--solar)" }}><strong>2025–2026</strong></td>
                    <td className={cx(s.muted, s.small, s.mono)}>14 Mar 2025<br/>~$83,000</td>
                    <td className={cx(s.muted, s.small, s.mono)}>7 Sep 2025<br/>~$111,000</td>
                    <td style={{ color: "var(--solar)" }} className={cx(s.small, s.mono)}><strong>3 Mar 2026</strong><br/><strong>~$66,154</strong></td>
                    <td className={cx(s.muted, s.small)}>-</td>
                    <td style={{ color: "var(--solar)" }}><strong>$66,154?</strong> <span className={cx(s.muted, s.small)}>(în curs)</span></td>
                    <td style={{ color: "var(--muted)" }}>??? <br/><span className={cx(s.muted, s.small)}>Pauză până în 2028</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className={s.grid3} style={{ marginTop: 18 }}>
              <div className={s.insight} style={{ borderLeftColor: "var(--green)" }}><div className={s.insTitle} style={{ color: "var(--green)" }}>Hit Rate: 3/3 - 100%</div><div className={s.insBody}>Ultima Blood Moon din fiecare serie a marcat bottom-ul ciclului BTC (±2 săptămâni). Nicio excepție în 12 ani de date.</div></div>
              <div className={s.insight} style={{ borderLeftColor: "var(--solar)" }}><div className={s.insTitle} style={{ color: "var(--solar)" }}>Pauză 2026–2028: Zero Blood Moons</div><div className={s.insBody}>Următoarea eclipsă lunară totală: <strong style={{ color: "var(--text)" }}>~2028–2029</strong>. Istoric, perioadele fără Blood Moon = <strong style={{ color: "var(--text)" }}>bull market</strong>.</div></div>
              <div className={s.insight} style={{ borderLeftColor: "var(--red)" }}><div className={s.insTitle} style={{ color: "var(--red)" }}>Contra-argument: Benjamin Cowen</div><div className={s.insBody}>Bottom-ul real ar putea veni Q4 2026, nu acum. Rally-ul actual ar fi doar un <strong style={{ color: "var(--text)" }}>lower high</strong>, similar cu Mar 2022.</div></div>
            </div>
            <div className={cx(s.infoBox, s.infoBoxGreen)} style={{ marginTop: 14 }}>
              <strong style={{ color: "var(--green)" }}>Status actual:</strong> <span className={s.muted}>A 3-a Blood Moon din seria 2025–2026 a avut loc pe <strong style={{ color: "var(--text)" }}>3 Martie 2026</strong> la BTC <strong style={{ color: "var(--text)" }}>$66,154</strong>. Dacă pattern-ul se repetă, aceasta marchează bottom-ul ciclului. Următoarea Blood Moon nu vine până în <strong style={{ color: "var(--text)" }}>2028–2029</strong> (Halving 5 + Shmita).</span>
            </div>
            <div className={s.infoBox} style={{ marginTop: 8 }}>
              <strong style={{ color: "var(--solar)" }}>Surse:</strong> <span className={s.muted}><strong style={{ color: "var(--text)" }}>@rektfencer</strong> (X/Twitter) · <strong style={{ color: "var(--text)" }}>Pure</strong> (NewsBTC) · Eclipse dates: NASA/TimeandDate.com</span>
            </div>
          </div>
        </Section>

        {/* ── MERCURY RETROGRADE ── */}
        <Section id="s-mercury" title="Mercury Retrograde & BTC" subtitle="performanță în cele 21 de perioade cu date (2019–2026)">
          <div className={cx(s.philosophy, s.reveal)} style={{ marginBottom: 16 }}>
            <p><strong>Ce este:</strong> Mercury Retrograde = perioadă de ~3 săptămâni când Mercur pare să meargă înapoi pe cer (de 3 ori pe an). Traderii astro cred că aduce <strong>volatilitate și inversări</strong>. Pattern-ul depinde de trend: în bear market BTC scade, în bull market BTC urcă. <strong style={{ color: "var(--solar)" }}>Nu este predictiv singur</strong> - a fost testat și eliminat din indicatorul Pine Script.</p>
          </div>
          <div className={cx(s.card, s.reveal, s.mb20)}>
            <h2 className={s.cardH2}><span className={s.dot} style={{ background: "var(--pi)" }} />Mercury Retrograde - Performanță BTC (21 perioade verificate)</h2>
            <div className={s.grid4} style={{ marginBottom: 16 }}>
              <div className={s.stat}><div className={s.statVal} style={{ color: "var(--muted)", fontSize: 22 }}>21</div><div className={s.statLbl}>Perioade Analizate</div><div className={s.statSub}>Oct 2019 – Mar 2026</div></div>
              <div className={s.stat}><div className={s.statVal} style={{ color: "var(--red)", fontSize: 22 }}>57%</div><div className={s.statLbl}>Bearish</div><div className={s.statSub}>12 din 21 = scădere</div></div>
              <div className={s.stat}><div className={s.statVal} style={{ color: "var(--muted)", fontSize: 22 }}>+4.0%</div><div className={s.statLbl}>Avg Return</div><div className={s.statSub}>Distorsionat de #14 (+63%)</div></div>
              <div className={s.stat}><div className={s.statVal} style={{ color: "var(--red)", fontSize: 22 }}>-20%</div><div className={s.statLbl}>Max Drawdown</div><div className={s.statSub}>#11 Feb–Mar 2020 (COVID)</div></div>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table className={s.methodTable}>
                <thead><tr><th>#</th><th>Perioadă</th><th>Start</th><th>End</th><th style={{ textAlign: "right" }}>Return</th><th>Context</th></tr></thead>
                <tbody>
                  {MERCURY_DATA.map((mr) => (
                    <tr key={mr.num} style={{ background: mr.highlight === "green" ? "rgba(11,102,35,.04)" : mr.highlight === "solar" ? "rgba(245,158,11,.04)" : undefined }}>
                      <td className={cx(s.mono, mr.highlight ? undefined : s.muted)} style={mr.highlight === "green" ? { color: "var(--green)" } : mr.highlight === "solar" ? { color: "var(--solar)" } : undefined}>{mr.num}</td>
                      <td className={cx(s.small, mr.highlight ? undefined : s.muted)} style={mr.highlight === "green" ? { color: "var(--green)" } : mr.highlight === "solar" ? { color: "var(--solar)" } : undefined}>{mr.period}</td>
                      <td className={s.mono}>{mr.start}</td>
                      <td className={s.mono}>{mr.end}</td>
                      <td style={{ textAlign: "right" }}><span className={cx(s.eclRet, mr.bull ? s.eclRetBull : s.eclRetBear)}>{mr.ret}</span></td>
                      <td className={cx(s.small, !mr.highlight && s.muted)} style={mr.context.includes("crash") || mr.context.includes("Bear") || mr.context.includes("accelerare") ? { color: "var(--red)" } : mr.highlight === "green" ? { color: "var(--green)" } : mr.highlight === "solar" ? { color: "var(--solar)" } : undefined}>{mr.context}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className={s.grid3} style={{ marginTop: 16 }}>
              <div className={s.insight} style={{ borderLeftColor: "var(--red)" }}><div className={s.insTitle} style={{ color: "var(--red)" }}>Bear Market = Scădere</div><div className={s.insBody}>În bear (2022): toate 3 retrogradele au fost bearish (-4% la -13%). Mercury Retrograde <strong style={{ color: "var(--text)" }}>amplifică trendul existent</strong>.</div></div>
              <div className={s.insight} style={{ borderLeftColor: "var(--green)" }}><div className={s.insTitle} style={{ color: "var(--green)" }}>Bull Market = Urcușuri Masive</div><div className={s.insBody}>#14 (+63%) și #16 (+47%) au fost în bull run 2021. Retrograde-ul nu oprește un bull - îl <strong style={{ color: "var(--text)" }}>accelerează</strong>.</div></div>
              <div className={s.insight} style={{ borderLeftColor: "var(--solar)" }}><div className={s.insTitle} style={{ color: "var(--solar)" }}>#30: Blood Moon + Mercury Rx</div><div className={s.insBody}>Retrograde-ul #30 (Feb-Mar 2026) a coincis cu <strong style={{ color: "var(--text)" }}>Blood Moon #3</strong>. BTC +3.7% - primul semn de stabilizare post-crash.</div></div>
            </div>
            <div className={s.infoBox} style={{ marginTop: 14 }}><strong style={{ color: "var(--pi)" }}>Concluzie:</strong> <span className={s.muted}>Mercury Retrograde <strong style={{ color: "var(--text)" }}>nu este predictiv singur</strong> (57% bearish, 43% bullish). Funcționează ca <strong style={{ color: "var(--text)" }}>amplificator de trend</strong> - verifică întotdeauna direcția pieței înainte. Cel mai util când coincide cu alte metode (eclipsă, ciclu).</span></div>
          </div>
        </Section>

        {/* ── GANN ── */}
        <Section id="s-gann" title="Gann Time Cycles" subtitle="proiecții timp de la pivoți majori">
          <div className={cx(s.philosophy, s.reveal)} style={{ marginBottom: 16 }}>
            <p><strong>Verdict din 153 date verificate (3 marje):</strong> La ±3z Gann NU bate random-ul. La <strong style={{ color: "var(--green)" }}>±5z bate cu +2.6pp</strong>, la <strong style={{ color: "var(--green)" }}>±7z bate cu +8.8pp</strong>. Intervalele cu edge real: <strong style={{ color: "var(--green)" }}>+49z (+27pp), +45z (+18pp), +144z (+18pp)</strong>. <strong style={{ color: "var(--red)" }}>+90z e complet inutil</strong> - cel mai popular dar cel mai slab.</p>
          </div>
          <div className={cx(s.grid4, s.reveal, s.mb20)}>
            <div className={s.stat}><div className={s.statVal} style={{ color: "var(--green)", fontSize: 22 }}>+8.8pp</div><div className={s.statLbl}>Edge la ±7z</div><div className={s.statSub}>59% vs 50% random</div></div>
            <div className={s.stat}><div className={s.statVal} style={{ color: "var(--green)", fontSize: 22 }}>75%</div><div className={s.statLbl}>+49z la ±7z</div><div className={s.statSub}>Cel mai bun · +25pp vs random</div></div>
            <div className={s.stat}><div className={s.statVal} style={{ color: "var(--red)", fontSize: 22 }}>25%</div><div className={s.statLbl}>+90z la ±7z</div><div className={s.statSub}>Mereu sub random · INUTIL</div></div>
            <div className={s.stat}><div className={s.statVal} style={{ color: "var(--muted)", fontSize: 22 }}>153</div><div className={s.statLbl}>Date Verificate</div><div className={s.statSub}>13 ancore × 14 intervale</div></div>
          </div>

          {/* Hit Rate per interval table - kept as static HTML since it's a fixed research table */}
          <div className={cx(s.card, s.reveal, s.mb20)}>
            <h2 className={s.cardH2}><span className={s.dot} style={{ background: "var(--cycle)" }} />Hit Rate per Interval - 3 marje de toleranță</h2>
            <p className={cx(s.small, s.muted)} style={{ marginBottom: 12 }}>Gann nu e exact la zi - funcționează ca <strong style={{ color: "var(--text)" }}>zonă de alertă</strong>. Cu ±7z devine semnificativ. Random baseline: ±3z=28%, ±5z=40%, ±7z=50%.</p>
            <div style={{ overflowX: "auto" }}>
              <table className={s.methodTable}>
                <thead><tr><th>Interval</th><th>Grad</th><th style={{ textAlign: "center" }}>±3z</th><th style={{ textAlign: "center" }}>±5z</th><th style={{ textAlign: "center" }}>±7z</th><th>Edge ±5z</th></tr></thead>
                <tbody>
                  {[
                    { int: "+49z \u2605", deg: "7²", d3: "50%", d5: "67%", d7: "75%", edge: "+27pp", good: true },
                    { int: "+45z \u2605", deg: "45°", d3: "25%", d5: "58%", d7: "75%", edge: "+18pp", good: true },
                    { int: "+144z \u2605", deg: "12²", d3: "25%", d5: "58%", d7: "67%", edge: "+18pp", good: true },
                    { int: "+60z", deg: "60°", d3: "17%", d5: "50%", d7: "75%", edge: "+10pp", good: true },
                    { int: "+30z", deg: "30°", d3: "42%", d5: "50%", d7: "58%", edge: "+10pp", good: true },
                    { int: "+360z", deg: "360°", d3: "36%", d5: "45%", d7: "73%", edge: "+5pp", good: false },
                    { int: "+520z", deg: "2×260", d3: "20%", d5: "40%", d7: "70%", edge: "0pp", good: false },
                    { int: "+180z", deg: "180°", d3: "18%", d5: "36%", d7: "64%", edge: "-4pp", good: false },
                    { int: "+120z", deg: "120°", d3: "33%", d5: "33%", d7: "50%", edge: "-7pp", good: false },
                    { int: "+1440z", deg: "4×360", d3: "33%", d5: "33%", d7: "44%", edge: "-7pp", good: false },
                    { int: "+1080z", deg: "3×360", d3: "11%", d5: "33%", d7: "44%", edge: "-7pp", good: false },
                    { int: "+270z", deg: "270°", d3: "18%", d5: "36%", d7: "36%", edge: "-4pp", good: false },
                    { int: "+720z", deg: "2×360", d3: "25%", d5: "25%", d7: "62%", edge: "-15pp", good: false },
                    { int: "+90z", deg: "90°", d3: "8%", d5: "17%", d7: "25%", edge: "-23pp", bad: true },
                  ].map((row) => (
                    <tr key={row.int} style={{ background: row.good ? "rgba(11,102,35,.06)" : row.bad ? "rgba(239,68,68,.04)" : undefined }}>
                      <td className={s.mono} style={{ color: row.good ? "var(--green)" : row.bad ? "var(--red)" : undefined, fontWeight: row.good || row.bad ? 600 : undefined }}>{row.int}</td>
                      <td className={cx(s.muted, s.mono)} style={{ fontSize: 11 }}>{row.deg}</td>
                      <td className={s.mono} style={{ textAlign: "center" }}>{row.d3}</td>
                      <td className={s.mono} style={{ textAlign: "center", color: row.good ? "var(--green)" : row.bad ? "var(--red)" : undefined, fontWeight: row.good || row.bad ? 700 : undefined }}>{row.d5}</td>
                      <td className={s.mono} style={{ textAlign: "center", color: row.good ? "var(--green)" : row.bad ? "var(--red)" : undefined, fontWeight: row.good || row.bad ? 700 : undefined }}>{row.d7}</td>
                      <td className={s.mono} style={{ color: row.good ? "var(--green)" : row.bad ? "var(--red)" : "var(--muted)", fontWeight: row.good || row.bad ? 700 : undefined }}>{row.edge}</td>
                    </tr>
                  ))}
                  <tr style={{ background: "rgba(255,255,255,.02)" }}><td className={s.mono} style={{ color: "var(--muted)" }}><strong>TOTAL</strong></td><td></td><td className={s.mono} style={{ textAlign: "center" }}>26%</td><td className={s.mono} style={{ textAlign: "center" }}>42%</td><td className={s.mono} style={{ textAlign: "center", color: "var(--green)" }}><strong>59%</strong></td><td className={s.mono} style={{ color: "var(--green)" }}>+2.6pp</td></tr>
                  <tr><td className={s.muted} style={{ fontSize: 10 }}>RANDOM</td><td></td><td className={cx(s.muted, s.mono)} style={{ textAlign: "center", fontSize: 10 }}>28%</td><td className={cx(s.muted, s.mono)} style={{ textAlign: "center", fontSize: 10 }}>40%</td><td className={cx(s.muted, s.mono)} style={{ textAlign: "center", fontSize: 10 }}>50%</td><td></td></tr>
                </tbody>
              </table>
            </div>
            <div className={s.grid3} style={{ marginTop: 14 }}>
              <div className={s.insight} style={{ borderLeftColor: "var(--green)" }}><div className={s.insTitle} style={{ color: "var(--green)" }}>Top 3: +49z, +45z, +144z</div><div className={s.insBody}>Intervalele cu cel mai mare edge peste random la ±5z: <strong style={{ color: "var(--text)" }}>+27pp, +18pp, +18pp</strong>. Square of 7 (49z) și 12² (144z) bat intervalele clasice.</div></div>
              <div className={s.insight} style={{ borderLeftColor: "var(--red)" }}><div className={s.insTitle} style={{ color: "var(--red)" }}>+90z = complet inutil</div><div className={s.insBody}>Cel mai citat interval Gann are <strong style={{ color: "var(--red)" }}>cel mai mic hit rate</strong> pe BTC la orice marjă. 8% / 17% / 25% - mereu sub random.</div></div>
              <div className={s.insight} style={{ borderLeftColor: "var(--solar)" }}><div className={s.insTitle} style={{ color: "var(--solar)" }}>Concluzie practică</div><div className={s.insBody}>Gann = <strong style={{ color: "var(--text)" }}>zonă de alertă ±1 săptămână</strong>, nu dată exactă. Folosește doar <strong style={{ color: "var(--green)" }}>+45z, +49z, +60z, +144z</strong> - restul e zgomot.</div></div>
            </div>
          </div>

          {/* Gann projection tables */}
          <div className={cx(s.grid2, s.reveal, s.mb20)} style={{ alignItems: "start" }}>
            <div className={s.card}>
              <h2 className={s.cardH2}><span className={s.dot} style={{ background: "var(--solar)" }} />ATH - 6 Oct 2025 ($124,659) <span style={{ color: "var(--green)", fontSize: 11, fontWeight: 500, textTransform: "none" }}>57% hit</span></h2>
              <GannTable anchorDate="2025-10-06" />
            </div>
            <div className={s.card}>
              <h2 className={s.cardH2}><span className={s.dot} style={{ background: "var(--green)" }} />Bottom FTX - 21 Nov 2022 ($15,781) <span style={{ color: "var(--muted)", fontSize: 11, fontWeight: 500, textTransform: "none" }}>31% hit</span></h2>
              <GannTable anchorDate="2022-11-21" />
            </div>
          </div>

          {/* Gann calculator */}
          <div className={cx(s.reveal, s.mb20)}>
            <GannCalculator />
          </div>
        </Section>

        {/* ── FIBONACCI ── */}
        <Section id="s-fib" title="Fibonacci Timp & Eclipse">
          <div className={cx(s.card, s.reveal, s.mb20)}>
            <h2 className={s.cardH2}><span className={s.dot} style={{ background: "var(--fib)" }} />Niveluri Fibonacci pe Timp (Halving 3 → Halving 4)</h2>
            <p className={cx(s.small, s.muted)} style={{ marginBottom: 14 }}>Halving 3 = 11 Mai 2020 · Halving 4 = 19 Apr 2024 · Span = 1439 zile · Toleranță ±7 zile</p>
            <FibTimeline />
            <div className={cx(s.infoBox, s.infoBoxGreen)} style={{ marginTop: 14 }}><strong style={{ color: "var(--fib)" }}>Rată de succes: 5/9 = 56%</strong> (ATH H4 a căzut între nivele) · Aleatoriu: ~46% · Avantaj: +10pp</div>
          </div>
        </Section>

        {/* ── SHMITA ── */}
        <Section id="s-shmita" title="Ciclul Shmita - 7 Ani">
          <div className={cx(s.philosophy, s.reveal)} style={{ marginBottom: 16 }}>
            <p><strong>Ce este Shmita?</strong> Anul sabatic ebraic - al 7-lea an dintr-un ciclu de 7. În Tora, este an de &quot;eliberare&quot;: datorii iertate, pământ lăsat să se odihnească. Popularizat în finanțe de Rabbi Jonathan Cahn (<em>The Mystery of the Shemitah</em>, 2014). Corelație remarcabilă cu crizele financiare majore.</p>
            <p style={{ marginTop: 8, color: "#94a3b8" }}>⚠️ Corelație observațională, nu cauzalitate dovedită. Folosit ca context macro, nu ca semnal de intrare.</p>
          </div>
          <div className={cx(s.grid2, s.reveal)}>
            <div className={s.card}>
              <h2 className={s.cardH2}><span className={s.dot} style={{ background: "var(--halving)" }} />Istoric - Evenimente Financiare Majore în Shmita</h2>
              <table className={s.methodTable}>
                <thead><tr><th>Perioadă Shmita</th><th>Eveniment Major</th><th>Impact</th></tr></thead>
                <tbody>
                  <tr><td className={cx(s.muted, s.mono)}>1930–1931</td><td>Marea Criză Economică</td><td style={{ color: "var(--red)" }}>Cea mai gravă criză din istorie</td></tr>
                  <tr><td className={cx(s.muted, s.mono)}>1937–1938</td><td>Recesiune globală</td><td style={{ color: "var(--red)" }}>Post-New Deal</td></tr>
                  <tr><td className={cx(s.muted, s.mono)}>1979–1980</td><td>Criză petrol + stagflație</td><td style={{ color: "var(--red)" }}>Recesiune globală</td></tr>
                  <tr><td className={cx(s.muted, s.mono)}>1993–1994</td><td>Crash obligațiuni</td><td style={{ color: "var(--orange)" }}>Pierderi masive bond market</td></tr>
                  <tr><td className={cx(s.muted, s.mono)}>2000–2001</td><td>Dot-com bubble + 9/11</td><td style={{ color: "var(--red)" }}>NASDAQ -78%</td></tr>
                  <tr><td className={cx(s.muted, s.mono)}>2007–2008</td><td>Lehman Brothers - Criză imobiliară</td><td style={{ color: "var(--red)" }}>S&amp;P 500 -57%</td></tr>
                  <tr><td className={cx(s.muted, s.mono)}>2014–2015</td><td>Crash BTC post Mt.Gox</td><td style={{ color: "var(--orange)" }}>BTC -85% (Nov 2013 → Ian 2015)</td></tr>
                  <tr style={{ background: "rgba(247,147,26,.05)" }}><td style={{ color: "var(--halving)" }} className={s.mono}>2021–2022</td><td>Crypto winter + FTX collapse</td><td style={{ color: "var(--red)" }}>BTC -80% · S&amp;P -27%</td></tr>
                </tbody>
              </table>
              <div className={s.infoBox} style={{ marginTop: 14, borderColor: "rgba(247,147,26,.2)", background: "rgba(247,147,26,.05)" }}><strong style={{ color: "var(--orange)" }}>Pattern: 8/8 = 100%</strong> <span className={s.muted}>- toate Shmita-urile recente au coincis cu o criză majoră. Sample size mic, selection bias posibil - folosit ca context macro.</span></div>
            </div>
            <div className={s.card}>
              <h2 className={s.cardH2}><span className={s.dot} style={{ background: "var(--cycle)" }} />BTC în Shmita - Comportament</h2>
              <h2 className={s.cardH2} style={{ marginBottom: 8, marginTop: 4 }}><span className={s.dot} style={{ background: "var(--orange)" }} />Shmita 2014–2015 <span className={cx(s.muted, s.small)} style={{ fontWeight: 400, textTransform: "none" }}>(Sep 2014 → Sep 2015)</span></h2>
              <div className={s.tl}>
                <div className={s.tlItem}><div className={cx(s.tlDot, s.tlDotHit)} /><div className={s.tlDate}>Nov 2013 - ATH pre-Shmita: ~$1,150</div><div className={cx(s.tlLabel, s.muted)}>Mt.Gox collapse Feb 2014 → bear market</div></div>
                <div className={s.tlItem}><div className={s.tlDot} style={{ background: "var(--red)", borderColor: "var(--red)" }} /><div className={s.tlDate}>Ian 2015 - Fond în Shmita: ~$152 <span style={{ color: "var(--red)" }}>(-87%)</span></div><div className={s.tlLabel} style={{ color: "var(--green)" }}>Bottom de ciclu format în interiorul Shmita</div></div>
                <div className={s.tlItem}><div className={cx(s.tlDot, s.tlDotHit)} /><div className={s.tlDate}>Sep 2015 - Recuperare ~$230 la final Shmita</div><div className={cx(s.tlLabel, s.muted)}>Urmat de bull run masiv spre $20k (2017)</div></div>
              </div>
              <h2 className={s.cardH2} style={{ marginTop: 18, marginBottom: 8 }}><span className={s.dot} style={{ background: "var(--halving)" }} />Shmita 2021–2022 <span className={cx(s.muted, s.small)} style={{ fontWeight: 400, textTransform: "none" }}>(Sep 2021 → Sep 2022)</span></h2>
              <div className={s.tl}>
                <div className={s.tlItem}><div className={cx(s.tlDot, s.tlDotHit)} /><div className={s.tlDate}>Nov 2021 - ATH în Shmita: ~$69,000</div><div className={cx(s.tlLabel, s.muted)}>Top format la 2 luni după startul Shmita</div></div>
                <div className={s.tlItem}><div className={s.tlDot} style={{ background: "var(--red)", borderColor: "var(--red)" }} /><div className={s.tlDate}>Nov 2022 - Bottom post-Shmita: ~$15,500 <span style={{ color: "var(--red)" }}>(-78%)</span></div><div className={s.tlLabel} style={{ color: "var(--orange)" }}>FTX collapse - bottom-ul la 2 luni DUPĂ finalul Shmita</div></div>
                <div className={s.tlItem}><div className={cx(s.tlDot, s.tlDotHit)} /><div className={s.tlDate}>2023–2025 - Recuperare spre $126,000 (ATH 6 Oct 2025)</div><div className={cx(s.tlLabel, s.muted)}>Bull run post-Shmita confirmat · 17.5 luni după Halving 4</div></div>
              </div>
              <h2 className={s.cardH2} style={{ marginTop: 18, marginBottom: 8 }}><span className={s.dot} style={{ background: "var(--fib)" }} />Shmita 2028–2029 - Următor</h2>
              <div className={s.infoBox} style={{ marginTop: 0 }}>
                <div style={{ color: "var(--solar)", fontWeight: 700, marginBottom: 6, fontFamily: "var(--font-mono)" }}>Sep 2028 → Sep 2029</div>
                <span className={s.muted}>Coincide cu <strong style={{ color: "var(--text)" }}>Halving 5 (Apr 2028)</strong>. Dacă pattern-ul se repetă, un top macro BTC ar putea precede Shmita-ul, iar bottom-ul de ciclu s-ar forma în 2028–2029.</span>
              </div>
              <div className={s.infoBox} style={{ marginTop: 10, borderColor: "var(--border)" }}><strong style={{ color: "var(--cycle)" }}>Pattern BTC în Shmita:</strong><br/>
                <span className={s.muted}>· Shmita = perioadă bear sau crash &nbsp;· Bottom în sau imediat după Shmita<br/>· Bull run masiv urmează întotdeauna post-Shmita &nbsp;· 2/2 confirmate</span>
              </div>
            </div>
          </div>
        </Section>

        {/* ── HALVING + SHMITA ── */}
        <Section id="s-halving" title="Confluență Halving + Shmita">
          <div className={cx(s.philosophy, s.reveal)} style={{ marginBottom: 16 }}>
            <p><strong>Observație cheie:</strong> Când fereastra de top post-halving (12–18 luni) se suprapune cu un an Shmita, rezultatul istoric este un <strong>top exploziv urmat de crash major</strong>. Când NU se suprapun (Halvinguri 2 și 4), ciclul bear este mai &quot;normal&quot;. Halving 5 + Shmita 2028–2029 recreează exact setup-ul Halvingului 3.</p>
          </div>
          <div className={cx(s.card, s.reveal)}>
            <h2 className={s.cardH2}><span className={s.dot} style={{ background: "var(--halving)" }} />Comparație Cicluri - Top Post-Halving vs. Shmita</h2>
            <div style={{ overflowX: "auto" }}>
              <table className={s.methodTable}>
                <thead><tr><th>Halving</th><th>Dată</th><th>ATH</th><th>Luni până la ATH</th><th>Shmita activ?</th><th>Crash după</th></tr></thead>
                <tbody>
                  <tr style={{ background: "rgba(100,116,139,.04)" }}><td className={s.muted}>Halving 1</td><td className={s.muted}>28 Nov 2012</td><td className={s.muted}>$1,150 <span className={cx(s.muted, s.small)}>(Nov 2013)</span></td><td className={s.muted}>12 luni</td><td style={{ color: "var(--muted)" }}>✗ Nu - Shmita 2014 începe după ATH</td><td style={{ color: "var(--red)" }}>-87% (Mt.Gox)</td></tr>
                  <tr><td><strong>Halving 2</strong></td><td className={s.muted}>9 Iul 2016</td><td>$19,799 <span className={cx(s.muted, s.small)}>(Dec 2017)</span></td><td style={{ color: "var(--green)" }}>17.5 luni</td><td style={{ color: "var(--muted)" }}>✗ Nu - între Shmita</td><td style={{ color: "var(--orange)" }}>-84% (normal)</td></tr>
                  <tr style={{ background: "rgba(167,139,250,.04)" }}><td><strong style={{ color: "var(--pi)" }}>Halving 3</strong></td><td className={s.muted}>11 Mai 2020</td><td style={{ color: "var(--solar)" }}>$69,000 <span className={cx(s.muted, s.small)}>(Nov 2021)</span></td><td style={{ color: "var(--green)" }}>18.3 luni</td><td style={{ color: "var(--solar)" }}>✓ DA - Shmita sept 2021, ATH 2 luni după</td><td style={{ color: "var(--red)" }}><strong>-78% sever</strong></td></tr>
                  <tr><td><strong>Halving 4</strong></td><td className={s.muted}>19 Apr 2024</td><td style={{ color: "var(--solar)" }}>$126,000 <span className={cx(s.muted, s.small)}>(6 Oct 2025)</span></td><td style={{ color: "var(--green)" }}>17.5 luni</td><td style={{ color: "var(--muted)" }}>✗ Nu - între Shmita</td><td style={{ color: "var(--orange)" }}>În desfășurare</td></tr>
                  <tr style={{ background: "rgba(245,158,11,.05)" }}><td><strong style={{ color: "var(--solar)" }}>Halving 5 ⚡</strong></td><td className={s.muted}>~20 Apr 2028</td><td style={{ color: "var(--muted)" }}>? (proiectat)</td><td style={{ color: "var(--muted)" }}>+12–18 luni = Apr–Oct 2029</td><td style={{ color: "var(--solar)" }}>✓ DA - Shmita Sep 2028–Sep 2029 = overlap complet</td><td style={{ color: "var(--red)" }}>Potențial sever</td></tr>
                </tbody>
              </table>
            </div>
            <div className={s.grid3} style={{ marginTop: 18 }}>
              <div className={s.insight} style={{ borderLeftColor: "var(--pi)" }}><div className={s.insTitle} style={{ color: "var(--pi)" }}>Halving 3 + Shmita 2021 - Confirmat</div><div className={s.insBody}>Shmita a început <strong style={{ color: "var(--text)" }}>7 Sep 2021</strong>. ATH $69k format la 18.3 luni după Halving 3 = Nov 2021, exact <strong style={{ color: "var(--text)" }}>2 luni în Shmita</strong>. Crash -78% și FTX collapse. Bottom-ul (Nov 2022) la 2 luni după finalul Shmita.</div></div>
              <div className={s.insight}><div className={s.insTitle} style={{ color: "var(--muted)" }}>Halvinguri 2 &amp; 4 - Fără Shmita</div><div className={s.insBody}>Halvingul 2 (Dec 2017) și Halvingul 4 (Oct 2025) au format top-uri <strong style={{ color: "var(--text)" }}>în afara anilor Shmita</strong>. Crash-urile au urmat normal (-84%, respectiv în desfășurare), fără amplitudinea extremă a confluenței.</div></div>
              <div className={s.insight} style={{ background: "rgba(245,158,11,.06)", borderLeftColor: "var(--solar)" }}><div className={s.insTitle} style={{ color: "var(--solar)" }}>Halving 5 + Shmita 2028–2029 ⚡</div><div className={s.insBody}>Setup <strong style={{ color: "var(--text)" }}>identic cu Halvingul 3</strong>. Shmita începe Sep 2028 - la 5 luni după Halving 5. Fereastra de top (Apr–Oct 2029) cade <strong style={{ color: "var(--text)" }}>100% în Shmita</strong>. De monitorizat cu atenție maximă.</div></div>
            </div>
            <div className={cx(s.infoBox, s.infoBoxPurple)} style={{ marginTop: 14 }}><strong style={{ color: "var(--pi)" }}>Matematică:</strong> <span className={s.muted}>Ciclul de 4 ani BTC și ciclul Shmita de 7 ani se sincronizează complet o dată la <strong style={{ color: "var(--text)" }}>28 de ani</strong>. Halvingul 3 și Halvingul 5 sunt la distanță de exact <strong style={{ color: "var(--text)" }}>2 cicluri Shmita</strong> (14 ani). Sample size mic - folosit ca context macro.</span></div>
          </div>
        </Section>

        {/* ── SCORING ── */}
        <Section id="s-scoring" title="Sistem de Scorare" subtitle="ce face fiecare metodă și de ce contează">
          <p className={cx(s.small, s.muted, s.mb20, s.reveal)}>Fiecare metodă adaugă puncte la un scor total. Când scorul atinge <strong style={{ color: "var(--solar)" }}>4+ puncte și cel puțin o metodă PRIMARĂ</strong> este activă, indicatorul semnalează o fereastră de pivot. Cu cât scorul e mai mare, cu atât fereastra e mai importantă.</p>
          <div className={cx(s.card, s.reveal)} style={{ padding: 0, overflowX: "auto" }}>
            <table className={s.methodTable} style={{ minWidth: 700, tableLayout: "fixed" }}>
              <thead>
                <tr>
                  <th style={{ width: "14%" }}>Metodă</th>
                  <th style={{ width: "10%" }}>Tip · Pct</th>
                  <th style={{ width: "42%" }}>Ce este și de ce contează</th>
                  <th style={{ width: "34%" }}>Exemplu real din trecut</th>
                </tr>
              </thead>
              <tbody>
                <tr><td><strong style={{ color: "var(--solar)" }}>Eclipsă Solară</strong></td><td><span style={{ display: "flex", alignItems: "center", gap: 8 }}><span className={cx(s.tag, s.tagP)}>PRIMAR</span><span className={cx(s.score, s.s3)}>3</span></span></td><td><span style={{ color: "var(--green)", fontWeight: 600 }}>Cea mai puternică metodă.</span> O eclipsă de soare declanșează o fereastră de cumpărare cu <strong>7 zile înainte</strong> de eclipsă. Istoric, 68% din ferestre sunt bullish.</td><td className={s.small}><span style={{ color: "var(--green)" }}>✓</span> <strong>Mar 2024</strong> → BTC urcă de la $65k la $126k în 6 luni</td></tr>
                <tr><td><strong style={{ color: "var(--lunar)" }}>Eclipsă Lunară</strong></td><td><span style={{ display: "flex", alignItems: "center", gap: 8 }}><span className={cx(s.tag, s.tagP)}>PRIMAR</span><span className={cx(s.score, s.s2)}>2</span></span></td><td><span style={{ color: "var(--orange)", fontWeight: 600 }}>Semnal de răsturnare.</span> Fereastra se activează la <strong>±3 zile</strong> față de data eclipsei.</td><td className={s.small}><span style={{ color: "var(--green)" }}>✓</span> Eclipsă lunară <strong>Nov 2021</strong> → top de ciclu $69k</td></tr>
                <tr><td><strong style={{ color: "var(--halving)" }}>Proximitate Halving</strong></td><td><span style={{ display: "flex", alignItems: "center", gap: 8 }}><span className={cx(s.tag, s.tagP)}>PRIMAR</span><span className={cx(s.score, s.s2)}>2</span></span></td><td><span style={{ color: "var(--green)", fontWeight: 600 }}>Cel mai cunoscut ciclu BTC.</span> ATH-ul vine la 17–18 luni după halving.</td><td className={s.small}><span style={{ color: "var(--green)" }}>✓</span> <strong>Halving 4</strong> → ATH $126k la 17.5 luni</td></tr>
                <tr><td><strong style={{ color: "var(--fib)" }}>Fibonacci pe Timp</strong></td><td><span style={{ display: "flex", alignItems: "center", gap: 8 }}><span className={cx(s.tag, s.tagP)}>PRIMAR</span><span className={cx(s.score, s.s2)}>2</span></span></td><td><span style={{ color: "var(--green)", fontWeight: 600 }}>Niveluri Fibonacci aplicate pe calendar.</span> 5 din 9 niveluri au marcat un pivot. Rată: 56%.</td><td className={s.small}><span style={{ color: "var(--green)" }}>✓</span> Nivel 1.272 = <strong>15 Mai 2025</strong> → high local $103k</td></tr>
                <tr><td><strong style={{ color: "var(--pi)" }}>Pi Cycle Top</strong></td><td><span style={{ display: "flex", alignItems: "center", gap: 8 }}><span className={cx(s.tag, s.tagP)}>PRIMAR</span><span className={cx(s.score, s.s3)}>3</span></span></td><td><span style={{ color: "var(--red)", fontWeight: 600 }}>Semnalul nuclear - cel mai rar.</span> 2/2 ori a marcat top de ciclu macro.</td><td className={s.small}><span style={{ color: "var(--green)" }}>✓</span> <strong>Apr 2021</strong> → top local $64k</td></tr>
                {[
                  { name: "Ciclu Scurt - 86 zile", desc: "Un ciclu de ~86 de zile (Intermediate Cycle). BTC formează un low local la fiecare 2–3 luni.", ex: "Mediană istorică: 84 zile între bottom-uri intermediare." },
                  { name: "Faza Lunii", desc: "La Lună Nouă și Lună Plină (ciclu de 29.5 zile), BTC prezintă o tendință ușoară de inversare.", ex: "Efect statistic moderat - nu folosi singur." },
                  { name: "Intervale Gann", desc: "Piețele reacționează la intervale specifice de timp: 30, 45, 90, 180, 360 zile. Cel mai puternic: 180 zile.", ex: "7 Apr 2025 + 180 zile = 5 Oct 2025 = ATH $126,000 ✓" },
                  { name: "Sezonier Ianuarie", desc: "BTC formează low-uri cu +79% mai des în perioada 16 Ianuarie – 15 Februarie.", ex: "Ian 2015 → bottom $152 ✓ · Ian 2023 → bottom $16,500 ✓" },
                  { name: "Zi din Lună", desc: "Ziua 14 → +147% top-uri. Ziua 25 → +135% low-uri. Ziua 12 → zero top-uri.", ex: "Bottom-uri frecvente: zilele 5, 10, 11, 24, 25." },
                ].map((item) => (
                  <tr key={item.name} style={{ background: "rgba(6,182,212,.025)" }}><td><strong>{item.name}</strong></td><td><span style={{ display: "flex", alignItems: "center", gap: 8 }}><span className={cx(s.tag, s.tagS)}>secundar</span><span className={cx(s.score, s.s1)}>1</span></span></td><td>{item.desc}</td><td className={cx(s.small, s.muted)}>{item.ex}</td></tr>
                ))}
                <tr style={{ background: "rgba(245,158,11,.03)" }}><td><strong style={{ color: "var(--solar)" }}>Ciclu Electoral SUA</strong></td><td><span style={{ display: "flex", alignItems: "center", gap: 8 }}><span className={cx(s.tag, s.tagS)}>secundar</span><span className={cx(s.score, s.s1)}>1</span></span></td><td><span style={{ color: "var(--solar)", fontWeight: 600 }}>Corelație consistentă pe 4 cicluri.</span> ATH-ul BTC a venit la 11–13 luni după alegerile prezidențiale.</td><td className={s.small}><span style={{ color: "var(--green)" }}>✓</span> Alegeri <strong>Nov 2024</strong> → ATH Oct 2025 (+11 luni)</td></tr>
              </tbody>
            </table>
          </div>
        </Section>

        {/* ── GLOSSARY ── */}
        <Section id="s-glossary" title="Dicționar Termeni" subtitle="explicații pentru începători">
          <GlossarySection />
        </Section>

        {/* ── LEGEND ── */}
        <Section id="s-legend" title="Legendă Culori Indicator">
          <div className={cx(s.card, s.reveal)}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
              {[
                { label: "Auriu - Eclipsă Solară", bg: "rgba(245,158,11,.12)", border: "rgba(245,158,11,.3)", color: "var(--solar)" },
                { label: "Albastru - Eclipsă Lunară", bg: "rgba(147,197,253,.12)", border: "rgba(147,197,253,.3)", color: "var(--lunar)" },
                { label: "Verde - Fibonacci", bg: "rgba(11,102,35,.12)", border: "rgba(11,102,35,.3)", color: "var(--fib)" },
                { label: "Portocaliu - Halving", bg: "rgba(249,115,22,.12)", border: "rgba(249,115,22,.3)", color: "var(--halving)" },
                { label: "Teal - Cicluri A/B", bg: "rgba(6,182,212,.12)", border: "rgba(6,182,212,.3)", color: "var(--cycle)" },
                { label: "Gri - Watch (scor=3)", bg: "rgba(100,116,139,.12)", border: "rgba(100,116,139,.3)", color: "#90a4ae" },
              ].map((pill) => (
                <span key={pill.label} className={s.colorPill} style={{ background: pill.bg, borderColor: pill.border, color: pill.color }}>
                  {pill.label}
                </span>
              ))}
            </div>
            <p className={cx(s.small, s.muted)}>Triunghi mare = scor ≥5 (convicție ridicată) · Triunghi mic = scor 4 · Punct gri = Watch (orientativ, fără metodă primară)</p>
          </div>
        </Section>

        {/* Footer */}
        <div style={{ textAlign: "center", padding: "32px 0", marginTop: 40, color: "var(--muted)", fontSize: 12, borderTop: "1px solid var(--border)", fontFamily: "var(--font-mono)" }}>
          Elite-Pivots Dashboard &nbsp;&middot;&nbsp; 3144 bare zilnice BTC (2017–2026) &nbsp;&middot;&nbsp; Nu este sfat financiar
        </div>
      </div>

      <QuickJump />
    </div>
  );
}
