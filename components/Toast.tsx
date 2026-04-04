"use client";
import { useState, useCallback, useEffect, useRef } from "react";
import { CheckCircle2, AlertCircle, X } from "lucide-react";

export type ToastType = "success" | "error";

interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
}

let _show: ((msg: string, type?: ToastType) => void) | null = null;

/** Call from anywhere to show a toast */
export function showToast(message: string, type: ToastType = "success") {
  _show?.(message, type);
}

export default function ToastProvider() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const counter = useRef(0);

  const show = useCallback((message: string, type: ToastType = "success") => {
    const id = ++counter.current;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3000);
  }, []);

  useEffect(() => { _show = show; return () => { _show = null; }; }, [show]);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div key={t.id}
          className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium shadow-xl pointer-events-auto fade-in"
          style={{
            background: t.type === "success" ? "rgba(20,25,20,0.97)" : "rgba(25,10,10,0.97)",
            border: `1px solid ${t.type === "success" ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)"}`,
            color: t.type === "success" ? "#22c55e" : "#f87171",
            backdropFilter: "blur(12px)",
            minWidth: "200px",
            maxWidth: "320px",
          }}>
          {t.type === "success"
            ? <CheckCircle2 size={15} style={{ flexShrink: 0 }} />
            : <AlertCircle size={15} style={{ flexShrink: 0 }} />}
          <span style={{ color: "rgba(245,240,232,0.9)", flex: 1 }}>{t.message}</span>
          <button onClick={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}
            className="opacity-40 hover:opacity-80 transition-opacity">
            <X size={13} />
          </button>
        </div>
      ))}
    </div>
  );
}
