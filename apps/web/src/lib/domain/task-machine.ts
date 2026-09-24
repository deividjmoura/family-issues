/**
 * Máquina de estados da Task — regras PURAS (sem I/O).
 * Server Actions devem usá-la em vez de reimplementar.
 */
import type { Role, Task, TaskStatus } from "./types";

export type TaskAction =
  | "assign"
  | "complete"
  | "approve"
  | "reject"
  | "reopen"
  | "pay"
  | "confirm_payment";

interface Transition {
  from: TaskStatus[];
  to: TaskStatus;
  role: Role;
  mustBeAssignee?: boolean;
}

export const TRANSITIONS: Record<TaskAction, Transition> = {
  assign: { from: ["criada"], to: "atribuida", role: "responsavel" },
  complete: {
    from: ["atribuida"],
    to: "aguardando_verificacao",
    role: "executor",
    mustBeAssignee: true,
  },
  approve: {
    from: ["aguardando_verificacao"],
    to: "aprovada",
    role: "responsavel",
  },
  reject: {
    from: ["aguardando_verificacao"],
    to: "rejeitada",
    role: "responsavel",
  },
  reopen: { from: ["rejeitada"], to: "atribuida", role: "responsavel" },
  pay: { from: ["aprovada"], to: "paga", role: "responsavel" },
  confirm_payment: {
    from: ["paga"],
    to: "confirmada",
    role: "executor",
    mustBeAssignee: true,
  },
};

export interface Actor {
  userId: string;
  role: Role;
}

export type TransitionResult =
  | { ok: true; to: TaskStatus }
  | { ok: false; error: string };

export function canTransition(
  task: Pick<Task, "status" | "assignee_id">,
  action: TaskAction,
  actor: Actor,
): TransitionResult {
  const t = TRANSITIONS[action];
  if (actor.role !== t.role) {
    return { ok: false, error: `Ação "${action}" exige papel ${t.role}.` };
  }
  if (t.mustBeAssignee && task.assignee_id !== actor.userId) {
    return { ok: false, error: `Só o executor atribuído pode "${action}".` };
  }
  if (!t.from.includes(task.status)) {
    return {
      ok: false,
      error: `Transição inválida: ${task.status} → ${action}.`,
    };
  }
  return { ok: true, to: t.to };
}

export function availableActions(
  task: Pick<Task, "status" | "assignee_id">,
  actor: Actor,
): TaskAction[] {
  return (Object.keys(TRANSITIONS) as TaskAction[]).filter(
    (a) => canTransition(task, a, actor).ok,
  );
}

export function canNegotiate(
  task: Pick<Task, "status" | "assignee_id" | "swapped">,
  actor: Actor,
  hasPendingNegotiation: boolean,
): TransitionResult {
  if (actor.role !== "executor" || task.assignee_id !== actor.userId) {
    return { ok: false, error: "Só o executor atribuído pode negociar." };
  }
  if (task.status !== "aprovada") {
    return {
      ok: false,
      error: "Negociação só é liberada após a aprovação do responsável.",
    };
  }
  if (task.swapped) {
    return { ok: false, error: "Esta tarefa já teve a recompensa trocada." };
  }
  if (hasPendingNegotiation) {
    return { ok: false, error: "Já existe uma negociação pendente." };
  }
  return { ok: true, to: task.status };
}

export function isVerified(status: TaskStatus): boolean {
  return status === "aprovada" || status === "paga" || status === "confirmada";
}
