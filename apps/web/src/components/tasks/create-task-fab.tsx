"use client";

import { useEffect, useState, useTransition } from "react";
import { createTask } from "@/lib/actions/tasks";
import { parseBRL } from "@/lib/domain/money";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ExecutorOption {
  user_id: string;
  label: string;
}

export function CreateTaskFab({
  familyId,
  executors = [],
  allowOpenBoard = true,
  label = "Nova tarefa",
}: {
  familyId: string;
  executors?: ExecutorOption[];
  allowOpenBoard?: boolean;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [value, setValue] = useState("");
  const [points, setPoints] = useState("10");
  const [assigneeId, setAssigneeId] = useState("");
  const [due, setDue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  function reset() {
    setTitle("");
    setDescription("");
    setValue("");
    setPoints("10");
    setAssigneeId("");
    setDue("");
    setError(null);
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const cents = parseBRL(value);
    if (cents === null) {
      setError("Valor inválido. Ex: 10 ou 10,50");
      return;
    }
    const pts = Math.max(0, parseInt(points || "0", 10) || 0);
    startTransition(async () => {
      const res = await createTask({
        familyId,
        title,
        description,
        valueCents: cents,
        points: pts,
        paymentDueDate: due || undefined,
        assigneeId: assigneeId || null,
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      reset();
      setOpen(false);
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fab-create"
        aria-label={label}
      >
        <span className="fab-create__plus">+</span>
        <span className="fab-create__label">{label}</span>
      </button>

      {open && (
        <div
          className="modal-backdrop"
          onClick={() => setOpen(false)}
          role="presentation"
        >
          <div
            className="modal-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-task-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-panel__head">
              <h2 id="create-task-title" className="text-lg font-bold">
                {label}
              </h2>
              <button
                type="button"
                className="modal-close"
                onClick={() => setOpen(false)}
                aria-label="Fechar"
              >
                ×
              </button>
            </div>
            <p className="mb-4 text-xs text-muted-foreground">
              {allowOpenBoard
                ? "Sem executor = fica no quadro para alguém assumir."
                : "Sua missão será enviada para verificação."}
            </p>
            <form onSubmit={onSubmit} className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="fab-title">Título</Label>
                <Input
                  id="fab-title"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Lavar a louça"
                  autoFocus
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="fab-desc">Descrição</Label>
                <Input
                  id="fab-desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="fab-value">Valor (R$)</Label>
                  <Input
                    id="fab-value"
                    required
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder="10,00"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="fab-pts">Pontos</Label>
                  <Input
                    id="fab-pts"
                    type="number"
                    min={0}
                    value={points}
                    onChange={(e) => setPoints(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="fab-due">Pagamento previsto</Label>
                <Input
                  id="fab-due"
                  type="date"
                  value={due}
                  onChange={(e) => setDue(e.target.value)}
                />
              </div>
              {allowOpenBoard && (
                <div className="space-y-1">
                  <Label htmlFor="fab-assignee">Executor (opcional)</Label>
                  <select
                    id="fab-assignee"
                    className="flex h-10 w-full rounded-lg border border-border bg-card px-3 text-sm"
                    value={assigneeId}
                    onChange={(e) => setAssigneeId(e.target.value)}
                  >
                    <option value="">— Quadro aberto —</option>
                    {executors.map((ex) => (
                      <option key={ex.user_id} value={ex.user_id}>
                        {ex.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              {error && (
                <p className="text-sm text-red-500" role="alert">
                  {error}
                </p>
              )}
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={pending}>
                  {pending ? "Criando…" : "Criar"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
