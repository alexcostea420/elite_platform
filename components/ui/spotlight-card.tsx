"use client";

import { useRef, useState, type ReactNode, type MouseEvent } from "react";

type Props = {
  children: ReactNode;
  className?: string;
  color?: string;
  size?: number;
  as?: "div" | "article" | "section";
};

export function SpotlightCard({
  children,
  className = "",
  color = "rgba(16, 185, 129, 0.15)",
  size = 380,
  as: Tag = "div",
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);

  function onMove(e: MouseEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  }

  const style =
    pos != null
      ? {
          background: `radial-gradient(${size}px circle at ${pos.x}px ${pos.y}px, ${color}, transparent 60%)`,
        }
      : undefined;

  const Wrapper = Tag as "div";

  return (
    <Wrapper
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={() => setPos(null)}
      className={`group relative overflow-hidden ${className}`}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 [@media(hover:none)]:hidden"
        style={style}
      />
      <div className="relative z-10">{children}</div>
    </Wrapper>
  );
}
