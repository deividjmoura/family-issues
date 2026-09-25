"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

const KEY = "ft-color-scheme";

export function ThemeToggle() {
  const [mode, setMode] = useState<"light" | "dark">("dark");

  useEffect(() => {
    try {
      const stored = localStorage.getItem(KEY) as "light" | "dark" | null;
      const prefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)",
      ).matches;
      const next = stored ?? (prefersDark ? "dark" : "light");
      setMode(next);
      document.documentElement.dataset.scheme = next;
    } catch {
      /* ignore */
    }
  }, []);

  function toggle() {
    const next = mode === "dark" ? "light" : "dark";
    setMode(next);
    document.documentElement.dataset.scheme = next;
    try {
      localStorage.setItem(KEY, next);
    } catch {
      /* ignore */
    }
  }

  return (
    <Button type="button" size="sm" variant="secondary" onClick={toggle}>
      {mode === "dark" ? "☀️ Claro" : "🌙 Escuro"}
    </Button>
  );
}
