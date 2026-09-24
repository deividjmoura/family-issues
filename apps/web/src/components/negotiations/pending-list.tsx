"use client";

import { useTransition } from "react";
import { respondNegotiation } from "@/lib/actions/negotiations";
import type { Negotiation } from "@/lib/domain/types";
import { Button } from "@/components/ui/button";

export function PendingNegotiations({
  items,
  taskTitles,
}: {
  items: Negotiation[];
  taskTitles: Record<string, string>;
}) {
  const [pending, startTransition] = useTransition();

  if (items.length === 0) return null;

  return (
    <section className="space-y-3 rounded-lg border border-amber-500/40 bg-card p-4">
      <h2 className="text-sm font-semibold text-amber-700 dark:text-amber-400">
        Negociações pendentes
      </h2>
      <ul className="space-y-3">
        {items.map((n) => (
          <li
            key={n.id}
            className="flex flex-wrap items-start justify-between gap-2 text-sm"
          >
            <div>
              <p className="font-medium">
                {taskTitles[n.task_id] ?? n.task_id.slice(0, 8)}
              </p>
              <p className="text-muted-foreground">{n.proposal_text}</p>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                disabled={pending}
                onClick={() =>
                  startTransition(async () => {
                    const res = await respondNegotiation(n.id, true);
                    if (!res.ok) alert(res.error);
                  })
                }
              >
                Aceitar
              </Button>
              <Button
                size="sm"
                variant="destructive"
                disabled={pending}
                onClick={() =>
                  startTransition(async () => {
                    const res = await respondNegotiation(n.id, false);
                    if (!res.ok) alert(res.error);
                  })
                }
              >
                Recusar
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
