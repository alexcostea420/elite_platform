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
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);
  const [, setTick] = useState(0);

  useEffect(() => {
    fetch("/api/calendar")
      .then((r) => r.json())
      .then((d) => setEvents(d.events ?? []))
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  }, []);

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

  if (events.length === 0) {
    return (
      <div className="glass-card p-8 text-center">
        <div className="text-4xl">📅</div>
        <h2 className="mt-4 text-xl font-bold text-white">Niciun eveniment săptămâna asta</h2>
        <p className="mt-2 text-slate-400">Verifică din nou luni pentru evenimentele săptămânii.</p>
      </div>
    );
  }

  const grouped = groupByDate(events);
  const now = Date.now();

  // Find next upcoming event for hero card
  const nextEvent = events.find((e) => new Date(e.date).getTime() > now);

  return (
    <div className="space-y-6">
      {/* Hero: Next upcoming event */}
      {nextEvent && (
        <div
          className={`glass-card overflow-hidden p-6 md:p-8 ${
            nextEvent.impact === "high"
              ? "border-red-500/30"
              : "border-amber-500/20"
          }`}
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span
                  className={`inline-block h-3 w-3 rounded-full ${
                    nextEvent.impact === "high"
                      ? "bg-red-500 animate-pulse"
                      : "bg-amber-500"
                  }`}
                />
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Următorul eveniment
                </span>
              </div>
              <h2 className="mt-2 text-2xl font-bold text-white">
                {nextEvent.titleRo}
              </h2>
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
      <div className="flex items-center gap-4 text-xs text-slate-500">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-red-500" />
          Impact mare
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-amber-500" />
          Impact mediu
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
                    <div className="flex items-center gap-3">
                      {/* Impact dot */}
                      <span
                        className={`inline-block h-2.5 w-2.5 shrink-0 rounded-full ${
                          event.impact === "high"
                            ? "bg-red-500"
                            : "bg-amber-500"
                        }`}
                      />

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
