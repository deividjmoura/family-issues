"use client";

import { useState, useTransition } from "react";
import { createTask } from "@/lib/actions/tasks";
import { parseBRL } from "@/lib/domain/money";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface ExecutorOption {
  user_id: string;
  label: string;
}

export function CreateTaskForm({
  familyId,
  executors,
  allowOpenBoard = true,
}: {
  familyId: string;
  executors: ExecutorOption[];
  /** Se true, assignee opcional (quadro aberto) */
  allowOpenBoard?: boolean;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [value, setValue] = useState("");
  const [points, setPoints] = useState("10");
  const [assigneeId, setAssigneeId] = useState("");
  const [due, setDue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setOk(null);
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
      setOk(
        assigneeId
          ? "Tarefa criada e atribuída!"
          : "Tarefa no quadro aberto — alguém pode assumir.",
      );
      setTitle("");
      setDescription("");
      setValue("");
      setPoints("10");
      setDue("");
      setAssigneeId("");
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nova tarefa</CardTitle>
        <CardDescription>
          {allowOpenBoard
            ? "Pode deixar sem executor: fica no quadro para alguém assumir"
            : "Crie e atribua"}
        </CardDescription>
      </CardHeader>
      <form onSubmit={onSubmit}>
        <CardContent className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="title">Título</Label>
            <Input
              id="title"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Lavar a louça"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="desc">Descrição</Label>
            <Input
              id="desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="space-y-1">
              <Label htmlFor="value">Valor (R$)</Label>
              <Input
                id="value"
                required
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="10,00"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="points">Pontos (ranking)</Label>
              <Input
                id="points"
                type="number"
                min={0}
                value={points}
                onChange={(e) => setPoints(e.target.value)}
              />
            </div>
            <div className="space-y-1 sm:col-span-1 col-span-2">
              <Label htmlFor="due">Pagamento previsto</Label>
              <Input
                id="due"
                type="date"
                value={due}
                onChange={(e) => setDue(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="assignee">
              Executor {allowOpenBoard && "(opcional)"}
            </Label>
            <select
              id="assignee"
              className="flex h-10 w-full rounded-lg border border-border bg-card px-3 text-sm"
              value={assigneeId}
              onChange={(e) => setAssigneeId(e.target.value)}
            >
              <option value="">
                {allowOpenBoard
                  ? "— Quadro aberto (qualquer um assume) —"
                  : "Selecione"}
              </option>
              {executors.map((ex) => (
                <option key={ex.user_id} value={ex.user_id}>
                  {ex.label}
                </option>
              ))}
            </select>
          </div>
          {error && (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          )}
          {ok && <p className="text-sm text-green-600">{ok}</p>}
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={pending}>
            {pending ? "Criando…" : "Criar tarefa"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
