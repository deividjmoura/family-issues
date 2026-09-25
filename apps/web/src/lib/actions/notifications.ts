"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { sendEmailNotification } from "@/lib/notify/email";
import { sendPushToUser } from "@/lib/notify/push";

export type NotificationType =
  | "task_assigned"
  | "task_completed"
  | "task_approved"
  | "task_rejected"
  | "payment_registered"
  | "payment_confirmed"
  | "negotiation_proposed"
  | "negotiation_answered";

export interface AppNotification {
  id: string;
  user_id: string;
  type: NotificationType | string;
  payload: Record<string, unknown>;
  read_at: string | null;
  created_at: string;
}

const PUSH_COPY: Record<
  string,
  (p: Record<string, unknown>) => { title: string; body: string }
> = {
  task_assigned: (p) => ({
    title: "Nova tarefa",
    body: String(p.title ?? "Você tem uma nova missão"),
  }),
  task_completed: (p) => ({
    title: "A verificar",
    body: String(p.title ?? "Tarefa concluída"),
  }),
  task_approved: (p) => ({
    title: "Aprovada 🎉",
    body: String(p.title ?? "Tarefa aprovada"),
  }),
  task_rejected: (p) => ({
    title: "Rejeitada",
    body: String(p.title ?? "Tarefa rejeitada"),
  }),
  payment_registered: (_p) => ({
    title: "Pagamento",
    body: "Confirme o recebimento no app",
  }),
  payment_confirmed: (_p) => ({
    title: "Confirmado",
    body: "Recebimento confirmado",
  }),
  negotiation_proposed: (p) => ({
    title: "Negociação",
    body: String(p.proposal_text ?? "Nova proposta"),
  }),
  negotiation_answered: (p) => ({
    title: "Negociação",
    body: p.accepted ? "Proposta aceita" : "Proposta recusada",
  }),
};

async function resolveUserEmail(userId: string): Promise<string | null> {
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("email")
    .eq("id", userId)
    .maybeSingle();
  if (profile && "email" in profile && profile.email) {
    return profile.email as string;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  try {
    const { createClient: createAdmin } = await import("@supabase/supabase-js");
    const admin = createAdmin(url, key);
    const { data } = await admin.auth.admin.getUserById(userId);
    return data.user?.email ?? null;
  } catch {
    return null;
  }
}

export async function notify(
  userId: string,
  type: NotificationType,
  payload: Record<string, unknown>,
): Promise<void> {
  const supabase = await createClient();
  await supabase.from("notifications").insert({
    user_id: userId,
    type,
    payload,
  });

  void (async () => {
    try {
      const email = await resolveUserEmail(userId);
      if (email) await sendEmailNotification(email, type, payload);
    } catch (e) {
      console.error("[notify email]", e);
    }
  })();

  void (async () => {
    try {
      const copy = PUSH_COPY[type]?.(payload) ?? {
        title: "Family Tasks",
        body: "Nova atualização",
      };
      await sendPushToUser(userId, {
        ...copy,
        url: "/",
      });
    } catch (e) {
      console.error("[notify push]", e);
    }
  })();
}

export async function listMyNotifications(
  limit = 30,
): Promise<AppNotification[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data ?? []) as AppNotification[];
}

export async function markNotificationRead(
  id: string,
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Não autenticado." };

  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { ok: false, error: error.message };
  revalidatePath("/responsavel");
  revalidatePath("/executor");
  return { ok: true };
}

export async function markAllNotificationsRead(): Promise<{
  ok: boolean;
  error?: string;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Não autenticado." };

  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .is("read_at", null);

  if (error) return { ok: false, error: error.message };
  revalidatePath("/responsavel");
  revalidatePath("/executor");
  return { ok: true };
}
