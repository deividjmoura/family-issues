import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CreateTaskFab } from "@/components/tasks/create-task-fab";
import { FamilyRealtime } from "@/components/realtime/family-realtime";
import { GameLobby } from "@/components/executor/game-lobby";
import { listMyNotifications } from "@/lib/actions/notifications";
import { listPendingOffersForFamily } from "@/lib/actions/offers";
import { getProfileNames } from "@/lib/actions/profiles";
import type { Task } from "@/lib/domain/types";
import { balanceCents, earnedCents } from "@/lib/domain/money";
import { sumPoints } from "@/lib/domain/points";

export default async function ExecutorHomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: membership } = await supabase
    .from("family_members")
    .select("family_id, role, family:families(id, name)")
    .eq("user_id", user.id)
    .eq("role", "executor")
    .limit(1)
    .maybeSingle();

  if (!membership) redirect("/onboarding");

  const family = membership.family as unknown as { id: string; name: string };
  const familyId = membership.family_id;

  const { data: allFamilyTasks } = await supabase
    .from("tasks")
    .select("*")
    .eq("family_id", familyId)
    .order("created_at", { ascending: false });

  const familyTasks = (allFamilyTasks ?? []) as Task[];
  const myTasks = familyTasks.filter((t) => t.assignee_id === user.id);
  const openBoard = familyTasks.filter(
    (t) => t.status === "criada" && !t.assignee_id,
  );

  const saldo = balanceCents(myTasks);
  const ganhos = earnedCents(myTasks);
  const notifications = await listMyNotifications();

  const active = myTasks.filter(
    (t) =>
      t.status === "atribuida" || t.status === "aguardando_verificacao",
  );
  const awaitingConfirm = myTasks.filter((t) => t.status === "paga");
  const confirmCents = awaitingConfirm.reduce((s, t) => s + t.value_cents, 0);
  const done = myTasks.filter(
    (t) =>
      t.status === "aprovada" ||
      t.status === "paga" ||
      t.status === "confirmada",
  );

  const myPoints = sumPoints(done);

  const { data: members } = await supabase
    .from("family_members")
    .select("user_id")
    .eq("family_id", familyId);
  const names = await getProfileNames((members ?? []).map((m) => m.user_id));

  const taskIds = myTasks.map((t) => t.id);
  const { data: pendingNegos } =
    taskIds.length > 0
      ? await supabase
          .from("negotiations")
          .select("task_id")
          .eq("status", "pending")
          .in("task_id", taskIds)
      : { data: [] as { task_id: string }[] };
  const pendingIds = (pendingNegos ?? []).map((n) => n.task_id);

  const { offers, taskMeta } = await listPendingOffersForFamily(familyId);

  const denom = done.length + active.length;
  const completionPct = denom
    ? Math.round((done.length / denom) * 100)
    : 0;

  return (
    <main className="w-full pb-8">
      <FamilyRealtime userId={user.id} familyId={familyId} />
      <GameLobby
        familyName={family.name}
        familyId={familyId}
        userId={user.id}
        gold={saldo}
        xp={myPoints}
        totalEarned={ganhos}
        completionPct={completionPct}
        activeCount={active.length}
        boardCount={openBoard.length}
        doneCount={done.length}
        offersCount={offers.filter((o) => o.user_id !== user.id).length}
        notifications={notifications}
        activeTasks={
          active.length ? active : myTasks.filter((t) => !done.includes(t))
        }
        boardTasks={openBoard}
        doneTasks={done}
        familyTasks={familyTasks}
        pendingIds={pendingIds}
        names={names}
        offers={offers}
        taskMeta={taskMeta}
        awaitingConfirmCount={awaitingConfirm.length}
        confirmCents={confirmCents}
      />
      <CreateTaskFab
        familyId={familyId}
        executors={[]}
        allowOpenBoard={false}
        label="Nova missão"
      />
    </main>
  );
}
