"use client";

import { useTransition } from "react";
import { proposeOffer } from "@/lib/actions/offers";
import { Button } from "@/components/ui/button";

export function ProposeOfferButton({
  taskId,
  currentValueCents,
}: {
  taskId: string;
  currentValueCents: number;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      size="sm"
      variant="secondary"
      disabled={pending}
      onClick={() => {
        const raw = window.prompt(
          `Propor valor (R$). Atual: ${(currentValueCents / 100).toFixed(2)}`,
          (currentValueCents / 100).toFixed(2),
        );
        if (raw == null) return;
        const n = Number(raw.replace(",", ".").replace(/[^\d.]/g, ""));
        if (Number.isNaN(n) || n < 0) {
          alert("Valor inválido");
          return;
        }
        const msg =
          window.prompt("Mensagem (opcional)", "Faço por esse valor") ?? "";
        startTransition(async () => {
          const res = await proposeOffer({
            taskId,
            valueCents: Math.round(n * 100),
            message: msg || undefined,
          });
          if (!res.ok) alert(res.error);
        });
      }}
    >
      Propor valor
    </Button>
  );
}
