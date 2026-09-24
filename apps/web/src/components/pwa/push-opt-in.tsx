"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

export function PushOptIn() {
  const [status, setStatus] = useState<
    "idle" | "unsupported" | "subscribed" | "denied" | "loading"
  >("idle");
  const vapid = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

  useEffect(() => {
    if (!vapid || !("serviceWorker" in navigator) || !("PushManager" in window)) {
      setStatus("unsupported");
      return;
    }
    void navigator.serviceWorker.ready.then((reg) =>
      reg.pushManager.getSubscription().then((sub) => {
        if (sub) setStatus("subscribed");
      }),
    );
  }, [vapid]);

  if (!vapid || status === "unsupported") return null;
  if (status === "subscribed") {
    return (
      <p className="text-xs text-muted-foreground">🔔 Notificações push ativas</p>
    );
  }

  async function enable() {
    setStatus("loading");
    try {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") {
        setStatus("denied");
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapid!),
      });
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub.toJSON()),
      });
      if (!res.ok) throw new Error(await res.text());
      setStatus("subscribed");
    } catch (e) {
      console.error(e);
      setStatus("idle");
      alert("Não foi possível ativar push. Tente de novo.");
    }
  }

  if (status === "denied") {
    return (
      <p className="text-xs text-muted-foreground">
        Push bloqueado no navegador. Libere nas configurações do site.
      </p>
    );
  }

  return (
    <Button
      type="button"
      size="sm"
      variant="secondary"
      disabled={status === "loading"}
      onClick={() => void enable()}
    >
      {status === "loading" ? "Ativando…" : "Ativar notificações push"}
    </Button>
  );
}
