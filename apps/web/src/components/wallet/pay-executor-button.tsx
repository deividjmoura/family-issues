"use client";

import { useTransition } from "react";
import { payAllForExecutor } from "@/lib/actions/wallet";
import { formatBRL } from "@/lib/domain/money";
import { Button } from "@/components/ui/button";

export function PayExecutorButton({
  familyId,
  executorId,
  executorName,
  amountCents,
}: {
  familyId: string;
  executorId: string;
  executorName: string;
  amountCents: number;
}) {
  const [pending, startTransition] = useTransition();

  if (amountCents <= 0) return null;

  return (
    <Button
      size="sm"
      disabled={pending}
      onClick={() => {
        if (
          !window.confirm(
            `Registrar pagamento de ${formatBRL(amountCents)} para ${executorName}?`,
          )
        ) {
          return;
        }
        startTransition(async () => {
          const res = await payAllForExecutor(familyId, executorId);
          if (!res.ok) alert(res.error);
          else
            alert(
              `Pagamento registrado: ${res.count} tarefa(s), ${formatBRL(res.totalCents)}.`,
            );
        });
      }}
    >
      {pending ? "Pagando…" : `Paguei ${formatBRL(amountCents)}`}
    </Button>
  );
}
