import type { Task } from "./types";
import { effectivePoints } from "./points";

/** Pontos contam em tarefas aprovadas / pagas / confirmadas (não rejeitadas). */
export function leaderboardFromTasks(
  tasks: Task[],
  nameByUserId: Record<string, string> = {},
): { userId: string; name: string; points: number; tasks: number }[] {
  const map = new Map<string, { points: number; tasks: number }>();

  for (const t of tasks) {
    if (!t.assignee_id) continue;
    if (
      t.status !== "aprovada" &&
      t.status !== "paga" &&
      t.status !== "confirmada"
    ) {
      continue;
    }
    const pts = effectivePoints(t);
    const cur = map.get(t.assignee_id) ?? { points: 0, tasks: 0 };
    cur.points += pts;
    cur.tasks += 1;
    map.set(t.assignee_id, cur);
  }

  return [...map.entries()]
    .map(([userId, v]) => ({
      userId,
      name: nameByUserId[userId] ?? userId.slice(0, 8) + "…",
      points: v.points,
      tasks: v.tasks,
    }))
    .sort((a, b) => b.points - a.points || b.tasks - a.tasks);
}
