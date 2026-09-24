"use client";

import { useTransition } from "react";
import {
  markAllNotificationsRead,
  markNotificationRead,
  type AppNotification,
} from "@/lib/actions/notifications";
import { Button } from "@/components/ui/button";

const LABELS: Record<string, string> = {
  task_assigned: "Nova tarefa atribuída",
  task_completed: "Tarefa marcada como concluída",
  task_approved: "Tarefa aprovada",
  task_rejected: "Tarefa rejeitada",
  payment_registered: "Pagamento registrado",
  payment_confirmed: "Pagamento confirmado",
  negotiation_proposed: "Proposta de negociação",
  negotiation_answered: "Resposta à negociação",
};

export function NotificationList({
  items,
}: {
  items: AppNotification[];
}) {
  const [pending, startTransition] = useTransition();
  const unread = items.filter((n) => !n.read_at).length;

  if (items.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">Nenhuma notificação.</p>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          Notificações{" "}
          {unread > 0 && (
            <span className="ml-1 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
              {unread}
            </span>
          )}
        </h2>
        {unread > 0 && (
          <Button
            size="sm"
            variant="secondary"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                await markAllNotificationsRead();
              })
            }
          >
            Marcar todas como lidas
          </Button>
        )}
      </div>
      <ul className="divide-y divide-border rounded-lg border border-border bg-card">
        {items.map((n) => {
          const title =
            (typeof n.payload?.title === "string" && n.payload.title) ||
            LABELS[n.type] ||
            n.type;
          const label = LABELS[n.type] ?? n.type;
          return (
            <li
              key={n.id}
              className={`flex items-start justify-between gap-3 px-4 py-3 text-sm ${
                n.read_at ? "opacity-60" : ""
              }`}
            >
              <div>
                <p className="font-medium">{label}</p>
                <p className="text-muted-foreground">{title}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {new Date(n.created_at).toLocaleString("pt-BR")}
                </p>
              </div>
              {!n.read_at && (
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={pending}
                  onClick={() =>
                    startTransition(async () => {
                      await markNotificationRead(n.id);
                    })
                  }
                >
                  Lida
                </Button>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
