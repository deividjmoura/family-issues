"use client";

import { useMemo, useState } from "react";
import type { Role, Task, TaskStatus } from "@/lib/domain/types";
import { TaskList } from "@/components/tasks/task-list";

const FILTERS: { id: string; label: string; statuses?: TaskStatus[] }[] = [
  { id: "all", label: "Todas" },
  {
    id: "open",
    label: "Abertas",
    statuses: ["atribuida", "aguardando_verificacao"],
  },
  {
    id: "verify",
    label: "A verificar",
    statuses: ["aguardando_verificacao"],
  },
  { id: "approved", label: "Aprovadas", statuses: ["aprovada"] },
  { id: "pay", label: "A pagar / pagas", statuses: ["aprovada", "paga"] },
  { id: "done", label: "Confirmadas", statuses: ["confirmada"] },
  { id: "rejected", label: "Rejeitadas", statuses: ["rejeitada"] },
];

export function TaskFilters({
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
  const [filter, setFilter] = useState("all");

  const filtered = useMemo(() => {
    const conf = FILTERS.find((f) => f.id === filter);
    if (!conf || !conf.statuses) return tasks;
    return tasks.filter((t) => conf.statuses!.includes(t.status));
  }, [tasks, filter]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => {
          const count =
            f.statuses == null
              ? tasks.length
              : tasks.filter((t) => f.statuses!.includes(t.status)).length;
          const active = filter === f.id;
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                active
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground hover:bg-muted"
              }`}
            >
              {f.label}
              <span className="ml-1 opacity-70">{count}</span>
            </button>
          );
        })}
      </div>
      <TaskList
        tasks={filtered}
        role={role}
        userId={userId}
        pendingNegotiationTaskIds={pendingNegotiationTaskIds}
        nameByUserId={nameByUserId}
      />
    </div>
  );
}
