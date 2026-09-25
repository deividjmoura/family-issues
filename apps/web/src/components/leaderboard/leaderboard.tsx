import { leaderboardFromTasks } from "@/lib/domain/leaderboard";
import type { Task } from "@/lib/domain/types";

const MEDAL = ["🥇", "🥈", "🥉"];

export function Leaderboard({
  tasks,
  nameByUserId = {},
  title = "Ranking",
}: {
  tasks: Task[];
  nameByUserId?: Record<string, string>;
  title?: string;
}) {
  const rows = leaderboardFromTasks(tasks, nameByUserId);

  if (rows.length === 0) {
    return (
      <section className="rounded-xl border border-border bg-card p-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          {title}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Ainda sem pontos. Tarefas aprovadas entram no ranking.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h2>
      <ol className="space-y-2">
        {rows.map((r, i) => (
          <li
            key={r.userId}
            className="flex items-center gap-3 rounded-lg border border-border/60 bg-muted/20 px-3 py-2"
          >
            <span className="w-8 text-center text-lg">
              {MEDAL[i] ?? `${i + 1}.`}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{r.name}</p>
              <p className="text-xs text-muted-foreground">
                {r.tasks} tarefa{r.tasks === 1 ? "" : "s"}
              </p>
            </div>
            <span className="font-bold tabular-nums text-xp">
              ⭐ {r.points}
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}
