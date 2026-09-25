"use client";

import { useState, useTransition } from "react";
import { sfx } from "@/lib/sounds";
import {
  approveTask,
  claimTask,
  confirmPayment,
  registerPayment,
  rejectTask,
  reopenTask,
} from "@/lib/actions/tasks";
import { proposeNegotiation } from "@/lib/actions/negotiations";
import {
  availableActions,
  canNegotiate,
  canOfferPrice,
} from "@/lib/domain/task-machine";
import { formatBRL } from "@/lib/domain/money";
import { effectivePoints } from "@/lib/domain/points";
import type { Role, Task } from "@/lib/domain/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CompleteTaskButton } from "@/components/tasks/complete-task-button";
import { ProposeOfferButton } from "@/components/offers/propose-offer-button";

const STATUS_LABEL: Record<string, string> = {
  criada: "Aberta",
  atribuida: "Assumida",
  aguardando_verificacao: "A verificar",
  aprovada: "Aprovada",
  rejeitada: "Rejeitada",
  paga: "Paga",
  confirmada: "Confirmada",
};

const STATUS_VARIANT: Record<
  string,
  "default" | "secondary" | "success" | "warning" | "destructive" | "outline"
> = {
  criada: "secondary",
  atribuida: "default",
  aguardando_verificacao: "warning",
  aprovada: "success",
  rejeitada: "destructive",
  paga: "outline",
  confirmada: "success",
};

export function TaskList({
  tasks,
  role,
  userId,
  pendingNegotiationTaskIds = [],
  nameByUserId = {},
}: {
  tasks: Task[];
  role: Role;
  userId: string;
  pendingNegotiationTaskIds?: string[];
  nameByUserId?: Record<string, string>;
}) {
  const [pending, startTransition] = useTransition();
  const [preview, setPreview] = useState<string | null>(null);

  function run(fn: () => Promise<{ ok: boolean; error?: string }>) {
    startTransition(async () => {
      const res = await fn();
      if (res.ok) sfx.success();
      else if (res.error) {
        sfx.close();
        alert(res.error);
      }
    });
  }

  if (tasks.length === 0) {
    return (
      <div className={role === "executor"
        ? "theme-game__empty rounded-2xl border border-dashed border-cyan-400/30 bg-cyan-950/10 px-6 py-12 text-center"
        : "rounded-xl border border-dashed border-border bg-muted/30 px-6 py-10 text-center"}>
        {role === "executor" && (
          <span className="theme-game__empty-icon" aria-hidden>🗺️</span>
        )}
        <p className="text-sm font-medium text-foreground">
          {role === "executor" ? "Mapa limpo!" : "Nenhuma tarefa"}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {role === "responsavel"
            ? "Crie uma tarefa pelo menu (☰)."
            : "Missões abertas ou atribuídas a você aparecem aqui."}
        </p>
        {role === "executor" && (
          <p className="mt-3 text-[11px] font-semibold uppercase tracking-wider text-cyan-300/60">
            Nova missão desbloqueada em breve
          </p>
        )}
      </div>
    );
  }

  return (
    <>
      {preview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setPreview(null)}
          role="dialog"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview}
            alt="Prova ampliada"
            className="max-h-[85vh] max-w-full rounded-lg object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      <div className="space-y-3">
        {tasks.map((task) => {
          const actions = availableActions(task, { userId, role });
          const hasPending = pendingNegotiationTaskIds.includes(task.id);
          const nego = canNegotiate(task, { userId, role }, hasPending);
          const offerOk = canOfferPrice(task, { userId, role }).ok;
          const assigneeName = task.assignee_id
            ? nameByUserId[task.assignee_id]
            : null;
          const pts = task.points ?? 0;

          return (
            <Card key={task.id} className={role === "executor" ? "theme-game__mission-card" : undefined}>
              <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 pb-2">
                <div className="min-w-0 flex-1">
                  <CardTitle className="text-base">{task.title}</CardTitle>
                  {task.description && (
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                      {task.description}
                    </p>
                  )}
                  {assigneeName && role === "responsavel" && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Executor:{" "}
                      <span className="font-medium text-foreground">
                        {assigneeName}
                      </span>
                    </p>
                  )}
                  {!task.assignee_id && task.status === "criada" && (
                    <p className="mt-1 text-xs font-medium text-primary">
                      Quadro aberto — alguém pode assumir
                    </p>
                  )}
                  {task.swapped && task.swapped_reward && (
                    <p className="mt-1 text-sm text-amber-600 dark:text-amber-400">
                      Trocado por: {task.swapped_reward}
                    </p>
                  )}
                  {task.completion_note && (
                    <div className="mt-2 rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                        Mensagem do executor
                      </p>
                      <p className="mt-0.5 whitespace-pre-wrap">
                        {task.completion_note}
                      </p>
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Badge variant={STATUS_VARIANT[task.status] ?? "outline"}>
                    {STATUS_LABEL[task.status] ?? task.status}
                  </Badge>
                  {task.proof_image_url && (
                    <button
                      type="button"
                      title="Ver prova"
                      onClick={() => setPreview(task.proof_image_url)}
                      className="h-10 w-10 overflow-hidden rounded-md border border-border"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={task.proof_image_url}
                        alt="Prova"
                        className="h-full w-full object-cover"
                      />
                    </button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold tabular-nums">
                    {task.swapped ? "—" : formatBRL(task.value_cents)}
                  </span>
                  {pts > 0 && (
                    <span className="rounded-full bg-xp/15 px-2 py-0.5 text-xs font-semibold text-xp">
                      ⭐ {pts} pts
                    </span>
                  )}
                  {task.payment_due_date && (
                    <span className="text-xs text-muted-foreground">
                      Pagar até{" "}
                      {new Date(
                        task.payment_due_date + "T12:00:00",
                      ).toLocaleDateString("pt-BR")}
                    </span>
                  )}
                  {task.rejection_reason && (
                    <span className="text-sm text-destructive">
                      Motivo: {task.rejection_reason}
                    </span>
                  )}
                  <div className="ml-auto flex flex-wrap gap-2">
                    {actions.includes("claim") && (
                      <Button
                        size="sm"
                        disabled={pending}
                        onClick={() => run(() => claimTask(task.id))}
                      >
                        Assumir
                      </Button>
                    )}
                    {offerOk && (
                      <ProposeOfferButton
                        taskId={task.id}
                        currentValueCents={task.value_cents}
                      />
                    )}
                    {actions.includes("complete") && (
                      <CompleteTaskButton taskId={task.id} xp={effectivePoints(task)} />
                    )}
                    {actions.includes("approve") && (
                      <Button
                        size="sm"
                        disabled={pending}
                        onClick={() => run(() => approveTask(task.id))}
                      >
                        Aprovar
                      </Button>
                    )}
                    {actions.includes("reject") && (
                      <Button
                        size="sm"
                        variant="destructive"
                        disabled={pending}
                        onClick={() => {
                          const reason =
                            window.prompt("Motivo (opcional)") ?? undefined;
                          run(() => rejectTask(task.id, reason));
                        }}
                      >
                        Rejeitar
                      </Button>
                    )}
                    {actions.includes("reopen") && (
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={pending}
                        onClick={() => run(() => reopenTask(task.id))}
                      >
                        Reabrir
                      </Button>
                    )}
                    {actions.includes("pay") && !task.swapped && (
                      <Button
                        size="sm"
                        disabled={pending}
                        onClick={() => run(() => registerPayment(task.id))}
                      >
                        Paguei
                      </Button>
                    )}
                    {actions.includes("confirm_payment") && (
                      <Button
                        size="sm"
                        disabled={pending}
                        onClick={() => run(() => confirmPayment(task.id))}
                      >
                        Confirmei recebimento
                      </Button>
                    )}
                    {nego.ok && (
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={pending}
                        onClick={() => {
                          const text = window.prompt(
                            "Propor troca (ex: passeio na praia)",
                          );
                          if (!text) return;
                          run(() => proposeNegotiation(task.id, text));
                        }}
                      >
                        Negociar recompensa
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </>
  );
}
