"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { notify } from "@/lib/actions/notifications";
import type { Role } from "@/lib/domain/types";

type Result =
  | { ok: true; count: number; totalCents: number }
  | { ok: false; error: string };

type AdvanceResult =
  | { ok: true; amountCents: number; remainingDueCents: number }
  | { ok: false; error: string };

async function getMembership(familyId: string, userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("family_members")
    .select("role")
    .eq("family_id", familyId)
    .eq("user_id", userId)
    .maybeSingle();
  return (data?.role as Role) ?? null;
}

/** Crédito aberto (adiantamentos ainda não aplicados em tarefas). */
export async function getOpenAdvanceCents(
  familyId: string,
  executorId: string,
): Promise<number> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("payment_advances")
    .select("amount_cents, applied_cents")
    .eq("family_id", familyId)
    .eq("executor_id", executorId);

  if (!data?.length) return 0;
  return data.reduce(
    (s, r) => s + Math.max(0, r.amount_cents - r.applied_cents),
    0,
  );
}

/** Mapa executor_id → crédito aberto em centavos. */
export async function getOpenAdvancesByExecutor(
  familyId: string,
): Promise<Record<string, number>> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("payment_advances")
    .select("executor_id, amount_cents, applied_cents")
    .eq("family_id", familyId);

  const map: Record<string, number> = {};
  for (const r of data ?? []) {
    const open = Math.max(0, r.amount_cents - r.applied_cents);
    if (open <= 0) continue;
    map[r.executor_id] = (map[r.executor_id] ?? 0) + open;
  }
  return map;
}

/**
 * Responsável registra adiantamento parcial (crédito) para um executor.
 * Não marca tarefas como pagas — só reduz o saldo "a pagar".
 */
export async function registerAdvance(
  familyId: string,
  executorId: string,
  amountCents: number,
  note?: string | null,
): Promise<AdvanceResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Não autenticado." };

  const role = await getMembership(familyId, user.id);
  if (role !== "responsavel") {
    return { ok: false, error: "Só o responsável pode registrar adiantamento." };
  }

  if (!Number.isFinite(amountCents) || amountCents <= 0) {
    return { ok: false, error: "Informe um valor maior que zero." };
  }

  const amount = Math.round(amountCents);

  // Devido bruto (tarefas aprovadas)
  const { data: tasks } = await supabase
    .from("tasks")
    .select("value_cents")
    .eq("family_id", familyId)
    .eq("assignee_id", executorId)
    .eq("status", "aprovada")
    .eq("swapped", false);

  const due = (tasks ?? []).reduce((s, t) => s + t.value_cents, 0);
  const openAdv = await getOpenAdvanceCents(familyId, executorId);
  const remaining = Math.max(0, due - openAdv);

  if (amount > remaining && remaining > 0) {
    return {
      ok: false,
      error: `Adiantamento maior que o saldo restante (${(remaining / 100).toFixed(2).replace(".", ",")}). Use "Pagar tudo" para o restante.`,
    };
  }
  // Se não há tarefas aprovadas ainda, ainda permite adiantamento (crédito futuro)
  // mas limita a um valor razoável implícito — sem teto extra por enquanto.

  const { error } = await supabase.from("payment_advances").insert({
    family_id: familyId,
    executor_id: executorId,
    amount_cents: amount,
    paid_by: user.id,
    note: note?.trim() || null,
  });

  if (error) return { ok: false, error: error.message };

  await notify(executorId, "payment_registered", {
    family_id: familyId,
    count: 0,
    total_cents: amount,
    title: `Adiantamento de R$ ${(amount / 100).toFixed(2).replace(".", ",")}`,
    kind: "advance",
  });

  revalidatePath("/responsavel");
  revalidatePath("/executor");
  revalidatePath("/responsavel/tarefas");

  const newRemaining = Math.max(0, remaining - amount);
  return { ok: true, amountCents: amount, remainingDueCents: newRemaining };
}

/**
 * Consome adiantamentos abertos (FIFO) e marca tarefas aprovadas como pagas.
 * Se total de crédito >= devido, zera sem precisar de dinheiro extra.
 */
async function consumeAdvances(
  familyId: string,
  executorId: string,
  amountToApply: number,
): Promise<void> {
  if (amountToApply <= 0) return;
  const supabase = await createClient();
  const { data: rows } = await supabase
    .from("payment_advances")
    .select("id, amount_cents, applied_cents")
    .eq("family_id", familyId)
    .eq("executor_id", executorId)
    .order("created_at", { ascending: true });

  let left = amountToApply;
  for (const row of rows ?? []) {
    if (left <= 0) break;
    const open = row.amount_cents - row.applied_cents;
    if (open <= 0) continue;
    const use = Math.min(open, left);
    const { error } = await supabase
      .from("payment_advances")
      .update({ applied_cents: row.applied_cents + use })
      .eq("id", row.id);
    if (error) throw new Error(error.message);
    left -= use;
  }
}

/**
 * Responsável marca como "paga" todas as tarefas aprovadas (não trocadas)
 * de um executor na família. Consome adiantamentos abertos primeiro.
 */
export async function payAllForExecutor(
  familyId: string,
  executorId: string,
): Promise<Result> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Não autenticado." };

  const role = await getMembership(familyId, user.id);
  if (role !== "responsavel") {
    return { ok: false, error: "Só o responsável pode registrar pagamento." };
  }

  const { data: tasks, error: listErr } = await supabase
    .from("tasks")
    .select("id, value_cents, title")
    .eq("family_id", familyId)
    .eq("assignee_id", executorId)
    .eq("status", "aprovada")
    .eq("swapped", false);

  if (listErr) return { ok: false, error: listErr.message };
  if (!tasks || tasks.length === 0) {
    return { ok: false, error: "Nenhuma tarefa aprovada pendente de pagamento." };
  }

  const ids = tasks.map((t) => t.id);
  const totalCents = tasks.reduce((s, t) => s + t.value_cents, 0);
  const now = new Date().toISOString();

  // Aplica crédito de adiantamentos no valor total liquidado
  try {
    await consumeAdvances(familyId, executorId, totalCents);
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Erro ao aplicar adiantamentos",
    };
  }

  const { error } = await supabase
    .from("tasks")
    .update({ status: "paga", paid_at: now })
    .in("id", ids);

  if (error) return { ok: false, error: error.message };

  await notify(executorId, "payment_registered", {
    family_id: familyId,
    count: tasks.length,
    total_cents: totalCents,
    title: `${tasks.length} tarefa(s) pagas`,
  });

  revalidatePath("/responsavel");
  revalidatePath("/executor");
  revalidatePath("/responsavel/tarefas");
  return { ok: true, count: tasks.length, totalCents };
}

/**
 * Executor confirma recebimento de todas as tarefas em status "paga".
 */
export async function confirmAllPayments(familyId: string): Promise<Result> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Não autenticado." };

  const role = await getMembership(familyId, user.id);
  if (role !== "executor") {
    return { ok: false, error: "Só o executor pode confirmar recebimento." };
  }

  const { data: tasks, error: listErr } = await supabase
    .from("tasks")
    .select("id, value_cents, created_by, title")
    .eq("family_id", familyId)
    .eq("assignee_id", user.id)
    .eq("status", "paga");

  if (listErr) return { ok: false, error: listErr.message };
  if (!tasks || tasks.length === 0) {
    return { ok: false, error: "Nenhum pagamento pendente de confirmação." };
  }

  const ids = tasks.map((t) => t.id);
  const totalCents = tasks.reduce((s, t) => s + t.value_cents, 0);
  const now = new Date().toISOString();

  const { error } = await supabase
    .from("tasks")
    .update({ status: "confirmada", payment_confirmed_at: now })
    .in("id", ids);

  if (error) return { ok: false, error: error.message };

  const creators = [...new Set(tasks.map((t) => t.created_by))];
  for (const creatorId of creators) {
    if (creatorId === user.id) continue;
    await notify(creatorId, "payment_confirmed", {
      family_id: familyId,
      count: tasks.length,
      total_cents: totalCents,
      title: `${tasks.length} pagamento(s) confirmados`,
    });
  }

  revalidatePath("/responsavel");
  revalidatePath("/executor");
  return { ok: true, count: tasks.length, totalCents };
}
