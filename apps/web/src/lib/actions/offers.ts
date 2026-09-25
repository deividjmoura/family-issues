"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { canOfferPrice } from "@/lib/domain/task-machine";
import type { Role, Task, TaskOffer } from "@/lib/domain/types";
import { notify } from "@/lib/actions/notifications";

type Result =
  | { ok: true; offer?: TaskOffer }
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

/** Proposta de valor exclusiva por usuário (rebate). */
export async function proposeOffer(input: {
  taskId: string;
  valueCents: number;
  points?: number;
  message?: string;
}): Promise<Result> {
  if (!Number.isInteger(input.valueCents) || input.valueCents < 0) {
    return { ok: false, error: "Valor inválido." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Não autenticado." };

  const { data: task } = await supabase
    .from("tasks")
    .select("*")
    .eq("id", input.taskId)
    .single();
  if (!task) return { ok: false, error: "Tarefa não encontrada." };

  const role = await getMembership(task.family_id, user.id);
  if (!role) return { ok: false, error: "Sem acesso." };

  const check = canOfferPrice(task as Task, { userId: user.id, role });
  if (!check.ok) return { ok: false, error: check.error };

  const { data: existingPending, error: pendingError } = await supabase
    .from("task_offers")
    .select("id")
    .eq("task_id", input.taskId)
    .eq("user_id", user.id)
    .eq("status", "pending")
    .limit(1);

  if (pendingError) {
    return { ok: false, error: "Não foi possível verificar a negociação atual." };
  }

  if (existingPending?.length) {
    return {
      ok: false,
      error: "Você já tem uma proposta pendente nesta tarefa.",
    };
  }

  const { data: offer, error } = await supabase
    .from("task_offers")
    .insert({
      task_id: input.taskId,
      user_id: user.id,
      proposed_value_cents: input.valueCents,
      proposed_points: Math.max(0, input.points ?? (task.points as number) ?? 0),
      message: input.message?.trim() || null,
      status: "pending",
    })
    .select("*")
    .single();

  if (error || !offer) {
    return { ok: false, error: error?.message ?? "Erro ao propor." };
  }

  const target =
    task.created_by === user.id ? task.assignee_id : task.created_by;
  if (target && target !== user.id) {
    await notify(target as string, "negotiation_proposed", {
      task_id: task.id,
      title: task.title,
      proposal_text: `R$ ${(input.valueCents / 100).toFixed(2)} — ${input.message ?? "proposta de valor"}`,
      value_cents: input.valueCents,
    });
  } else if (role === "executor") {
    await notify(task.created_by, "negotiation_proposed", {
      task_id: task.id,
      title: task.title,
      proposal_text: `R$ ${(input.valueCents / 100).toFixed(2)}`,
      value_cents: input.valueCents,
    });
  }

  revalidatePath("/responsavel");
  revalidatePath("/executor");
  return { ok: true, offer: offer as TaskOffer };
}

export async function respondOffer(
  offerId: string,
  accept: boolean,
  counter?: { valueCents: number; message?: string },
): Promise<Result> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Não autenticado." };

  const { data: offer } = await supabase
    .from("task_offers")
    .select("*")
    .eq("id", offerId)
    .single();
  if (!offer) return { ok: false, error: "Oferta não encontrada." };
  if (offer.status !== "pending") {
    return { ok: false, error: "Oferta já respondida." };
  }

  const { data: task } = await supabase
    .from("tasks")
    .select("*")
    .eq("id", offer.task_id)
    .single();
  if (!task) return { ok: false, error: "Tarefa não encontrada." };

  const role = await getMembership(task.family_id, user.id);
  if (!role) return { ok: false, error: "Sem acesso." };

  // A negociação é bilateral: só participa quem criou a tarefa ou
  // quem está atribuído a ela. Quem criou a oferta não pode respondê-la;
  // a resposta deve vir do outro lado.
  const isTaskParty =
    task.created_by === user.id || task.assignee_id === user.id;
  if (!isTaskParty) {
    return { ok: false, error: "Você não participa desta negociação." };
  }

  if (offer.user_id === user.id) {
    return { ok: false, error: "Aguarde a resposta do outro lado." };
  }

  if (counter) {
    if (!Number.isInteger(counter.valueCents) || counter.valueCents < 0) {
      return { ok: false, error: "Valor da contra-proposta inválido." };
    }

    if (task.assignee_id && task.assignee_id !== offer.user_id) {
      return { ok: false, error: "A tarefa já foi assumida por outro executor." };
    }

    const { error: updateError } = await supabase
      .from("task_offers")
      .update({
        status: "countered",
        responded_by: user.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", offerId);

    if (updateError) {
      return { ok: false, error: "Não foi possível registrar a contra-proposta." };
    }

    const { data: newOffer, error } = await supabase
      .from("task_offers")
      .insert({
        task_id: offer.task_id,
        user_id: user.id,
        proposed_value_cents: counter.valueCents,
        proposed_points: offer.proposed_points,
        message: counter.message?.trim() || null,
        status: "pending",
        parent_offer_id: offerId,
      })
      .select("*")
      .single();

    if (error || !newOffer) {
      return { ok: false, error: error?.message ?? "Erro na contra-proposta." };
    }

    await notify(offer.user_id, "negotiation_answered", {
      task_id: task.id,
      title: task.title,
      accepted: false,
      proposal_text: `Contra: R$ ${(counter.valueCents / 100).toFixed(2)}`,
    });

    revalidatePath("/responsavel");
    revalidatePath("/executor");
    return { ok: true, offer: newOffer as TaskOffer };
  }

  if (accept) {
    if (task.assignee_id && task.assignee_id !== offer.user_id) {
      return { ok: false, error: "A tarefa já foi assumida por outro executor." };
    }

    const { error: updateError } = await supabase
      .from("task_offers")
      .update({
        status: "accepted",
        responded_by: user.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", offerId);

    if (updateError) {
      return { ok: false, error: "Não foi possível aceitar a proposta." };
    }

    // Aplica valor e, se aberta, atribui ao proponente (executor)
    const patch: Record<string, unknown> = {
      value_cents: offer.proposed_value_cents,
      points: offer.proposed_points,
    };
    if (!task.assignee_id && offer.user_id) {
      const { data: mem } = await supabase
        .from("family_members")
        .select("role")
        .eq("family_id", task.family_id)
        .eq("user_id", offer.user_id)
        .maybeSingle();
      if (mem?.role === "executor") {
        patch.assignee_id = offer.user_id;
        patch.status = "atribuida";
      }
    }

    let taskUpdate = supabase
      .from("tasks")
      .update(patch)
      .eq("id", task.id);

    if (task.assignee_id) {
      taskUpdate = taskUpdate.eq("assignee_id", task.assignee_id);
    } else {
      taskUpdate = taskUpdate.is("assignee_id", null);
    }

    const { data: updatedTask, error: taskUpdateError } = await taskUpdate
      .select("*")
      .maybeSingle();

    if (taskUpdateError || !updatedTask) {
      // Evita deixar a oferta como aceita se a tarefa mudou
      // entre a validação e a atualização (ex.: outro executor fez claim).
      await supabase
        .from("task_offers")
        .update({
          status: "pending",
          responded_by: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", offerId);

      return {
        ok: false,
        error: "A tarefa mudou enquanto a proposta era aceita. Tente novamente.",
      };
    }

    await notify(offer.user_id, "negotiation_answered", {
      task_id: task.id,
      title: task.title,
      accepted: true,
      value_cents: offer.proposed_value_cents,
    });
  } else {
    const { error: updateError } = await supabase
      .from("task_offers")
      .update({
        status: "rejected",
        responded_by: user.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", offerId);

    if (updateError) {
      return { ok: false, error: "Não foi possível recusar a proposta." };
    }

    await notify(offer.user_id, "negotiation_answered", {
      task_id: task.id,
      title: task.title,
      accepted: false,
    });
  }

  revalidatePath("/responsavel");
  revalidatePath("/executor");
  return { ok: true };
}

export async function listPendingOffersForFamily(familyId: string) {
  const supabase = await createClient();
  const { data: tasks } = await supabase
    .from("tasks")
    .select("id, title, value_cents, points")
    .eq("family_id", familyId);
  const ids = (tasks ?? []).map((t) => t.id);
  if (ids.length === 0) return { offers: [] as TaskOffer[], taskMeta: {} as Record<string, { title: string; value_cents: number }> };

  const { data } = await supabase
    .from("task_offers")
    .select("*")
    .in("task_id", ids)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  const taskMeta = Object.fromEntries(
    (tasks ?? []).map((t) => [
      t.id,
      { title: t.title as string, value_cents: t.value_cents as number },
    ]),
  );

  return { offers: (data ?? []) as TaskOffer[], taskMeta };
}

export async function listOffersForTask(taskId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("task_offers")
    .select("*")
    .eq("task_id", taskId)
    .order("created_at", { ascending: false })
    .limit(20);
  return (data ?? []) as TaskOffer[];
}
