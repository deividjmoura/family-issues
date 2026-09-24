"use client";

import { useTransition } from "react";
import { confirmAllPayments } from "@/lib/actions/wallet";
import { formatBRL } from "@/lib/domain/money";
import { Button } from "@/components/ui/button";

export function ConfirmAllButton({
  familyId,
  amountCents,
  count,
}: {
  familyId: string;
  amountCents: number;
  count: number;
}) {
  const [pending, startTransition] = useTransition();

  if (count <= 0) return null;

  return (
    <Button
      size="lg"
      className="w-full"
      disabled={pending}
      onClick={() => {
        if (
          !window.confirm(
            `Confirmar recebimento de ${formatBRL(amountCents)} (${count} tarefa(s))?`,
          )
        ) {
          return;
        }
        startTransition(async () => {
          const res = await confirmAllPayments(familyId);
          if (!res.ok) alert(res.error);
          else
            alert(
              `🎉 Confirmado! ${res.count} tarefa(s), ${formatBRL(res.totalCents)}.`,
            );
        });
      }}
    >
      {pending
        ? "Confirmando…"
        : `Confirmei recebimento · ${formatBRL(amountCents)}`}
    </Button>
  );
}
