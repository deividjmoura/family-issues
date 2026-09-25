"use client";

import { useState, useTransition } from "react";
import { respondOffer } from "@/lib/actions/offers";
import { formatBRL } from "@/lib/domain/money";
import type { TaskOffer } from "@/lib/domain/types";
import { Button } from "@/components/ui/button";

export function PendingOffers({
  offers,
  taskMeta,
  nameByUserId = {},
  currentUserId,
}: {
  offers: TaskOffer[];
  taskMeta: Record<string, { title: string; value_cents: number }>;
  nameByUserId?: Record<string, string>;
  currentUserId: string;
}) {
  const [pending, startTransition] = useTransition();
  const [counterFor, setCounterFor] = useState<string | null>(null);
  const [counterVal, setCounterVal] = useState("");

  // Só ofertas de OUTROS usuários (você responde)
  const incoming = offers.filter((o) => o.user_id !== currentUserId);
  if (incoming.length === 0) return null;

  function run(fn: () => Promise<{ ok: boolean; error?: string }>) {
    startTransition(async () => {
      const res = await fn();
      if (!res.ok && res.error) alert(res.error);
    });
  }

  return (
    <section className="space-y-3 rounded-xl border border-amber-500/40 bg-card p-4">
      <h2 className="text-sm font-semibold text-amber-700 dark:text-amber-400">
        Propostas de valor (rebate)
      </h2>
      <ul className="space-y-3">
        {incoming.map((o) => {
          const meta = taskMeta[o.task_id];
          const original = meta?.value_cents ?? 0;
          return (
            <li
              key={o.id}
              className="flex flex-col gap-2 border-b border-border pb-3 last:border-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="text-sm">
                <p className="font-medium">
                  {meta?.title ?? o.task_id.slice(0, 8)}
                </p>
                <p className="text-muted-foreground">
                  {nameByUserId[o.user_id] ?? "Alguém"}: {formatBRL(original)}{" "}
                  → <strong>{formatBRL(o.proposed_value_cents)}</strong>
                  {o.proposed_points > 0 && ` · ⭐ ${o.proposed_points}`}
                </p>
                {o.message && (
                  <p className="text-xs italic text-muted-foreground">
                    “{o.message}”
                  </p>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  disabled={pending}
                  onClick={() => run(() => respondOffer(o.id, true))}
                >
                  Aceitar
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  disabled={pending}
                  onClick={() => run(() => respondOffer(o.id, false))}
                >
                  Recusar
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={pending}
                  onClick={() =>
                    setCounterFor(counterFor === o.id ? null : o.id)
                  }
                >
                  Contra
                </Button>
              </div>
              {counterFor === o.id && (
                <div className="flex w-full flex-wrap gap-2 sm:col-span-2">
                  <input
                    className="h-9 flex-1 rounded-lg border border-border bg-background px-2 text-sm"
                    placeholder="Novo valor R$ ex: 11,00"
                    value={counterVal}
                    onChange={(e) => setCounterVal(e.target.value)}
                  />
                  <Button
                    size="sm"
                    disabled={pending}
                    onClick={() => {
                      const n = Number(
                        counterVal.replace(",", ".").replace(/[^\d.]/g, ""),
                      );
                      if (!n && n !== 0) {
                        alert("Valor inválido");
                        return;
                      }
                      const cents = Math.round(n * 100);
                      run(() =>
                        respondOffer(o.id, false, {
                          valueCents: cents,
                          message: "Contra-proposta",
                        }),
                      );
                      setCounterFor(null);
                      setCounterVal("");
                    }}
                  >
                    Enviar contra
                  </Button>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
