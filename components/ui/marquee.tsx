"use client";

import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  speed?: number;
  pauseOnHover?: boolean;
  className?: string;
  direction?: "left" | "right";
};

export function Marquee({
  children,
  speed = 40,
  pauseOnHover = true,
  className = "",
  direction = "left",
}: Props) {
  const animName = direction === "left" ? "marquee-left" : "marquee-right";
  return (
    <div
      className={`group relative flex w-full overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)] ${className}`}
    >
      <div
        className={`flex min-w-full shrink-0 items-center justify-around gap-8 ${
          pauseOnHover ? "group-hover:[animation-play-state:paused]" : ""
        }`}
        style={{ animation: `${animName} ${speed}s linear infinite` }}
      >
        {children}
      </div>
      <div
        aria-hidden
        className={`flex min-w-full shrink-0 items-center justify-around gap-8 ${
          pauseOnHover ? "group-hover:[animation-play-state:paused]" : ""
        }`}
        style={{ animation: `${animName} ${speed}s linear infinite` }}
      >
        {children}
      </div>
    </div>
  );
}
