"use client";

import { useTransition } from "react";
import {
  approveTask,
  confirmPayment,
  markCompleted,
  registerPayment,
  rejectTask,
  reopenTask,
} from "@/lib/actions/tasks";
import { availableActions } from "@/lib/domain/task-machine";
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

const STATUS_LABEL: Record<string, string> = {
  criada: "Criada",
  atribuida: "Atribuída",
  aguardando_verificacao: "Aguardando verificação",
  aprovada: "Aprovada",
  rejeitada: "Rejeitada",
  paga: "Paga",
  confirmada: "Confirmada",
};

export function TaskList({
  tasks,
  role,
  userId,
}: {
  tasks: Task[];
  role: Role;
  userId: string;
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
      <p className="text-sm text-muted-foreground">Nenhuma tarefa ainda.</p>
    );
  }

  return (
    <div className="space-y-3">
      {tasks.map((task) => {
        const actions = availableActions(task, { userId, role });
        return (
          <Card key={task.id}>
            <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 pb-2">
              <div>
                <CardTitle className="text-base">{task.title}</CardTitle>
                {task.description && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {task.description}
                  </p>
                )}
              </div>
              <Badge>{STATUS_LABEL[task.status] ?? task.status}</Badge>
            </CardHeader>
            <CardContent className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold">
                {formatBRL(task.value_cents)}
              </span>
              {task.rejection_reason && (
                <span className="text-sm text-red-600">
                  Motivo: {task.rejection_reason}
                </span>
              )}
              <div className="ml-auto flex flex-wrap gap-2">
                {actions.includes("complete") && (
                  <Button
                    size="sm"
                    disabled={pending}
                    onClick={() => run(() => markCompleted(task.id))}
                  >
                    Concluí!
                  </Button>
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
                      const reason = window.prompt("Motivo (opcional)") ?? undefined;
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
                {actions.includes("pay") && (
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
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
