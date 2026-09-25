"use client";

import { useEffect, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import {
  payAllForExecutor,
  registerAdvance,
} from "@/lib/actions/wallet";
import { formatBRL, parseBRL } from "@/lib/domain/money";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { sfx } from "@/lib/sounds";

export function PayExecutorButton({
  familyId,
  executorId,
  executorName,
  amountCents,
  advanceCents = 0,
}: {
  familyId: string;
  executorId: string;
  executorName: string;
  /** Saldo bruto das tarefas aprovadas */
  amountCents: number;
  /** Crédito de adiantamentos já registrados */
  advanceCents?: number;
}) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [mode, setMode] = useState<"full" | "advance">("full");
  const [value, setValue] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const remaining = Math.max(0, amountCents - advanceCents);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    sfx.open();
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (amountCents <= 0 && advanceCents <= 0) return null;
  if (remaining <= 0 && amountCents <= 0) return null;

  function close() {
    if (pending) return;
    sfx.close();
    setOpen(false);
    setError(null);
  }

  function submitFull() {
    setError(null);
    startTransition(async () => {
      const res = await payAllForExecutor(familyId, executorId);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      sfx.success();
      setOpen(false);
    });
  }

  function submitAdvance() {
    setError(null);
    const cents = parseBRL(value);
    if (cents === null || cents <= 0) {
      setError("Valor inválido. Ex: 10 ou 10,50");
      return;
    }
    if (remaining > 0 && cents > remaining) {
      setError(
        `Máximo neste momento: ${formatBRL(remaining)}. Ou use "Pagar tudo".`,
      );
      return;
    }
    startTransition(async () => {
      const res = await registerAdvance(
        familyId,
        executorId,
        cents,
        note.trim() || null,
      );
      if (!res.ok) {
        setError(res.error);
        return;
      }
      sfx.success();
      setValue("");
      setNote("");
      setOpen(false);
    });
  }

  const modal =
    open && mounted
      ? createPortal(
          <div className="modal-backdrop" role="presentation" onClick={close}>
            <div
              className="modal-panel"
              role="dialog"
              aria-modal="true"
              aria-labelledby="pay-title"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-panel__head">
                <h2 id="pay-title" className="text-lg font-bold">
                  Pagamento · {executorName}
                </h2>
                <button
                  type="button"
                  className="modal-close"
                  onClick={close}
                  aria-label="Fechar"
                >
                  ×
                </button>
              </div>

              <div className="mb-4 space-y-1 text-sm">
                <p>
                  Devido (tarefas aprovadas):{" "}
                  <strong className="tabular-nums">{formatBRL(amountCents)}</strong>
                </p>
                {advanceCents > 0 && (
                  <p className="text-success">
                    Adiantamentos: −{formatBRL(advanceCents)}
                  </p>
                )}
                <p className="font-semibold">
                  Restante a pagar:{" "}
                  <span className="tabular-nums text-primary">
                    {formatBRL(remaining)}
                  </span>
                </p>
              </div>

              <div className="mb-4 flex gap-2">
                <button
                  type="button"
                  className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition ${
                    mode === "full"
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card hover:bg-muted"
                  }`}
                  onClick={() => {
                    sfx.click();
                    setMode("full");
                    setError(null);
                  }}
                >
                  Pagar tudo
                </button>
                <button
                  type="button"
                  className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition ${
                    mode === "advance"
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card hover:bg-muted"
                  }`}
                  onClick={() => {
                    sfx.click();
                    setMode("advance");
                    setError(null);
                  }}
                >
                  Adiantamento
                </button>
              </div>

              {mode === "full" ? (
                <div className="space-y-3">
                  <p className="text-xs text-muted-foreground">
                    Marca todas as tarefas aprovadas como <strong>pagas</strong>.
                    Adiantamentos abertos entram no acerto automaticamente.
                  </p>
                  {error && (
                    <p className="text-sm text-red-500" role="alert">
                      {error}
                    </p>
                  )}
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="secondary" onClick={close}>
                      Cancelar
                    </Button>
                    <Button
                      type="button"
                      disabled={pending || amountCents <= 0}
                      onClick={submitFull}
                    >
                      {pending
                        ? "Registrando…"
                        : `Paguei ${formatBRL(amountCents)}`}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs text-muted-foreground">
                    Registra um valor parcial agora. O saldo restante continua em
                    "a pagar" até o acerto completo.
                  </p>
                  <div className="space-y-1">
                    <Label htmlFor="adv-value">Valor do adiantamento (R$)</Label>
                    <Input
                      id="adv-value"
                      value={value}
                      onChange={(e) => setValue(e.target.value)}
                      placeholder={
                        remaining > 0
                          ? `ex: ${(remaining / 200).toFixed(2).replace(".", ",")}`
                          : "10,00"
                      }
                      autoFocus
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="adv-note">Observação (opcional)</Label>
                    <Input
                      id="adv-note"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="PIX, dinheiro, etc."
                    />
                  </div>
                  {error && (
                    <p className="text-sm text-red-500" role="alert">
                      {error}
                    </p>
                  )}
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="secondary" onClick={close}>
                      Cancelar
                    </Button>
                    <Button
                      type="button"
                      disabled={pending}
                      onClick={submitAdvance}
                    >
                      {pending ? "Salvando…" : "Registrar adiantamento"}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <Button
        size="sm"
        disabled={pending}
        onClick={() => {
          sfx.click();
          setMode(remaining < amountCents && remaining > 0 ? "advance" : "full");
          setOpen(true);
        }}
      >
        {advanceCents > 0
          ? `Pagar / adiantar · ${formatBRL(remaining)}`
          : `Paguei ${formatBRL(amountCents)}`}
      </Button>
      {modal}
    </>
  );
}
