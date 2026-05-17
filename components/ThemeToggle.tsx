"use client";
import { useTheme } from "@/lib/theme";
import { Sun, Moon } from "lucide-react";

export default function ThemeToggle({ size = 16 }: { size?: number }) {
  const { theme, toggle } = useTheme();
  return (
    <button onClick={toggle} className="theme-toggle" title={theme === "dark" ? "Passa al tema chiaro" : "Passa al tema scuro"} aria-label="Cambia tema">
      {theme === "dark" ? <Sun size={size} /> : <Moon size={size} />}
    </button>
  );
}
