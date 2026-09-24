/**
 * Dinheiro sempre em centavos inteiros (docs/domain.md — regra 1).
 */
import type { Task } from "./types";

const BRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

/** 1500 → "R$ 15,00" */
export function formatBRL(cents: number): string {
  return BRL.format(cents / 100);
}

/**
 * "15", "15,5", "15,50", "R$ 1.234,56" → centavos. Retorna null se inválido ou negativo.
 */
export function parseBRL(input: string): number | null {
  const cleaned = input.replace(/R\$\s?/i, "").replace(/\s/g, "").replace(/\./g, "").replace(",", ".");
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return null;
  return Math.round(Number(cleaned) * 100);
}

/**
 * Saldo do executor (decisão agent-arena-2, ver docs/agent-log/002):
 *   saldo a receber = Σ value_cents das tasks `aprovada` + `paga` (pagamento ainda não confirmado)
 *   ignorando tasks com `swapped = true` (recompensa virou experiência).
 * Quando o executor confirma, a task vira `confirmada` e sai do saldo → saldo "zera" naquele ciclo.
 */
export function balanceCents(
  tasks: Pick<Task, "status" | "value_cents" | "swapped">[],
): number {
  return tasks
    .filter((t) => !t.swapped && (t.status === "aprovada" || t.status === "paga"))
    .reduce((sum, t) => sum + t.value_cents, 0);
}

/** Total já recebido (histórico): tasks confirmadas e não trocadas. */
export function earnedCents(
  tasks: Pick<Task, "status" | "value_cents" | "swapped">[],
): number {
  return tasks
    .filter((t) => !t.swapped && t.status === "confirmada")
    .reduce((sum, t) => sum + t.value_cents, 0);
}
