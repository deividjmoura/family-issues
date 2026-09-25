"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { canTransition, type TaskAction } from "@/lib/domain/task-machine";
import type { Role, Task } from "@/lib/domain/types";
import { notify, type NotificationType } from "@/lib/actions/notifications";

type ActionResult =
  | { ok: true; task?: Task }
  | { ok: false; error: string };

async function getMembership(familyId: string, userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("family_members")
    .select("role")
    .eq("family_id", familyId)
    .eq("user_id", userId)
    .maybeSingle();
  if (error || !data) return null;
  return data.role as Role;
}

async function getTask(taskId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("id", taskId)
    .single();
  if (error || !data) return null;
  return data as Task;
}

const ACTION_NOTIFY: Partial<
  Record<
    TaskAction,
    { type: NotificationType; to: "assignee" | "creator" }
  >
> = {
  complete: { type: "task_completed", to: "creator" },
  approve: { type: "task_approved", to: "assignee" },
  reject: { type: "task_rejected", to: "assignee" },
  pay: { type: "payment_registered", to: "assignee" },
  confirm_payment: { type: "payment_confirmed", to: "creator" },
};

export async function createTask(input: {
  familyId: string;
  title: string;
  description?: string;
  valueCents: number;
  points?: number;
  paymentDueDate?: string;
  assigneeId?: string | null;
}): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Não autenticado." };

  if (!input.title.trim()) return { ok: false, error: "Título obrigatório." };
  if (!Number.isInteger(input.valueCents) || input.valueCents < 0) {
    return { ok: false, error: "Valor inválido." };
  }
  let points = Math.max(0, Math.floor(input.points ?? 0));
  if (points === 0) {
    points = Math.max(1, Math.round(input.valueCents / 100));
  }

  const role = await getMembership(input.familyId, user.id);
  if (!role) return { ok: false, error: "Você não é membro desta família." };

  let assigneeId: string | null = input.assigneeId?.trim() || null;
  let status: "criada" | "atribuida" = "criada";

  if (assigneeId) {
    const { data: assigneeMem } = await supabase
      .from("family_members")
      .select("role")
      .eq("family_id", input.familyId)
      .eq("user_id", assigneeId)
      .maybeSingle();
    if (!assigneeMem) {
      return { ok: false, error: "Executor precisa ser da mesma família." };
    }
    status = "atribuida";
  }

  if (role === "executor" && !assigneeId) {
    assigneeId = user.id;
    status = "atribuida";
  }

  const { data: task, error } = await supabase
    .from("tasks")
    .insert({
      family_id: input.familyId,
      created_by: user.id,
      title: input.title.trim(),
      description: input.description?.trim() || null,
      value_cents: input.valueCents,
      points,
      payment_due_date: input.paymentDueDate || null,
      assignee_id: assigneeId,
      status,
    })
    .select("*")
    .single();

  if (error || !task) {
    return { ok: false, error: error?.message ?? "Erro ao criar tarefa." };
  }

  if (assigneeId && assigneeId !== user.id) {
    await notify(assigneeId, "task_assigned", {
      task_id: task.id,
      title: task.title,
      value_cents: task.value_cents,
      points: task.points,
    });
  }

  revalidatePath("/responsavel");
  revalidatePath("/executor");
  return { ok: true, task: task as Task };
}

export async function claimTask(taskId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Não autenticado." };

  const task = await getTask(taskId);
  if (!task) return { ok: false, error: "Tarefa não encontrada." };

  const role = await getMembership(task.family_id, user.id);
  if (!role) return { ok: false, error: "Você não é membro desta família." };

  const check = canTransition(task, "claim", { userId: user.id, role });
  if (!check.ok) return { ok: false, error: check.error };

  const { data: updated, error } = await supabase
    .from("tasks")
    .update({
      assignee_id: user.id,
      status: "atribuida",
    })
    .eq("id", taskId)
    .is("assignee_id", null)
    .select("*")
    .single();

  if (error || !updated) {
    return { ok: false, error: error?.message ?? "Não foi possível assumir." };
  }

  if (task.created_by !== user.id) {
    await notify(task.created_by, "task_assigned", {
      task_id: task.id,
      title: task.title,
      claimed_by: user.id,
    });
  }

  revalidatePath("/responsavel");
  revalidatePath("/executor");
  return { ok: true, task: updated as Task };
}

async function transitionTask(
  taskId: string,
  action: TaskAction,
  extra: Record<string, unknown> = {},
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Não autenticado." };

  const task = await getTask(taskId);
  if (!task) return { ok: false, error: "Tarefa não encontrada." };

  const role = await getMembership(task.family_id, user.id);
  if (!role) return { ok: false, error: "Você não é membro desta família." };

  const check = canTransition(task, action, { userId: user.id, role });
  if (!check.ok) return { ok: false, error: check.error };

  const patch: Record<string, unknown> = {
    status: check.to,
    ...extra,
  };

  if (action === "complete" && !task.assignee_id) {
    patch.assignee_id = user.id;
  }

  if (action === "complete") {
    patch.completed_at = new Date().toISOString();
  }
  if (action === "approve") {
    patch.verified_at = new Date().toISOString();
    patch.verified_by = user.id;
    patch.rejection_reason = null;
  }
  if (action === "reject") {
    patch.verified_at = new Date().toISOString();
    patch.verified_by = user.id;
  }
  if (action === "pay") {
    patch.paid_at = new Date().toISOString();
  }
  if (action === "confirm_payment") {
    patch.payment_confirmed_at = new Date().toISOString();
  }
  if (action === "reopen") {
    patch.completed_at = null;
    patch.verified_at = null;
    patch.verified_by = null;
    patch.rejection_reason = null;
    patch.proof_image_url = null;
    patch.completion_note = null;
  }

  const { data: updated, error } = await supabase
    .from("tasks")
    .update(patch)
    .eq("id", taskId)
    .select("*")
    .single();

  if (error || !updated) {
    return { ok: false, error: error?.message ?? "Erro ao atualizar tarefa." };
  }

  const meta = ACTION_NOTIFY[action];
  if (meta) {
    const targetId =
      meta.to === "assignee"
        ? (updated.assignee_id as string | null) ?? task.assignee_id
        : task.created_by;
    if (targetId && targetId !== user.id) {
      await notify(targetId, meta.type, {
        task_id: task.id,
        title: task.title,
        value_cents: task.value_cents,
        points: task.points,
        status: check.to,
      });
    }
  }

  revalidatePath("/responsavel");
  revalidatePath("/executor");
  return { ok: true, task: updated as Task };
}

export async function markCompleted(
  taskId: string,
  proofImageUrl?: string | null,
  completionNote?: string | null,
): Promise<ActionResult> {
  return transitionTask(taskId, "complete", {
    proof_image_url: proofImageUrl?.trim() || null,
    completion_note: completionNote?.trim() || null,
  });
}

export async function approveTask(taskId: string): Promise<ActionResult> {
  return transitionTask(taskId, "approve");
}

export async function rejectTask(
  taskId: string,
  reason?: string,
): Promise<ActionResult> {
  return transitionTask(taskId, "reject", {
    rejection_reason: reason?.trim() || null,
  });
}

export async function reopenTask(taskId: string): Promise<ActionResult> {
  return transitionTask(taskId, "reopen");
}

export async function registerPayment(taskId: string): Promise<ActionResult> {
  return transitionTask(taskId, "pay");
}

export async function confirmPayment(taskId: string): Promise<ActionResult> {
  return transitionTask(taskId, "confirm_payment");
}
