"use client";

import Link from "next/link";
import { useState } from "react";

import { Container } from "@/components/ui/container";

const QUESTIONS = [
  {
    id: "useful",
    question: "Cât de util a fost trial-ul pentru tine?",
    options: [
      { value: "very", label: "Foarte util - am învățat lucruri noi", emoji: "🔥" },
      { value: "somewhat", label: "Parțial util - câteva lucruri bune", emoji: "👍" },
      { value: "not_much", label: "Nu prea mult", emoji: "😐" },
      { value: "not_at_all", label: "Nu mi-a fost util", emoji: "👎" },
    ],
  },
  {
    id: "favorite",
    question: "Ce ți-a plăcut cel mai mult?",
    options: [
      { value: "videos", label: "Video-urile educaționale", emoji: "🎥" },
      { value: "discord", label: "Comunitatea pe Discord", emoji: "💬" },
      { value: "stocks", label: "Portofoliul de Stocks cu zone Buy/Sell", emoji: "📊" },
      { value: "indicators", label: "Indicatorii TradingView", emoji: "📈" },
      { value: "alex", label: "Analizele și perspectiva lui Alex", emoji: "🧠" },
    ],
  },
  {
    id: "blocker",
    question: "Ce te oprește să continui?",
    options: [
      { value: "price", label: "Prețul e prea mare", emoji: "💰" },
      { value: "not_ready", label: "Nu sunt pregătit încă", emoji: "⏳" },
      { value: "not_enough_value", label: "Nu am văzut suficientă valoare", emoji: "🤔" },
      { value: "other_community", label: "Folosesc altă comunitate", emoji: "👥" },
      { value: "will_subscribe", label: "De fapt, vreau să continui!", emoji: "✅" },
    ],
  },
];

export default function TrialFeedbackPage() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSelect = (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));

    if (step < QUESTIONS.length - 1) {
      setTimeout(() => setStep(step + 1), 300);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "trial_expiry",
          message: JSON.stringify(answers),
        }),
      });
    } catch {
      // Silent fail - feedback is optional
    }
    setSubmitted(true);
    setSubmitting(false);
  };

  if (submitted) {
    const wantsToSubscribe = answers.blocker === "will_subscribe";

    return (
      <main className="flex min-h-screen items-center justify-center bg-surface-night px-4">
        <Container className="max-w-lg text-center">
          <div className="glass-card p-8 md:p-10">
            <div className="text-5xl">{wantsToSubscribe ? "🎉" : "🙏"}</div>
            <h1 className="mt-4 text-2xl font-bold text-white">
              {wantsToSubscribe ? "Bine! Hai să continuăm." : "Mulțumim pentru feedback!"}
            </h1>
            <p className="mt-3 text-slate-400">
              {wantsToSubscribe
                ? "Alege planul care ți se potrivește și păstrează accesul Elite."
                : "Răspunsurile tale ne ajută să îmbunătățim experiența. Ușa rămâne deschisă oricând."}
            </p>

            <div className="mt-6 space-y-3">
              <Link className="accent-button block w-full py-3 text-center font-bold" href="/upgrade">
                {wantsToSubscribe ? "Alege un plan" : "Vezi planurile disponibile"}
              </Link>
              <Link
                className="block text-sm text-slate-500 hover:text-slate-300"
                href="/dashboard"
              >
                Înapoi la Dashboard
              </Link>
            </div>

            {answers.blocker === "price" && (
              <div className="mt-6 rounded-xl bg-accent-emerald/5 border border-accent-emerald/20 p-4">
                <p className="text-sm text-accent-emerald font-semibold">💡 Știai?</p>
                <p className="mt-1 text-sm text-slate-400">
                  Planul de 3 luni e €137 (€1.52/zi) și deblochezi indicatorii instant.
                  Planul de 12 luni e €497 (€1.36/zi) - cel mai bun preț.
                </p>
              </div>
            )}
          </div>
        </Container>
      </main>
    );
  }

  const currentQuestion = QUESTIONS[step];
  const allAnswered = Object.keys(answers).length === QUESTIONS.length;

  return (
    <main className="flex min-h-screen items-center justify-center bg-surface-night px-4">
      <Container className="max-w-lg">
        <div className="glass-card p-6 md:p-8">
          {/* Progress */}
          <div className="mb-6 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Întrebarea {step + 1} din {QUESTIONS.length}
            </p>
            <div className="flex gap-1.5">
              {QUESTIONS.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 w-8 rounded-full transition-all ${
                    i <= step ? "bg-accent-emerald" : "bg-white/10"
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Question */}
          <h2 className="mb-6 text-xl font-bold text-white md:text-2xl">
            {currentQuestion.question}
          </h2>

          {/* Options */}
          <div className="space-y-3">
            {currentQuestion.options.map((option) => {
              const isSelected = answers[currentQuestion.id] === option.value;
              return (
                <button
                  key={option.value}
                  className={`w-full rounded-xl border px-4 py-3.5 text-left transition-all ${
                    isSelected
                      ? "border-accent-emerald bg-accent-emerald/10 text-white"
                      : "border-white/10 bg-white/5 text-slate-300 hover:border-white/20 hover:bg-white/10"
                  }`}
                  onClick={() => handleSelect(currentQuestion.id, option.value)}
                  type="button"
                >
                  <span className="mr-2">{option.emoji}</span>
                  {option.label}
                </button>
              );
            })}
          </div>

          {/* Navigation */}
          <div className="mt-6 flex items-center justify-between">
            {step > 0 ? (
              <button
                className="text-sm text-slate-500 hover:text-white"
                onClick={() => setStep(step - 1)}
                type="button"
              >
                ← Înapoi
              </button>
            ) : (
              <span />
            )}

            {allAnswered && (
              <button
                className="accent-button px-6 py-2.5 font-semibold disabled:opacity-50"
                disabled={submitting}
                onClick={handleSubmit}
                type="button"
              >
                {submitting ? "Se trimite..." : "Trimite feedback"}
              </button>
            )}
          </div>

          {/* Skip */}
          <div className="mt-4 text-center">
            <Link className="text-xs text-slate-600 hover:text-slate-400" href="/upgrade">
              Sari peste → vezi planurile
            </Link>
          </div>
        </div>
      </Container>
    </main>
  );
}
