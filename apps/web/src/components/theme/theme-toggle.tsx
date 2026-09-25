"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

const KEY = "ft-color-scheme";
type Mode = "light" | "dark";

function readMode(): Mode {
  try {
    const current = document.documentElement.dataset.scheme;
    if (current === "light" || current === "dark") return current;

    const stored = localStorage.getItem(KEY);
    if (stored === "light" || stored === "dark") return stored;

    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  } catch {
    return "dark";
  }
}

function applyMode(mode: Mode) {
  document.documentElement.dataset.scheme = mode;
  try {
    localStorage.setItem(KEY, mode);
  } catch {
    /* ignore */
  }
}

export function ThemeToggle() {
  const [mode, setMode] = useState<Mode>("dark");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const initial = readMode();
    setMode(initial);
    document.documentElement.dataset.scheme = initial;
    setReady(true);

    function onStorage(event: StorageEvent) {
      if (event.key !== KEY) return;
      const next = event.newValue;
      if (next !== "light" && next !== "dark") return;
      setMode(next);
      document.documentElement.dataset.scheme = next;
    }

    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  function toggle() {
    const next: Mode = mode === "dark" ? "light" : "dark";
    setMode(next);
    applyMode(next);
  }

  if (!ready) {
    return (
      <Button type="button" size="sm" variant="secondary" disabled>
        …
      </Button>
    );
  }

  return (
    <Button
      type="button"
      size="sm"
      variant="secondary"
      onClick={toggle}
      aria-label={mode === "dark" ? "Ativar tema claro" : "Ativar tema escuro"}
      title="Alternar tema claro/escuro"
    >
      {mode === "dark" ? "☀️ Claro" : "🌙 Escuro"}
    </Button>
  );
}
