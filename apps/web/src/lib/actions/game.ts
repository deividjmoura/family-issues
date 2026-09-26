"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { DailyChallenge, GameAvatar, GameInventoryItem, GameItem } from "@/lib/domain/types";

export async function getGameState(userId: string) {
  const supabase = await createClient();

  const [{ data: items }, { data: inventory }, { data: avatar }, { data: tasks }, { data: purchases }] =
    await Promise.all([
      supabase.from("game_items").select("*").order("price_coins", { ascending: true }),
      supabase.from("game_inventory").select("*").eq("user_id", userId),
      supabase.from("game_avatars").select("*").eq("user_id", userId).maybeSingle(),
      supabase
        .from("tasks")
        .select("points")
        .eq("assignee_id", userId)
        .in("status", ["aprovada", "paga", "confirmada"]),
      supabase.from("game_purchases").select("price_coins").eq("user_id", userId),
    ]);

  const itemList = (items ?? []) as GameItem[];
  const itemById = new Map(itemList.map((item) => [item.id, item]));
  const inventoryList = (inventory ?? []).map((row) => ({
    ...(row as GameInventoryItem),
    item: itemById.get(row.item_id),
  }));

  const earnedCoins = (tasks ?? []).reduce(
    (sum, task) => sum + Math.max(0, Number(task.points ?? 0)) * 10,
    0,
  );
  const spentCoins = (purchases ?? []).reduce(
    (sum, purchase) => sum + Math.max(0, Number(purchase.price_coins ?? 0)),
    0,
  );

  return {
    items: itemList,
    inventory: inventoryList,
    avatar: (avatar as GameAvatar | null) ?? {
      user_id: userId,
      config: {},
    },
    coins: Math.max(0, earnedCoins - spentCoins),
  };
}

export async function getTodayChallenges(): Promise<DailyChallenge[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("daily_challenges")
    .select("id, challenge_key, category, title, description, value_cents, points, icon")
    .eq("active", true)
    .order("challenge_key", { ascending: true });
  return (data ?? []) as DailyChallenge[];
}

export async function purchaseGameItem(itemId: string) {
  const supabase = await createClient();
  const { data: result, error } = await supabase.rpc("purchase_game_item", {
    p_item_id: itemId,
  });

  if (error) return { ok: false, error: "Não foi possível concluir a compra." };
  const row = Array.isArray(result) ? result[0] : result;
  if (!row?.ok) return { ok: false, error: row?.message ?? "Compra recusada." };

  revalidatePath("/executor");
  revalidatePath("/responsavel");
  return { ok: true, balance: Number(row.balance ?? 0), message: row.message };
}

export async function equipGameItem(itemId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Não autenticado." };

  const { data: owned } = await supabase
    .from("game_inventory")
    .select("item_id")
    .eq("user_id", user.id)
    .eq("item_id", itemId)
    .maybeSingle();
  if (!owned) return { ok: false, error: "Você ainda não possui este item." };

  const { data: item } = await supabase
    .from("game_items")
    .select("slot, slug")
    .eq("id", itemId)
    .single();
  if (!item) return { ok: false, error: "Item não encontrado." };

  const { data: current } = await supabase
    .from("game_avatars")
    .select("config")
    .eq("user_id", user.id)
    .maybeSingle();

  const config = {
    ...((current?.config as Record<string, string> | null) ?? {}),
    [item.slot]: item.slug,
  };

  const { error } = await supabase
    .from("game_avatars")
    .upsert({ user_id: user.id, config, updated_at: new Date().toISOString() });

  if (error) return { ok: false, error: "Não foi possível atualizar o personagem." };

  revalidatePath("/executor");
  revalidatePath("/responsavel");
  return { ok: true };
}

export async function giftGameItem(
  recipientId: string,
  itemId: string,
  message?: string,
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Não autenticado." };

  const { data: result, error } = await supabase.rpc("gift_game_item", {
    p_recipient_id: recipientId,
    p_item_id: itemId,
    p_message: message?.trim() || null,
  });

  if (error) return { ok: false, error: "Não foi possível enviar o presente." };
  const row = Array.isArray(result) ? result[0] : result;
  if (!row?.ok) return { ok: false, error: row?.message ?? "Presente recusado." };

  revalidatePath("/responsavel");
  revalidatePath("/executor");
  return { ok: true, message: row.message };
}

export async function getFamilyGameProfiles(familyId: string) {
  const supabase = await createClient();
  const { data: members } = await supabase
    .from("family_members")
    .select("user_id, role")
    .eq("family_id", familyId)
    .eq("role", "executor");

  const ids = (members ?? []).map((m) => m.user_id);
  if (!ids.length) return [];

  const [{ data: profiles }, { data: avatars }, { data: inventory }, { data: items }, { data: tasks }, { data: purchases }] =
    await Promise.all([
      supabase.from("profiles").select("id, full_name").in("id", ids),
      supabase.from("game_avatars").select("*").in("user_id", ids),
      supabase.from("game_inventory").select("*").in("user_id", ids),
      supabase.from("game_items").select("*"),
      supabase.from("tasks").select("assignee_id, points").in("assignee_id", ids).in("status", ["aprovada", "paga", "confirmada"]),
      supabase.from("game_purchases").select("user_id, price_coins").in("user_id", ids),
    ]);

  const names = new Map((profiles ?? []).map((p) => [p.id, p.full_name || "Executor"]));
  const avatarMap = new Map((avatars ?? []).map((a) => [a.user_id, a]));
  const itemMap = new Map(((items ?? []) as GameItem[]).map((item) => [item.slug, item]));

  const earnedByUser = new Map<string, number>();
  for (const task of tasks ?? []) earnedByUser.set(task.assignee_id, (earnedByUser.get(task.assignee_id) ?? 0) + Number(task.points ?? 0));
  const spentByUser = new Map<string, number>();
  for (const purchase of purchases ?? []) spentByUser.set(purchase.user_id, (spentByUser.get(purchase.user_id) ?? 0) + Number(purchase.price_coins ?? 0));

  return ids.map((id) => ({
    userId: id,
    name: names.get(id) ?? "Executor",
    avatar: (avatarMap.get(id) as GameAvatar | undefined) ?? { user_id: id, config: {} },
    inventoryCount: (inventory ?? []).filter((item) => item.user_id === id).reduce(
      (sum, item) => sum + Number(item.quantity ?? 0),
      0,
    ),
    xp: earnedByUser.get(id) ?? 0,
    coins: Math.max(0, (earnedByUser.get(id) ?? 0) * 10 - (spentByUser.get(id) ?? 0)),
    itemMap: Object.fromEntries(itemMap),
  }));
}
