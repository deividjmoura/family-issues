"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

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
