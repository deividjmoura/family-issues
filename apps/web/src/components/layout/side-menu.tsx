"use client";

import { useEffect, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { signOut } from "@/lib/actions/auth";
import {
  markAllNotificationsRead,
  markNotificationRead,
  type AppNotification,
} from "@/lib/actions/notifications";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { PushOptIn } from "@/components/pwa/push-opt-in";
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

type Tab = "notificacoes" | "opcoes";

export function SideMenu({
  notifications,
}: {
  notifications: AppNotification[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [tab, setTab] = useState<Tab>("notificacoes");
  const [pending, startTransition] = useTransition();
  const unread = notifications.filter((n) => !n.read_at).length;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  function afterRead(action: () => Promise<unknown>) {
    startTransition(async () => {
      await action();
      router.refresh();
    });
  }

  const drawer =
    open && mounted
      ? createPortal(
          <div className="side-menu-root" role="dialog" aria-modal="true">
            <button
              type="button"
              className="side-menu-backdrop"
              aria-label="Fechar menu"
              onClick={() => setOpen(false)}
            />
            <aside className="side-menu-panel">
              <div className="side-menu-panel__head">
                <h2 className="side-menu-panel__title">Menu</h2>
                <button
                  type="button"
                  className="side-menu-close"
                  onClick={() => setOpen(false)}
                  aria-label="Fechar"
                >
                  ×
                </button>
              </div>

              <div className="side-menu-tabs" role="tablist">
                <button
                  type="button"
                  role="tab"
                  aria-selected={tab === "notificacoes"}
                  className={`side-menu-tab${tab === "notificacoes" ? " is-active" : ""}`}
                  onClick={() => setTab("notificacoes")}
                >
                  Notificações
                  {unread > 0 && (
                    <span className="side-menu-tab__badge">{unread}</span>
                  )}
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={tab === "opcoes"}
                  className={`side-menu-tab${tab === "opcoes" ? " is-active" : ""}`}
                  onClick={() => setTab("opcoes")}
                >
                  Opções
                </button>
              </div>

              <div className="side-menu-body">
                {tab === "notificacoes" && (
                  <div className="space-y-3">
                    {unread > 0 && (
                      <Button
                        size="sm"
                        variant="secondary"
                        className="w-full"
                        disabled={pending}
                        onClick={() =>
                          afterRead(() => markAllNotificationsRead())
                        }
                      >
                        Marcar todas como lidas
                      </Button>
                    )}
                    {notifications.length === 0 ? (
                      <p className="py-8 text-center text-sm text-muted-foreground">
                        Nenhuma notificação.
                      </p>
                    ) : (
                      <ul className="space-y-2">
                        {notifications.map((n) => {
                          const title =
                            (typeof n.payload?.title === "string" &&
                              n.payload.title) ||
                            LABELS[n.type] ||
                            n.type;
                          const label = LABELS[n.type] ?? n.type;
                          return (
                            <li
                              key={n.id}
                              className={`rounded-lg border border-border bg-card/80 px-3 py-2.5 text-sm ${
                                n.read_at ? "opacity-55" : ""
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0 flex-1">
                                  <p className="font-medium leading-snug">
                                    {label}
                                  </p>
                                  <p className="break-words text-muted-foreground">
                                    {title}
                                  </p>
                                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                                    {new Date(n.created_at).toLocaleString(
                                      "pt-BR",
                                    )}
                                  </p>
                                </div>
                                {!n.read_at && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="shrink-0"
                                    disabled={pending}
                                    onClick={() =>
                                      afterRead(() =>
                                        markNotificationRead(n.id),
                                      )
                                    }
                                  >
                                    Lida
                                  </Button>
                                )}
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                )}

                {tab === "opcoes" && (
                  <div className="space-y-5">
                    <div className="space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Aparência
                      </p>
                      <ThemeToggle />
                    </div>

                    <div className="space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Notificações push
                      </p>
                      <PushOptIn />
                    </div>

                    <div className="border-t border-border pt-4">
                      <form action={signOut}>
                        <Button
                          type="submit"
                          variant="secondary"
                          className="w-full min-h-[44px]"
                        >
                          Sair da conta
                        </Button>
                      </form>
                    </div>
                  </div>
                )}
              </div>
            </aside>
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <button
        type="button"
        className="side-menu-trigger"
        onClick={() => setOpen(true)}
        aria-label="Abrir menu"
        aria-expanded={open}
      >
        <span className="side-menu-trigger__icon" aria-hidden>
          ☰
        </span>
        {unread > 0 && (
          <span className="side-menu-trigger__badge">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>
      {drawer}
    </>
  );
}
