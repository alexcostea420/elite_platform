"use client";

import { AnimatePresence, motion } from "framer-motion";

type FaqItemProps = {
  answer: string;
  id: string;
  isOpen: boolean;
  onToggle: () => void;
  question: string;
};

export function FaqItem({ answer, id, isOpen, onToggle, question }: FaqItemProps) {
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
        <motion.span
          animate={{ rotate: isOpen ? 45 : 0 }}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-2xl leading-none text-accent-emerald"
          transition={{ duration: 0.25, ease: "easeInOut" }}
        >
          +
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {isOpen ? (
          <motion.div
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            id={id}
            initial={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
          >
            <div className="border-t border-white/10 px-6 pb-6 pt-4 text-slate-300">
              {answer}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </article>
  );
}
