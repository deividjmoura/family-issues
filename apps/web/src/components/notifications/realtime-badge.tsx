"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/**
 * Escuta inserts em notifications do usuário e faz refresh da página.
 * Montar uma vez nos painéis (responsável / executor).
 */
export function RealtimeNotifications({ userId }: { userId: string }) {
  const router = useRouter();
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    if (!userId) return;
    const supabase = createClient();
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          setFlash(true);
          router.refresh();
          const t = setTimeout(() => setFlash(false), 2500);
          return () => clearTimeout(t);
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [userId, router]);

  if (!flash) return null;

  return (
    <div
      className="fixed bottom-4 right-4 z-50 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-lg animate-in fade-in"
      role="status"
    >
      Nova notificação
    </div>
  );
}
