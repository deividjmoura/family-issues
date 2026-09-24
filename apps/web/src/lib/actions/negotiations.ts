"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { canNegotiate } from "@/lib/domain/task-machine";
import type { Role, Task, Negotiation } from "@/lib/domain/types";
import { notify } from "@/lib/actions/notifications";

type Result =
  | { ok: true; negotiation?: Negotiation }
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

export async function proposeNegotiation(
  taskId: string,
  proposalText: string,
): Promise<Result> {
  const text = proposalText.trim();
  if (!text) return { ok: false, error: "Proposta vazia." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Não autenticado." };

  const { data: task } = await supabase
    .from("tasks")
    .select("*")
    .eq("id", taskId)
    .single();
  if (!task) return { ok: false, error: "Tarefa não encontrada." };

  const role = await getMembership(task.family_id, user.id);
  if (!role) return { ok: false, error: "Sem acesso à família." };

  const { count } = await supabase
    .from("negotiations")
    .select("id", { count: "exact", head: true })
    .eq("task_id", taskId)
    .eq("status", "pending");

  const check = canNegotiate(
    task as Task,
    { userId: user.id, role },
    (count ?? 0) > 0,
  );
  if (!check.ok) return { ok: false, error: check.error };

  const { data: neg, error } = await supabase
    .from("negotiations")
    .insert({
      task_id: taskId,
      proposed_by: user.id,
      proposal_text: text,
      status: "pending",
    })
    .select("*")
    .single();

  if (error || !neg) {
    return { ok: false, error: error?.message ?? "Erro ao propor." };
  }

  await notify(task.created_by, "negotiation_proposed", {
    task_id: taskId,
    title: task.title,
    proposal_text: text,
  });

  revalidatePath("/responsavel");
  revalidatePath("/executor");
  return { ok: true, negotiation: neg as Negotiation };
}

export async function respondNegotiation(
  negotiationId: string,
  accept: boolean,
  responseNote?: string,
): Promise<Result> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Não autenticado." };

  const { data: neg } = await supabase
    .from("negotiations")
    .select("*")
    .eq("id", negotiationId)
    .single();
  if (!neg) return { ok: false, error: "Negociação não encontrada." };
  if (neg.status !== "pending") {
    return { ok: false, error: "Negociação já respondida." };
  }

  const { data: task } = await supabase
    .from("tasks")
    .select("*")
    .eq("id", neg.task_id)
    .single();
  if (!task) return { ok: false, error: "Tarefa não encontrada." };

  const role = await getMembership(task.family_id, user.id);
  if (role !== "responsavel") {
    return { ok: false, error: "Só o responsável pode responder." };
  }

  const newStatus = accept ? "accepted" : "rejected";
  const { data: updated, error } = await supabase
    .from("negotiations")
    .update({
      status: newStatus,
      responded_by: user.id,
      responded_at: new Date().toISOString(),
      response_note: responseNote?.trim() || null,
    })
    .eq("id", negotiationId)
    .select("*")
    .single();

  if (error || !updated) {
    return { ok: false, error: error?.message ?? "Erro ao responder." };
  }

  if (accept) {
    await supabase
      .from("tasks")
      .update({
        swapped: true,
        swapped_reward: neg.proposal_text,
      })
      .eq("id", task.id);
  }

  await notify(neg.proposed_by, "negotiation_answered", {
    task_id: task.id,
    title: task.title,
    accepted: accept,
    proposal_text: neg.proposal_text,
  });

  revalidatePath("/responsavel");
  revalidatePath("/executor");
  return { ok: true, negotiation: updated as Negotiation };
}

export async function listPendingNegotiations(familyId: string) {
  const supabase = await createClient();
  const { data: tasks } = await supabase
    .from("tasks")
    .select("id")
    .eq("family_id", familyId);
  const ids = (tasks ?? []).map((t) => t.id);
  if (ids.length === 0) return [];

  const { data } = await supabase
    .from("negotiations")
    .select("*")
    .in("task_id", ids)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  return (data ?? []) as Negotiation[];
}
