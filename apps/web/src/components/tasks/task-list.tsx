"use client";

import { useTransition } from "react";
import {
  approveTask,
  confirmPayment,
  registerPayment,
  rejectTask,
  reopenTask,
} from "@/lib/actions/tasks";
import { proposeNegotiation } from "@/lib/actions/negotiations";
import { availableActions, canNegotiate } from "@/lib/domain/task-machine";
import { formatBRL } from "@/lib/domain/money";
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

const STATUS_LABEL: Record<string, string> = {
  criada: "Criada",
  atribuida: "Atribuída",
  aguardando_verificacao: "Aguardando verificação",
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
  /** user_id → nome legível */
  nameByUserId?: Record<string, string>;
}) {
  const [pending, startTransition] = useTransition();

  function run(fn: () => Promise<{ ok: boolean; error?: string }>) {
    startTransition(async () => {
      const res = await fn();
      if (!res.ok && res.error) alert(res.error);
    });
  }

  if (tasks.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-muted/30 px-6 py-10 text-center">
        <p className="text-sm font-medium text-foreground">Nenhuma tarefa ainda</p>
        <p className="mt-1 text-xs text-muted-foreground">
          {role === "responsavel"
            ? "Crie a primeira tarefa acima e atribua a um executor."
            : "Quando o responsável atribuir missões, elas aparecem aqui."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {tasks.map((task) => {
        const actions = availableActions(task, { userId, role });
        const hasPending = pendingNegotiationTaskIds.includes(task.id);
        const nego = canNegotiate(task, { userId, role }, hasPending);
        const assigneeName = task.assignee_id
          ? nameByUserId[task.assignee_id]
          : null;

        return (
          <Card key={task.id}>
            <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 pb-2">
              <div className="min-w-0 flex-1">
                <CardTitle className="text-base">{task.title}</CardTitle>
                {task.description && (
                  <p className="mt-1 text-sm text-muted-foreground">
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
                {task.swapped && task.swapped_reward && (
                  <p className="mt-1 text-sm text-amber-600 dark:text-amber-400">
                    Trocado por: {task.swapped_reward}
                  </p>
                )}
              </div>
              <Badge variant={STATUS_VARIANT[task.status] ?? "outline"}>
                {STATUS_LABEL[task.status] ?? task.status}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-3">
              {task.proof_image_url && (
                <a
                  href={task.proof_image_url}
                  target="_blank"
                  rel="noreferrer"
                  className="block overflow-hidden rounded-lg border border-border"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={task.proof_image_url}
                    alt="Prova da tarefa"
                    className="max-h-48 w-full object-cover"
                  />
                </a>
              )}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold tabular-nums">
                  {task.swapped ? "—" : formatBRL(task.value_cents)}
                </span>
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
                  {actions.includes("complete") && (
                    <CompleteTaskButton taskId={task.id} />
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
                      Negociar
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
