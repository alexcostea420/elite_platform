"use client";

import { motion, useScroll, useSpring } from "framer-motion";

export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 180,
    damping: 30,
    restDelta: 0.001,
  });

  return (
    <motion.div
      aria-hidden
      className="fixed left-0 right-0 top-0 z-[80] h-[2px] origin-left bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-300"
      style={{ scaleX }}
    />
  );
}
