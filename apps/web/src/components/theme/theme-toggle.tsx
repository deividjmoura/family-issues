"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

const KEY = "ft-color-scheme";
type Preference = "system" | "light" | "dark";
type Resolved = "light" | "dark";

function systemMode(): Resolved {
  try {
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  } catch {
    return "light";
  }
}

function readPreference(): Preference {
  try {
    const stored = localStorage.getItem(KEY);
    if (stored === "light" || stored === "dark" || stored === "system") {
      return stored;
    }
    // Legacy: older builds only stored light/dark. Treat missing as system.
    return "system";
  } catch {
    return "system";
  }
}

function resolve(pref: Preference): Resolved {
  return pref === "system" ? systemMode() : pref;
}

function applyPreference(pref: Preference) {
  const resolved = resolve(pref);
  document.documentElement.dataset.scheme = resolved;
  document.documentElement.dataset.themePref = pref;
  try {
    localStorage.setItem(KEY, pref);
  } catch {
    /* ignore */
  }
}

export function ThemeToggle() {
  const [pref, setPref] = useState<Preference>("system");
  const [resolved, setResolved] = useState<Resolved>("light");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const initial = readPreference();
    const next = resolve(initial);
    setPref(initial);
    setResolved(next);
    document.documentElement.dataset.scheme = next;
    document.documentElement.dataset.themePref = initial;
    setReady(true);

    function onStorage(event: StorageEvent) {
      if (event.key !== KEY) return;
      const value = event.newValue;
      if (value !== "light" && value !== "dark" && value !== "system") return;
      setPref(value);
      const r = resolve(value);
      setResolved(r);
      document.documentElement.dataset.scheme = r;
      document.documentElement.dataset.themePref = value;
    }

    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    function onSystemChange() {
      const current = readPreference();
      if (current !== "system") return;
      const r = systemMode();
      setResolved(r);
      document.documentElement.dataset.scheme = r;
    }

    window.addEventListener("storage", onStorage);
    if (typeof mq.addEventListener === "function") {
      mq.addEventListener("change", onSystemChange);
    } else {
      mq.addListener(onSystemChange);
    }

    return () => {
      window.removeEventListener("storage", onStorage);
      if (typeof mq.removeEventListener === "function") {
        mq.removeEventListener("change", onSystemChange);
      } else {
        mq.removeListener(onSystemChange);
      }
    };
  }, []);

  function cycle() {
    // system → light → dark → system
    const order: Preference[] = ["system", "light", "dark"];
    const idx = order.indexOf(pref);
    const next = order[(idx + 1) % order.length];
    setPref(next);
    const r = resolve(next);
    setResolved(r);
    applyPreference(next);
  }

  if (!ready) {
    return (
      <Button type="button" size="sm" variant="secondary" disabled>
        …
      </Button>
    );
  }

  const label =
    pref === "system"
      ? resolved === "dark"
        ? "🖥️ Sistema (escuro)"
        : "🖥️ Sistema (claro)"
      : pref === "dark"
        ? "🌙 Escuro"
        : "☀️ Claro";

  const aria =
    pref === "system"
      ? "Tema: seguir sistema. Toque para tema claro"
      : pref === "light"
        ? "Tema claro. Toque para tema escuro"
        : "Tema escuro. Toque para seguir o sistema";

  return (
    <Button
      type="button"
      size="sm"
      variant="secondary"
      onClick={cycle}
      aria-label={aria}
      title="Alternar: Sistema → Claro → Escuro"
    >
      {label}
    </Button>
  );
}
