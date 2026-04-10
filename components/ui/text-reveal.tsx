"use client";

export function TextReveal({ text, className = "" }: { text: string; className?: string }) {
  return (
    <span className={`animate-text-reveal ${className}`}>
      {text.split("").map((char, i) => (
        <span
          key={i}
          style={{ animationDelay: `${0.3 + i * 0.04}s` }}
        >
          {char === " " ? "\u00A0" : char}
        </span>
      ))}
    </span>
  );
}
