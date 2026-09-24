"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { notify } from "@/lib/actions/notifications";
import type { Role } from "@/lib/domain/types";

type Result =
  | { ok: true; count: number; totalCents: number }
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

/**
 * Responsável marca como "paga" todas as tarefas aprovadas (não trocadas)
 * de um executor na família.
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

  // Notifica o(s) responsável(is) que criaram as tasks (pode ser o mesmo)
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
