"use server";

import { createClient } from "@/lib/supabase/server";
import type { Family, FamilyMember, Role } from "@/lib/domain/types";

export async function getMyMemberships(): Promise<
  (FamilyMember & { family: Family })[]
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("family_members")
    .select("*, family:families(*)")
    .eq("user_id", user.id);

  return (data ?? []) as (FamilyMember & { family: Family })[];
}

export async function getFamilyMembers(
  familyId: string,
): Promise<FamilyMember[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("family_members")
    .select("*")
    .eq("family_id", familyId);
  return (data ?? []) as FamilyMember[];
}

export async function getCurrentRole(
  familyId: string,
): Promise<Role | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("family_members")
    .select("role")
    .eq("family_id", familyId)
    .eq("user_id", user.id)
    .maybeSingle();
  return (data?.role as Role) ?? null;
}
