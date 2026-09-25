import type { Task } from "./types";

/**
 * XP efetivo de uma tarefa.
 * Se `points` estiver 0/null (tarefas antigas ou form sem XP),
 * usa fallback proporcional ao valor em reais (mín. 1).
 */
export function effectivePoints(
  task: Pick<Task, "points" | "value_cents">,
): number {
  const p = task.points ?? 0;
  if (p > 0) return p;
  const fromValue = Math.max(1, Math.round((task.value_cents ?? 0) / 100));
  return fromValue;
}

export function sumPoints(
  tasks: Pick<Task, "points" | "value_cents" | "status">[],
  statuses: string[] = ["aprovada", "paga", "confirmada"],
): number {
  return tasks
    .filter((t) => statuses.includes(t.status))
    .reduce((s, t) => s + effectivePoints(t), 0);
}
