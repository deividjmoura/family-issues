/**
 * Máquina de estados da Task — regras PURAS (sem I/O).
 * Fonte da verdade para Server Actions (#15, #16, #18) e para a UI decidir quais botões mostrar.
 * Espelha docs/domain.md → "Máquina de estados da Task".
 */
import type { Role, Task, TaskStatus } from "./types";

export type TaskAction =
  | "assign" // responsável atribui a um executor
  | "complete" // executor marca "Concluí"
  | "approve" // responsável conferiu e aprova → selo "Realizada"
  | "reject" // responsável rejeita (motivo opcional)
  | "reopen" // responsável reabre uma rejeitada
  | "pay" // responsável registra "Paguei"
  | "confirm_payment"; // executor confirma que recebeu

interface Transition {
  from: TaskStatus[];
  to: TaskStatus;
  /** Papel exigido na família. */
  role: Role;
  /** Além do papel, precisa ser o executor atribuído à task? */
  mustBeAssignee?: boolean;
}

export const TRANSITIONS: Record<TaskAction, Transition> = {
  assign: { from: ["criada"], to: "atribuida", role: "responsavel" },
  complete: { from: ["atribuida"], to: "aguardando_verificacao", role: "executor", mustBeAssignee: true },
  approve: { from: ["aguardando_verificacao"], to: "aprovada", role: "responsavel" },
  reject: { from: ["aguardando_verificacao"], to: "rejeitada", role: "responsavel" },
  reopen: { from: ["rejeitada"], to: "atribuida", role: "responsavel" },
  pay: { from: ["aprovada"], to: "paga", role: "responsavel" },
  confirm_payment: { from: ["paga"], to: "confirmada", role: "executor", mustBeAssignee: true },
};

export interface Actor {
  userId: string;
  role: Role;
}

export type TransitionResult =
  | { ok: true; to: TaskStatus }
  | { ok: false; error: string };

/** Valida se `actor` pode executar `action` na `task`. Não altera nada. */
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
    return { ok: false, error: `Transição inválida: ${task.status} → ${action}.` };
  }
  return { ok: true, to: t.to };
}

/** Ações disponíveis para o ator (útil para renderizar botões). */
export function availableActions(
  task: Pick<Task, "status" | "assignee_id">,
  actor: Actor,
): TaskAction[] {
  return (Object.keys(TRANSITIONS) as TaskAction[]).filter(
    (a) => canTransition(task, a, actor).ok,
  );
}

/**
 * Negociação (RF04): só depois de aprovada e antes de paga, só pelo executor atribuído,
 * e no máximo uma negociação pendente por task.
 */
export function canNegotiate(
  task: Pick<Task, "status" | "assignee_id" | "swapped">,
  actor: Actor,
  hasPendingNegotiation: boolean,
): TransitionResult {
  if (actor.role !== "executor" || task.assignee_id !== actor.userId) {
    return { ok: false, error: "Só o executor atribuído pode negociar." };
  }
  if (task.status !== "aprovada") {
    return { ok: false, error: "Negociação só é liberada após a aprovação do responsável." };
  }
  if (task.swapped) {
    return { ok: false, error: "Esta tarefa já teve a recompensa trocada." };
  }
  if (hasPendingNegotiation) {
    return { ok: false, error: "Já existe uma negociação pendente." };
  }
  return { ok: true, to: task.status };
}

/** Selo "Realizada" para o executor: só após conferência do responsável. */
export function isVerified(status: TaskStatus): boolean {
  return status === "aprovada" || status === "paga" || status === "confirmada";
}
