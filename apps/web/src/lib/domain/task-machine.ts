/**
 * Máquina de estados da Task — regras PURAS (sem I/O).
 */
import type { Role, Task, TaskStatus } from "./types";

export type TaskAction =
  | "claim"
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
  role?: Role; // undefined = qualquer membro da família (claim)
  mustBeAssignee?: boolean;
  mustBeOpen?: boolean; // assignee null
}

export const TRANSITIONS: Record<TaskAction, Transition> = {
  claim: {
    from: ["criada"],
    to: "atribuida",
    mustBeOpen: true,
  },
  assign: { from: ["criada"], to: "atribuida", role: "responsavel" },
  complete: {
    from: ["atribuida", "criada"],
    to: "aguardando_verificacao",
    role: "executor",
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
  task: Pick<Task, "status" | "assignee_id" | "created_by">,
  action: TaskAction,
  actor: Actor,
): TransitionResult {
  const t = TRANSITIONS[action];
  if (t.role && actor.role !== t.role) {
    return { ok: false, error: `Ação "${action}" exige papel ${t.role}.` };
  }
  if (t.mustBeOpen && task.assignee_id != null) {
    return { ok: false, error: "Tarefa já tem executor." };
  }
  if (t.mustBeAssignee && task.assignee_id !== actor.userId) {
    return { ok: false, error: `Só o executor atribuído pode "${action}".` };
  }
  // complete: assignee ou criador (auto-tarefa) ou claim implícito em criada
  if (action === "complete") {
    const isAssignee = task.assignee_id === actor.userId;
    const isOpen = task.assignee_id == null && task.status === "criada";
    const isSelfCreated =
      task.created_by === actor.userId && actor.role === "executor";
    if (!isAssignee && !isOpen && !isSelfCreated) {
      return {
        ok: false,
        error: "Só quem assumiu a tarefa (ou criou) pode concluir.",
      };
    }
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
  task: Pick<Task, "status" | "assignee_id" | "created_by">,
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
  // Pós-aprovação (troca por experiência) — mantido
  if (actor.role !== "executor" || task.assignee_id !== actor.userId) {
    return { ok: false, error: "Só o executor atribuído pode negociar recompensa." };
  }
  if (task.status !== "aprovada") {
    return {
      ok: false,
      error: "Troca de recompensa só após aprovação.",
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

/** Oferta de valor (rebate) em tarefa aberta ou atribuída */
export function canOfferPrice(
  task: Pick<Task, "status" | "assignee_id">,
  actor: Actor,
): TransitionResult {
  if (task.status !== "criada" && task.status !== "atribuida") {
    return { ok: false, error: "Só dá para negociar valor em tarefas abertas/atribuídas." };
  }
  if (task.status === "atribuida" && task.assignee_id !== actor.userId && actor.role !== "responsavel") {
    return { ok: false, error: "Tarefa já assumida por outro." };
  }
  return { ok: true, to: task.status };
}

export function isVerified(status: TaskStatus): boolean {
  return status === "aprovada" || status === "paga" || status === "confirmada";
}
