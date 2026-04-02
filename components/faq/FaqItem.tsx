"use client";

import { useRef } from "react";

type FaqItemProps = {
  answer: string;
  id: string;
  isOpen: boolean;
  onToggle: () => void;
  question: string;
};

export function FaqItem({ answer, id, isOpen, onToggle, question }: FaqItemProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  return (
    <article className="overflow-hidden rounded-2xl border border-white/10 bg-surface-graphite/90 shadow-card transition-colors duration-200 ease-in-out">
      <button
        aria-controls={id}
        aria-expanded={isOpen}
        className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left transition-colors duration-200 ease-in-out hover:bg-white/5"
        onClick={onToggle}
        type="button"
      >
        <span className="pr-4 text-lg font-semibold text-white">{question}</span>
        <span
          className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-2xl leading-none text-accent-emerald transition-transform duration-[250ms] ease-in-out"
          style={{ transform: isOpen ? "rotate(45deg)" : "rotate(0deg)" }}
        >
          +
        </span>
      </button>
      <div
        id={id}
        className="overflow-hidden transition-[height,opacity] duration-[250ms] ease-in-out"
        style={{
          height: isOpen ? contentRef.current?.scrollHeight ?? "auto" : 0,
          opacity: isOpen ? 1 : 0,
        }}
      >
        <div ref={contentRef}>
          <div className="border-t border-white/10 px-6 pb-6 pt-4 text-slate-300">
            {answer}
          </div>
        </div>
      </div>
    </article>
  );
}
