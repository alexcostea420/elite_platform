"use client";

import Link from "next/link";
import { useRef, useState, type ReactNode, type MouseEvent } from "react";

type Props = {
  children: ReactNode;
  className?: string;
  href?: string;
  onClick?: () => void;
  strength?: number;
  type?: "button" | "submit";
};

export function MagneticButton({
  children,
  className = "",
  href,
  onClick,
  strength = 0.25,
  type = "button",
}: Props) {
  const ref = useRef<HTMLElement>(null);
  const [t, setT] = useState({ x: 0, y: 0 });

  function onMove(e: MouseEvent<HTMLElement>) {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(hover: none)").matches) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - (rect.left + rect.width / 2);
    const y = e.clientY - (rect.top + rect.height / 2);
    setT({ x: x * strength, y: y * strength });
  }

  const style = {
    transform: `translate(${t.x}px, ${t.y}px)`,
    transition: "transform 0.18s cubic-bezier(0.22, 1, 0.36, 1)",
  };

  if (href) {
    const isExternal = /^(https?:)?\/\//.test(href) || href.startsWith("mailto:") || href.startsWith("tel:");
    if (isExternal) {
      return (
        <a
          ref={ref as React.RefObject<HTMLAnchorElement>}
          href={href}
          className={className}
          style={style}
          onMouseMove={onMove}
          onMouseLeave={() => setT({ x: 0, y: 0 })}
          onClick={onClick}
          target="_blank"
          rel="noreferrer"
        >
          {children}
        </a>
      );
    }
    return (
      <Link
        ref={ref as React.RefObject<HTMLAnchorElement>}
        href={href}
        className={className}
        style={style}
        onMouseMove={onMove}
        onMouseLeave={() => setT({ x: 0, y: 0 })}
        onClick={onClick}
      >
        {children}
      </Link>
    );
  }

  return (
    <button
      ref={ref as React.RefObject<HTMLButtonElement>}
      type={type}
      className={className}
      style={style}
      onMouseMove={onMove}
      onMouseLeave={() => setT({ x: 0, y: 0 })}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
