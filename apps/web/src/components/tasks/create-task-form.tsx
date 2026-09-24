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
}: {
  familyId: string;
  executors: ExecutorOption[];
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [value, setValue] = useState("");
  const [assigneeId, setAssigneeId] = useState(executors[0]?.user_id ?? "");
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
    if (!assigneeId) {
      setError("Selecione um executor.");
      return;
    }
    startTransition(async () => {
      const res = await createTask({
        familyId,
        title,
        description,
        valueCents: cents,
        paymentDueDate: due || undefined,
        assigneeId,
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setOk("Tarefa criada!");
      setTitle("");
      setDescription("");
      setValue("");
      setDue("");
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nova tarefa</CardTitle>
        <CardDescription>Crie e atribua a um executor</CardDescription>
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
          <div className="grid grid-cols-2 gap-3">
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
            <Label htmlFor="assignee">Executor</Label>
            <select
              id="assignee"
              className="flex h-10 w-full rounded-lg border border-border bg-card px-3 text-sm"
              value={assigneeId}
              onChange={(e) => setAssigneeId(e.target.value)}
              required
            >
              {executors.length === 0 && (
                <option value="">Nenhum executor na família</option>
              )}
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
          <Button type="submit" disabled={pending || executors.length === 0}>
            {pending ? "Criando…" : "Criar tarefa"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
