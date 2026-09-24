"use server";

import { createClient } from "@/lib/supabase/server";

export async function getProfileNames(
  userIds: string[],
): Promise<Record<string, string>> {
  if (userIds.length === 0) return {};
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, full_name")
    .in("id", userIds);

  const map: Record<string, string> = {};
  for (const row of data ?? []) {
    map[row.id] = row.full_name || row.id.slice(0, 8) + "…";
  }
  for (const id of userIds) {
    if (!map[id]) map[id] = id.slice(0, 8) + "…";
  }
  return map;
}
