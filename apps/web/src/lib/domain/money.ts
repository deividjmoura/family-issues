/** Dinheiro sempre em centavos inteiros. */
import type { Task } from "./types";

const BRL = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export function formatBRL(cents: number): string {
  return BRL.format(cents / 100);
}

export function parseBRL(input: string): number | null {
  const cleaned = input
    .replace(/R\$\s?/i, "")
    .replace(/\s/g, "")
    .replace(/\./g, "")
    .replace(",", ".");
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return null;
  return Math.round(Number(cleaned) * 100);
}

export function balanceCents(
  tasks: Pick<Task, "status" | "value_cents" | "swapped">[],
): number {
  return tasks
    .filter(
      (t) =>
        !t.swapped && (t.status === "aprovada" || t.status === "paga"),
    )
    .reduce((sum, t) => sum + t.value_cents, 0);
}

export function earnedCents(
  tasks: Pick<Task, "status" | "value_cents" | "swapped">[],
): number {
  return tasks
    .filter((t) => !t.swapped && t.status === "confirmada")
    .reduce((sum, t) => sum + t.value_cents, 0);
}
