"use client";

import { useEffect, useState } from "react";

type CalendarEvent = {
  title: string;
  titleRo: string;
  date: string;
  impact: "high" | "medium" | "low";
  forecast: string;
  previous: string;
  btcImpact: string | null;
};

type HistoricalEvent = {
  date: string;
  event: string;
  actual: string | number | null;
  previous: string | number | null;
  forecast: string | number | null;
};

function getTimeUntil(dateStr: string): string {
  const now = Date.now();
  const eventTime = new Date(dateStr).getTime();
  const diff = eventTime - now;

  if (diff < 0) return "Trecut";
  if (diff < 60 * 60 * 1000) return `${Math.round(diff / 60000)} min`;
  if (diff < 24 * 60 * 60 * 1000) return `${Math.round(diff / 3600000)}h`;
  return `${Math.round(diff / 86400000)}z`;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("ro-RO", { weekday: "short", day: "numeric", month: "short" });
}

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleTimeString("ro-RO", { hour: "2-digit", minute: "2-digit" });
}

type EventMeta = {
  flag: string;
  country: string;
  typeAbbr: string;
  typeLabel: string;
  typeColor: string;
  isInflation: boolean;
};

function getEventMeta(title: string): EventMeta {
  let flag = "🇺🇸";
  let country = "US";
  if (/\b(ecb|euro\s?zone|eurozone|euro area)\b/i.test(title)) { flag = "🇪🇺"; country = "EU"; }
  else if (/\b(boe|bank of england|uk|britain|sterling|gbp)\b/i.test(title)) { flag = "🇬🇧"; country = "UK"; }
  else if (/\b(boj|bank of japan|japan|yen|jpy)\b/i.test(title)) { flag = "🇯🇵"; country = "JP"; }
  else if (/\b(china|pboc|yuan|cny)\b/i.test(title)) { flag = "🇨🇳"; country = "CN"; }

  let typeAbbr = "·";
  let typeLabel = "Altele";
  let typeColor = "bg-slate-500/15 text-slate-400";
  let isInflation = false;

  if (/\b(fomc|fed|rate decision|interest rate|ecb|boe|boj|pboc|powell|lagarde)\b/i.test(title)) {
    typeAbbr = "CB"; typeLabel = "Bancă centrală"; typeColor = "bg-purple-500/15 text-purple-300";
  } else if (/\b(cpi|pce|ppi|inflation|core)\b/i.test(title)) {
    typeAbbr = "IN"; typeLabel = "Inflație"; typeColor = "bg-rose-500/15 text-rose-300";
    isInflation = true;
  } else if (/\b(nfp|nonfarm|payrolls|unemployment|jobless|employment|jobs|adp)\b/i.test(title)) {
    typeAbbr = "MU"; typeLabel = "Muncă"; typeColor = "bg-blue-500/15 text-blue-300";
  } else if (/\b(gdp|growth|industrial production|retail sales)\b/i.test(title)) {
    typeAbbr = "GR"; typeLabel = "Creștere"; typeColor = "bg-emerald-500/15 text-emerald-300";
  } else if (/\b(pmi|confidence|sentiment|ism|consumer)\b/i.test(title)) {
    typeAbbr = "SE"; typeLabel = "Sentiment"; typeColor = "bg-amber-500/15 text-amber-300";
  }

  return { flag, country, typeAbbr, typeLabel, typeColor, isInflation };
}

function ImpactDot({ impact }: { impact: "high" | "medium" | "low" }) {
  const cls =
    impact === "high"
      ? "bg-red-500"
      : impact === "medium"
      ? "bg-amber-500"
      : "bg-yellow-300/70";
  return <span className={`inline-block h-2.5 w-2.5 shrink-0 rounded-full ${cls}`} aria-hidden="true" />;
}

function TypeChip({ meta }: { meta: EventMeta }) {
  return (
    <span
      className={`inline-flex h-5 shrink-0 items-center justify-center rounded px-1.5 text-[10px] font-bold tracking-wide ${meta.typeColor}`}
      title={meta.typeLabel}
    >
      {meta.typeAbbr}
    </span>
  );
}

function groupByDate(events: CalendarEvent[]): Record<string, CalendarEvent[]> {
  const groups: Record<string, CalendarEvent[]> = {};
  for (const event of events) {
    const day = new Date(event.date).toISOString().split("T")[0];
    if (!groups[day]) groups[day] = [];
    groups[day].push(event);
  }
  return groups;
}

export function CalendarClient() {
  const [tab, setTab] = useState<"week" | "history">("week");
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [history, setHistory] = useState<HistoricalEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);
  const [, setTick] = useState(0);

  useEffect(() => {
    fetch("/api/calendar")
      .then((r) => r.json())
      .then((d) => setEvents(d.events ?? []))
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (tab === "history" && history.length === 0) {
      setHistoryLoading(true);
      fetch("/api/calendar/history")
        .then((r) => r.json())
        .then((d) => setHistory(d.events ?? []))
        .catch(() => setHistory([]))
        .finally(() => setHistoryLoading(false));
    }
  }, [tab, history.length]);

  // Update countdown every minute
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 60000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent-emerald border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-2">
        <button
          className={`rounded-xl px-5 py-2.5 text-sm font-semibold transition ${
            tab === "week"
              ? "bg-accent-emerald text-crypto-dark"
              : "bg-white/5 text-slate-400 hover:bg-white/10"
          }`}
          onClick={() => setTab("week")}
          type="button"
        >
          Săptămâna asta
        </button>
        <button
          className={`rounded-xl px-5 py-2.5 text-sm font-semibold transition ${
            tab === "history"
              ? "bg-accent-emerald text-crypto-dark"
              : "bg-white/5 text-slate-400 hover:bg-white/10"
          }`}
          onClick={() => setTab("history")}
          type="button"
        >
          Istoric rezultate
        </button>
      </div>

      {tab === "history" ? (
        <HistoryView events={history} loading={historyLoading} />
      ) : (
        <WeekView events={events} expandedEvent={expandedEvent} setExpandedEvent={setExpandedEvent} />
      )}
    </div>
  );
}

/* ── History View ── */

function HistoryView({ events, loading }: { events: HistoricalEvent[]; loading: boolean }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent-emerald border-t-transparent" />
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="glass-card p-8 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/5 text-xs font-bold tracking-wider text-slate-400">
          N/A
        </div>
        <h2 className="mt-4 text-xl font-bold text-white">Date istorice indisponibile</h2>
        <p className="mt-2 text-slate-400">Încearcă din nou mai târziu.</p>
      </div>
    );
  }

  // Group by month, most recent first
  const byMonth: Record<string, HistoricalEvent[]> = {};
  for (const e of [...events].reverse()) {
    const month = new Date(e.date).toLocaleDateString("ro-RO", { month: "long", year: "numeric" });
    if (!byMonth[month]) byMonth[month] = [];
    byMonth[month].push(e);
  }

  function getSurpriseColor(
    actual: string | number | null,
    forecast: string | number | null,
    isInflation: boolean,
  ): string {
    if (actual == null || forecast == null || actual === "" || forecast === "") return "text-slate-400";
    const a = parseFloat(String(actual).replace(/[^0-9.-]/g, ""));
    const f = parseFloat(String(forecast).replace(/[^0-9.-]/g, ""));
    if (isNaN(a) || isNaN(f)) return "text-slate-400";
    if (a === f) return "text-amber-400";
    // For inflation, hotter = bearish for risk assets
    const aboveIsBullish = !isInflation;
    const aboveExpect = a > f;
    if (aboveExpect === aboveIsBullish) return "text-emerald-400";
    return "text-red-400";
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-slate-500">
        Rezultatele evenimentelor economice din ultimele luni. Pentru inflație, peste așteptări = bearish pentru active de risc.
      </p>

      {Object.entries(byMonth).map(([month, monthEvents]) => (
        <div key={month}>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-400">
            {month}
          </h3>
          <div className="space-y-2">
            {monthEvents.map((e, i) => {
              const meta = getEventMeta(e.event);
              const actual = e.actual != null && e.actual !== "" ? String(e.actual) : "-";
              const forecast = e.forecast != null && e.forecast !== "" ? String(e.forecast) : "-";
              const previous = e.previous != null && e.previous !== "" ? String(e.previous) : "-";
              const surpriseColor = getSurpriseColor(e.actual, e.forecast, meta.isInflation);

              return (
                <div key={`${e.date}-${e.event}-${i}`} className="glass-card px-4 py-3 md:px-5">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 flex-1 items-center gap-2">
                      <span className="text-base leading-none" aria-label={meta.country}>{meta.flag}</span>
                      <TypeChip meta={meta} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-white">{e.event}</p>
                        <p className="text-xs text-slate-500">
                          {new Date(e.date).toLocaleDateString("ro-RO", { day: "numeric", month: "short", year: "numeric" })}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-4 text-xs sm:gap-6">
                      <div className="text-center">
                        <span className="text-slate-600">Actual</span>
                        <p className={`font-data text-sm font-bold ${surpriseColor}`}>{actual}</p>
                      </div>
                      <div className="text-center">
                        <span className="text-slate-600">Așteptări</span>
                        <p className="font-data text-sm font-semibold text-white">{forecast}</p>
                      </div>
                      <div className="text-center">
                        <span className="text-slate-600">Anterior</span>
                        <p className="font-data text-sm font-semibold text-slate-400">{previous}</p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      <div className="rounded-xl border border-white/5 bg-white/[0.02] px-5 py-4 text-center">
        <p className="text-xs text-slate-600">
          Date din Trading Economics. Verde = bullish pentru active de risc, roșu = bearish.
          Pentru inflație, peste așteptări înseamnă roșu (Fed mai restrictiv). Impactul real depinde de context.
        </p>
      </div>
    </div>
  );
}

/* ── Week View ── */

function WeekView({
  events,
  expandedEvent,
  setExpandedEvent,
}: {
  events: CalendarEvent[];
  expandedEvent: string | null;
  setExpandedEvent: (v: string | null) => void;
}) {
  if (events.length === 0) {
    return (
      <div className="glass-card p-8 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/5 text-xs font-bold tracking-wider text-slate-400">
          —
        </div>
        <h2 className="mt-4 text-xl font-bold text-white">Niciun eveniment săptămâna asta</h2>
        <p className="mt-2 text-slate-400">Verifică din nou luni pentru evenimentele săptămânii.</p>
      </div>
    );
  }

  const grouped = groupByDate(events);
  const now = Date.now();

  // Find next upcoming event for hero card
  const nextEvent = events.find((e) => new Date(e.date).getTime() > now);
  const nextMeta = nextEvent ? getEventMeta(nextEvent.title) : null;

  return (
    <div className="space-y-6">
      {/* Hero: Next upcoming event */}
      {nextEvent && nextMeta && (
        <div
          className={`glass-card overflow-hidden p-6 md:p-8 ${
            nextEvent.impact === "high"
              ? "border-red-500/30"
              : nextEvent.impact === "medium"
              ? "border-amber-500/20"
              : "border-yellow-500/15"
          }`}
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <ImpactDot impact={nextEvent.impact} />
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Următorul eveniment
                </span>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <span className="text-xl leading-none" aria-label={nextMeta.country}>{nextMeta.flag}</span>
                <TypeChip meta={nextMeta} />
                <h2 className="text-2xl font-bold text-white">
                  {nextEvent.titleRo}
                </h2>
              </div>
              <p className="mt-1 text-sm text-slate-400">
                {formatDate(nextEvent.date)} la {formatTime(nextEvent.date)}
              </p>
            </div>
            <div className="text-right">
              <div className="font-data text-4xl font-bold text-white">
                {getTimeUntil(nextEvent.date)}
              </div>
              <p className="text-xs text-slate-500">până la eveniment</p>
            </div>
          </div>

          {nextEvent.btcImpact && (
            <div className="mt-4 rounded-xl bg-white/5 px-4 py-3">
              <p className="text-xs font-semibold text-accent-emerald">
                ₿ Impact istoric pe BTC
              </p>
              <p className="mt-1 text-sm text-slate-300">{nextEvent.btcImpact}</p>
            </div>
          )}

          <div className="mt-4 flex gap-6 text-sm">
            <div>
              <span className="text-slate-500">Așteptări: </span>
              <span className="font-semibold text-white">{nextEvent.forecast}</span>
            </div>
            <div>
              <span className="text-slate-500">Anterior: </span>
              <span className="font-semibold text-white">{nextEvent.previous}</span>
            </div>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500">
        <span className="flex items-center gap-1.5">
          <ImpactDot impact="high" /> Impact mare
        </span>
        <span className="flex items-center gap-1.5">
          <ImpactDot impact="medium" /> Impact mediu
        </span>
        <span className="flex items-center gap-1.5">
          <ImpactDot impact="low" /> Impact mic
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-flex h-4 items-center rounded bg-purple-500/15 px-1 text-[9px] font-bold text-purple-300">CB</span>
          Bancă centrală
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-flex h-4 items-center rounded bg-rose-500/15 px-1 text-[9px] font-bold text-rose-300">IN</span>
          Inflație
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-flex h-4 items-center rounded bg-blue-500/15 px-1 text-[9px] font-bold text-blue-300">MU</span>
          Muncă
        </span>
      </div>

      {/* Events grouped by day */}
      {Object.entries(grouped).map(([day, dayEvents]) => {
        const dayDate = new Date(day);
        const isToday =
          dayDate.toDateString() === new Date().toDateString();
        const isPast = dayDate.getTime() < now - 24 * 60 * 60 * 1000;

        return (
          <div key={day} className={isPast ? "opacity-50" : ""}>
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-slate-400">
              {formatDate(day)}
              {isToday && (
                <span className="rounded-full bg-accent-emerald/20 px-2 py-0.5 text-[10px] font-bold text-accent-emerald">
                  AZI
                </span>
              )}
            </h3>
            <div className="space-y-2">
              {dayEvents.map((event) => {
                const eventTime = new Date(event.date).getTime();
                const isExpanded = expandedEvent === `${day}-${event.title}`;
                const isPastEvent = eventTime < now;
                const meta = getEventMeta(event.title);

                return (
                  <button
                    key={`${day}-${event.title}`}
                    className={`glass-card w-full px-4 py-3 text-left transition-all hover:border-white/20 md:px-5 ${
                      isPastEvent ? "opacity-60" : ""
                    }`}
                    onClick={() =>
                      setExpandedEvent(
                        isExpanded ? null : `${day}-${event.title}`
                      )
                    }
                    type="button"
                  >
                    <div className="flex items-center gap-2.5">
                      <ImpactDot impact={event.impact} />
                      <span className="text-base leading-none" aria-label={meta.country}>{meta.flag}</span>
                      <TypeChip meta={meta} />

                      {/* Event info */}
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-white">
                          {event.titleRo}
                        </p>
                        <p className="text-xs text-slate-500">
                          {formatTime(event.date)}
                          {!isPastEvent && (
                            <span className="ml-2 text-accent-emerald">
                              în {getTimeUntil(event.date)}
                            </span>
                          )}
                        </p>
                      </div>

                      {/* Forecast / Previous */}
                      <div className="hidden gap-4 text-right text-xs sm:flex">
                        <div>
                          <span className="text-slate-600">Așteptări</span>
                          <p className="font-data font-semibold text-white">
                            {event.forecast}
                          </p>
                        </div>
                        <div>
                          <span className="text-slate-600">Anterior</span>
                          <p className="font-data font-semibold text-slate-300">
                            {event.previous}
                          </p>
                        </div>
                      </div>

                      {/* Chevron */}
                      <span
                        className={`text-slate-600 transition-transform ${
                          isExpanded ? "rotate-180" : ""
                        }`}
                      >
                        ▾
                      </span>
                    </div>

                    {/* Expanded details */}
                    {isExpanded && (
                      <div className="mt-3 border-t border-white/5 pt-3">
                        {/* Mobile: show forecast/previous */}
                        <div className="mb-3 flex gap-4 text-xs sm:hidden">
                          <div>
                            <span className="text-slate-600">Așteptări: </span>
                            <span className="font-semibold text-white">
                              {event.forecast}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-600">Anterior: </span>
                            <span className="font-semibold text-slate-300">
                              {event.previous}
                            </span>
                          </div>
                        </div>

                        {event.btcImpact ? (
                          <div className="rounded-lg bg-accent-emerald/5 px-3 py-2">
                            <p className="text-xs font-semibold text-accent-emerald">
                              ₿ Impact istoric pe BTC
                            </p>
                            <p className="mt-1 text-sm text-slate-300">
                              {event.btcImpact}
                            </p>
                          </div>
                        ) : (
                          <p className="text-xs text-slate-500">
                            Fără date istorice de impact pe BTC pentru acest
                            eveniment.
                          </p>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Info footer */}
      <div className="rounded-xl border border-white/5 bg-white/[0.02] px-5 py-4 text-center">
        <p className="text-xs text-slate-600">
          Date din Forex Factory. Ore afișate în fusul tău orar local.
          Impactul istoric pe BTC este orientativ și nu garantează rezultate viitoare.
        </p>
      </div>
    </div>
  );
}
