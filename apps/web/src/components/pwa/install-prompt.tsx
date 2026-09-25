"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(
    null,
  );
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (localStorage.getItem("ft-pwa-dismiss") === "1") return;
    } catch {
      /* ignore */
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setHidden(false);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (hidden || !deferred) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-40 mx-auto max-w-md rounded-xl border border-border bg-card p-4 shadow-lg">
      <p className="text-sm font-medium">Instalar Family Issues?</p>
      <p className="mt-1 text-xs text-muted-foreground">
        Acesse como app na tela inicial — funciona offline o básico.
      </p>
      <div className="mt-3 flex gap-2">
        <Button
          size="sm"
          onClick={async () => {
            await deferred.prompt();
            setHidden(true);
            setDeferred(null);
          }}
        >
          Instalar
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => {
            setHidden(true);
            try {
              localStorage.setItem("ft-pwa-dismiss", "1");
            } catch {
              /* ignore */
            }
          }}
        >
          Agora não
        </Button>
      </div>
    </div>
  );
}
