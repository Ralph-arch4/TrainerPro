"use client";
import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { getExerciseImages } from "@/lib/exerciseImages";

// Start/end position photo for an exercise. Alternates the two frames to hint
// at the movement; tap opens both side by side.
export default function ExerciseGuide({ name, height = 140 }: { name: string; height?: number }) {
  const images = getExerciseImages(name);
  const [frame, setFrame] = useState(0);
  const [open, setOpen] = useState(false);
  const [broken, setBroken] = useState(false);

  useEffect(() => {
    if (!images) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => setFrame((f) => (f === 0 ? 1 : 0)), 1400);
    return () => clearInterval(id);
  }, [images?.[0]]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!images || broken) return null;

  return (
    <>
      <button type="button" onClick={() => setOpen(true)}
        className="relative w-full overflow-hidden block"
        style={{ height, background: "#111" }}
        aria-label={`Guida visiva: ${name}`}>
        {images.map((src, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={src} src={src} alt={i === 0 ? `${name} — posizione iniziale` : `${name} — posizione finale`}
            loading="lazy" decoding="async" onError={() => setBroken(true)}
            className="absolute inset-0 w-full h-full object-cover"
            style={{ objectPosition: "center 30%", opacity: frame === i ? 1 : 0, transition: "opacity 0.5s ease" }} />
        ))}
        <span className="absolute bottom-1.5 left-1.5 text-xs font-bold px-1.5 py-0.5 rounded-md"
          style={{ background: "rgba(0,0,0,0.6)", color: "#fff", fontSize: "0.6rem", letterSpacing: "0.05em" }}>
          {frame === 0 ? "INIZIO" : "FINE"}
        </span>
      </button>

      {open && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" onClick={() => setOpen(false)}>
          <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.85)" }} />
          <div className="relative w-full max-w-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-bold" style={{ color: "#fff" }}>{name}</p>
              <button onClick={() => setOpen(false)} className="p-2 rounded-lg" style={{ background: "rgba(255,255,255,0.1)" }} aria-label="Chiudi">
                <X size={16} style={{ color: "#fff" }} />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {images.map((src, i) => (
                <figure key={src} className="rounded-xl overflow-hidden" style={{ background: "#111" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="" className="w-full h-auto block" />
                  <figcaption className="text-xs text-center py-1.5" style={{ color: "rgba(255,255,255,0.7)" }}>
                    {i === 0 ? "1. Posizione iniziale" : "2. Posizione finale"}
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
