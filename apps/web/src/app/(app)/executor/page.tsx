import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TaskList } from "@/components/tasks/task-list";
import { NotificationList } from "@/components/notifications/notification-list";
import { RealtimeNotifications } from "@/components/notifications/realtime-badge";
import { ConfirmAllButton } from "@/components/wallet/confirm-all-button";
import { AppHeader } from "@/components/layout/app-header";
import { listMyNotifications } from "@/lib/actions/notifications";
import type { Task } from "@/lib/domain/types";
import { formatBRL, balanceCents, earnedCents } from "@/lib/domain/money";

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

  const { data: tasks } = await supabase
    .from("tasks")
    .select("*")
    .eq("family_id", familyId)
    .eq("assignee_id", user.id)
    .order("created_at", { ascending: false });

  const taskList = (tasks ?? []) as Task[];
  const saldo = balanceCents(taskList);
  const ganhos = earnedCents(taskList);
  const notifications = await listMyNotifications();

  const active = taskList.filter(
    (t) =>
      t.status === "atribuida" || t.status === "aguardando_verificacao",
  );
  const awaitingConfirm = taskList.filter((t) => t.status === "paga");
  const confirmCents = awaitingConfirm.reduce((s, t) => s + t.value_cents, 0);
  const done = taskList.filter(
    (t) =>
      t.status === "aprovada" ||
      t.status === "paga" ||
      t.status === "confirmada",
  );

  const taskIds = taskList.map((t) => t.id);
  const { data: pendingNegos } =
    taskIds.length > 0
      ? await supabase
          .from("negotiations")
          .select("task_id")
          .eq("status", "pending")
          .in("task_id", taskIds)
      : { data: [] as { task_id: string }[] };

  const pendingIds = (pendingNegos ?? []).map((n) => n.task_id);

  return (
    <main className="mx-auto max-w-3xl space-y-8 px-6 py-10">
      <RealtimeNotifications userId={user.id} />
      <AppHeader
        badge="Modo missão"
        title="Suas missões"
        subtitle={family.name}
      />

      <div className="grid grid-cols-2 gap-4">
        <div className="glow-coin rounded-2xl border border-border bg-card p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-coin">
            💰 Saldo a receber
          </p>
          <p className="mt-2 text-3xl font-extrabold tracking-tight text-coin">
            {formatBRL(saldo)}
          </p>
        </div>
        <div className="glow-xp rounded-2xl border border-border bg-card p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-xp">
            ⭐ Já conquistado
          </p>
          <p className="mt-2 text-3xl font-extrabold tracking-tight text-xp">
            {formatBRL(ganhos)}
          </p>
        </div>
      </div>

      {awaitingConfirm.length > 0 && (
        <div className="rounded-2xl border-2 border-success/40 bg-card p-4">
          <p className="mb-3 text-sm text-muted-foreground">
            O responsável registrou pagamento. Confirme o recebimento:
          </p>
          <ConfirmAllButton
            familyId={familyId}
            amountCents={confirmCents}
            count={awaitingConfirm.length}
          />
        </div>
      )}

      <div className="flex gap-3 text-center text-sm">
        <div className="flex-1 rounded-xl border border-border bg-card/60 py-3">
          <p className="text-2xl font-bold">{active.length}</p>
          <p className="text-xs text-muted-foreground">Ativas</p>
        </div>
        <div className="flex-1 rounded-xl border border-border bg-card/60 py-3">
          <p className="text-2xl font-bold">{done.length}</p>
          <p className="text-xs text-muted-foreground">Concluídas</p>
        </div>
      </div>

      <NotificationList items={notifications} />

      <section className="space-y-3">
        <h2 className="text-lg font-bold">Missões abertas</h2>
        <TaskList
          tasks={active.length ? active : taskList}
          role="executor"
          userId={user.id}
          pendingNegotiationTaskIds={pendingIds}
        />
      </section>

      {done.length > 0 && active.length > 0 && (
        <section className="space-y-3 opacity-80">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Histórico
          </h2>
          <TaskList
            tasks={done}
            role="executor"
            userId={user.id}
            pendingNegotiationTaskIds={pendingIds}
          />
        </section>
      )}
    </main>
  );
}
