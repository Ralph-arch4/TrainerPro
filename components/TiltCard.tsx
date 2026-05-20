"use client";
import { useRef, MouseEvent } from "react";

interface Props {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  maxTilt?: number;
}

export default function TiltCard({ children, className, style, maxTilt = 10 }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  function onMove(e: MouseEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    el.style.transform = `perspective(900px) rotateY(${x * maxTilt * 2}deg) rotateX(${-y * maxTilt}deg) scale3d(1.025,1.025,1.025)`;
    el.style.transition = "transform 0.1s ease";
    // Move the sheen
    const sheen = el.querySelector<HTMLElement>(".tilt-sheen");
    if (sheen) {
      sheen.style.background = `radial-gradient(circle at ${(x + 0.5) * 100}% ${(y + 0.5) * 100}%, rgba(255,255,255,0.08) 0%, transparent 60%)`;
    }
  }

  function onLeave() {
    const el = ref.current;
    if (!el) return;
    el.style.transform = "perspective(900px) rotateY(0deg) rotateX(0deg) scale3d(1,1,1)";
    el.style.transition = "transform 0.65s cubic-bezier(0.23,1,0.32,1)";
    const sheen = el.querySelector<HTMLElement>(".tilt-sheen");
    if (sheen) sheen.style.background = "transparent";
  }

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className={className}
      style={{ transformStyle: "preserve-3d", willChange: "transform", ...style }}
    >
      {/* Specular sheen overlay */}
      <div
        className="tilt-sheen absolute inset-0 rounded-2xl pointer-events-none z-10"
        style={{ transition: "background 0.15s ease" }}
      />
      {children}
    </div>
  );
}
