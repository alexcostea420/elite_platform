"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  end: number;
  duration?: number;
  startDelay?: number;
};

export function CountUp({ end, duration = 1400, startDelay = 0 }: Props) {
  const [value, setValue] = useState(0);
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    const reduceMotion =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

    if (reduceMotion) {
      setValue(end);
      return;
    }

    let raf = 0;
    let start = 0;

    const tick = (now: number) => {
      if (start === 0) start = now;
      const elapsed = now - start;
      const t = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(end * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };

    const timeout = window.setTimeout(() => {
      raf = requestAnimationFrame(tick);
    }, startDelay);

    return () => {
      window.clearTimeout(timeout);
      cancelAnimationFrame(raf);
    };
  }, [end, duration, startDelay]);

  return <>{value}</>;
}
