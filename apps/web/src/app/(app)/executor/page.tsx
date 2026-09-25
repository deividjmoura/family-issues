import { redirect } from "next/navigation";
import type { CSSProperties } from "react";
import { createClient } from "@/lib/supabase/server";
import { TaskList } from "@/components/tasks/task-list";
import { CreateTaskFab } from "@/components/tasks/create-task-fab";
import { RealtimeNotifications } from "@/components/notifications/realtime-badge";
import { ConfirmAllButton } from "@/components/wallet/confirm-all-button";
import { AppHeader } from "@/components/layout/app-header";
import { CyberNav } from "@/components/layout/cyber-nav";
import { Leaderboard } from "@/components/leaderboard/leaderboard";
import { PendingOffers } from "@/components/offers/pending-offers";
import { listMyNotifications } from "@/lib/actions/notifications";
import { listPendingOffersForFamily } from "@/lib/actions/offers";
import { getProfileNames } from "@/lib/actions/profiles";
import type { Task } from "@/lib/domain/types";
import { formatBRL, balanceCents, earnedCents } from "@/lib/domain/money";
import { sumPoints } from "@/lib/domain/points";

function bar(height: string): CSSProperties {
  return { ["--height" as string]: height } as CSSProperties;
}

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
    <main className="mx-auto w-full max-w-3xl space-y-5 px-3 py-6 pb-28 sm:px-6 sm:py-8">
      <RealtimeNotifications userId={user.id} />
      <CyberNav title="CYBER MISSION LOBBY" />

      <AppHeader
        badge="⚔️ MISSION LOBBY"
        title="Suas missões"
        subtitle={family.name}
        notifications={notifications}
      />

      <div className="hud-row">
        <div className="hud-chip glow-coin">
          <span className="cyber-corner" aria-hidden />
          <p className="text-[10px] font-bold uppercase tracking-widest text-coin">
            💰 Gold
          </p>
          <p className="mt-1 text-xl font-black tabular-nums text-coin sm:text-2xl">
            {formatBRL(saldo)}
          </p>
          <p className="mt-0.5 text-[10px] text-muted-foreground">a receber</p>
          <div className="status-bar">
            <div
              className="status-bar-fill warning"
              style={{ width: `${Math.min(100, saldo > 0 ? 70 : 15)}%` }}
            />
          </div>
        </div>
        <div className="hud-chip glow-xp">
          <span className="cyber-corner" aria-hidden />
          <p className="text-[10px] font-bold uppercase tracking-widest text-xp">
            ⭐ XP
          </p>
          <p className="mt-1 text-xl font-black tabular-nums text-xp sm:text-2xl">
            {myPoints}
          </p>
          <div className="status-bar">
            <div
              className="status-bar-fill"
              style={{
                width: `${Math.min(100, Math.max(12, myPoints % 100 || 12))}%`,
                background: "var(--neon-purple)",
              }}
            />
          </div>
        </div>
        <div className="hud-chip">
          <span className="cyber-corner" aria-hidden />
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            🏆 Total
          </p>
          <p className="mt-1 text-xl font-black tabular-nums sm:text-2xl">
            {formatBRL(ganhos)}
          </p>
          <p className="mt-0.5 text-[10px] text-muted-foreground">confirmado</p>
          <div className="card-chart" aria-hidden>
            <div className="chart-bar" style={bar("40%")} />
            <div className="chart-bar" style={bar("70%")} />
            <div className="chart-bar" style={bar("50%")} />
            <div className="chart-bar" style={bar("85%")} />
            <div className="chart-bar" style={bar("60%")} />
          </div>
        </div>
      </div>

      <div className="cyber-card glassmorphism p-4">
        <p className="card-title text-xs">System Performance</p>
        <p className="text-2xl font-black text-[var(--neon-cyan)]">
          {completionPct}%
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          CONCLUSÃO · {done.length} concluídas · {active.length} ativas
        </p>
        <div className="card-chart" aria-hidden>
          <div className="chart-bar" style={bar("35%")} />
          <div className="chart-bar" style={bar("55%")} />
          <div className="chart-bar" style={bar("45%")} />
          <div className="chart-bar" style={bar("75%")} />
          <div className="chart-bar" style={bar("65%")} />
          <div className="chart-bar" style={bar("90%")} />
          <div className="chart-bar" style={bar("50%")} />
        </div>
      </div>

      {awaitingConfirm.length > 0 && (
        <div className="cyber-card border-2 border-[var(--console-green)]/50 p-4">
          <p className="mb-3 text-sm text-muted-foreground">
            💵 Pagamento na conta — confirme o loot:
          </p>
          <ConfirmAllButton
            familyId={familyId}
            amountCents={confirmCents}
            count={awaitingConfirm.length}
          />
        </div>
      )}

      <Leaderboard
        tasks={familyTasks}
        nameByUserId={names}
        title="🏆 Ranking"
      />

      {offers.length > 0 && (
        <PendingOffers
          offers={offers}
          taskMeta={taskMeta}
          nameByUserId={names}
          currentUserId={user.id}
        />
      )}

      {openBoard.length > 0 && (
        <section className="space-y-3">
          <h2 className="flex items-center gap-2 text-lg font-black tracking-tight">
            ◆ QUEST BOARD
            <span className="rounded-full border border-warning/40 bg-warning/15 px-2 text-xs font-bold text-warning">
              {openBoard.length}
            </span>
          </h2>
          <TaskList
            tasks={openBoard}
            role="executor"
            userId={user.id}
            pendingNegotiationTaskIds={pendingIds}
            nameByUserId={names}
          />
        </section>
      )}

      <section className="space-y-3">
        <h2 className="text-lg font-black tracking-tight">▶ ACTIVE QUESTS</h2>
        <TaskList
          tasks={
            active.length
              ? active
              : myTasks.filter((t) => !done.includes(t))
          }
          role="executor"
          userId={user.id}
          pendingNegotiationTaskIds={pendingIds}
          nameByUserId={names}
        />
      </section>

      {done.length > 0 && (
        <section className="space-y-3 opacity-75">
          <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
            Completed
          </h2>
          <TaskList
            tasks={done}
            role="executor"
            userId={user.id}
            pendingNegotiationTaskIds={pendingIds}
            nameByUserId={names}
          />
        </section>
      )}

      <CreateTaskFab
        familyId={familyId}
        executors={[]}
        allowOpenBoard={false}
        label="Nova missão"
      />
    </main>
  );
}
