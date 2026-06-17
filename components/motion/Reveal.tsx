"use client";
import { motion, useReducedMotion, type HTMLMotionProps } from "framer-motion";
import { EASE } from "./index";

type RevealProps = HTMLMotionProps<"div"> & {
  delay?: number;
  y?: number;
  duration?: number;
  once?: boolean;
};

export default function Reveal({
  children,
  delay = 0,
  y = 22,
  duration = 0.5,
  once = true,
  ...rest
}: RevealProps) {
  const prefersReduced = useReducedMotion();
  return (
    <motion.div
      initial={{ opacity: 0, y: prefersReduced ? 0 : y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, margin: "-40px" }}
      transition={{ duration: prefersReduced ? 0.01 : duration, delay, ease: EASE }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}
