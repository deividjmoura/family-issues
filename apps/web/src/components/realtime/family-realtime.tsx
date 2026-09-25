"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/**
 * Escuta mudanças na família (tarefas, negociações, ofertas, notificações)
 * e atualiza a UI na hora — sem precisar dar F5.
 */
export function FamilyRealtime({
  userId,
  familyId,
}: {
  userId: string;
  familyId: string;
}) {
  const router = useRouter();
  const [toast, setToast] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!userId || !familyId) return;

    const supabase = createClient();

    function scheduleRefresh(message?: string) {
      if (message) {
        setToast(message);
        if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
        toastTimerRef.current = setTimeout(() => setToast(null), 2800);
      }
      // Debounce: vários eventos em sequência viram 1 refresh
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        router.refresh();
      }, 120);
    }

    const channel = supabase
      .channel(`family-live:${familyId}:${userId}`)
      // Tarefas da família
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tasks",
          filter: `family_id=eq.${familyId}`,
        },
        (payload) => {
          const event = payload.eventType;
          if (event === "INSERT") scheduleRefresh("Nova missão no ar");
          else if (event === "UPDATE") scheduleRefresh("Missão atualizada");
          else scheduleRefresh();
        },
      )
      // Negociações (chat-like: chega na hora)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "negotiations",
        },
        (payload) => {
          const row = (payload.new ?? payload.old) as {
            task_id?: string;
            status?: string;
          } | null;
          if (payload.eventType === "INSERT") {
            scheduleRefresh("Nova proposta de negociação");
          } else if (row?.status === "accepted") {
            scheduleRefresh("Negociação aceita");
          } else if (row?.status === "rejected") {
            scheduleRefresh("Negociação recusada");
          } else {
            scheduleRefresh("Negociação atualizada");
          }
        },
      )
      // Ofertas de valor
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "task_offers",
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            scheduleRefresh("Nova oferta de valor");
          } else {
            scheduleRefresh("Oferta atualizada");
          }
        },
      )
      // Notificações do usuário
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          scheduleRefresh("Nova notificação");
        },
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          // opcional: console.debug("realtime ok");
        }
      });

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      void supabase.removeChannel(channel);
    };
  }, [userId, familyId, router]);

  if (!toast) return null;

  return (
    <div className="live-toast" role="status" aria-live="polite">
      <span className="live-toast__dot" aria-hidden />
      {toast}
    </div>
  );
}
