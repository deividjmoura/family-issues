import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CreateTaskForm } from "@/components/tasks/create-task-form";
import { TaskList } from "@/components/tasks/task-list";
import { NotificationList } from "@/components/notifications/notification-list";
import { RealtimeNotifications } from "@/components/notifications/realtime-badge";
import { PendingNegotiations } from "@/components/negotiations/pending-list";
import { PayExecutorButton } from "@/components/wallet/pay-executor-button";
import { AppHeader } from "@/components/layout/app-header";
import { listMyNotifications } from "@/lib/actions/notifications";
import { listPendingNegotiations } from "@/lib/actions/negotiations";
import { getProfileNames } from "@/lib/actions/profiles";
import type { Task } from "@/lib/domain/types";
import { formatBRL, balanceCents } from "@/lib/domain/money";

export default async function ResponsavelHomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: membership } = await supabase
    .from("family_members")
    .select("family_id, role, family:families(id, name, invite_code)")
    .eq("user_id", user.id)
    .eq("role", "responsavel")
    .limit(1)
    .maybeSingle();

  if (!membership) redirect("/onboarding");

  const familyId = membership.family_id;
  const family = membership.family as unknown as {
    id: string;
    name: string;
    invite_code: string;
  };

  const { data: members } = await supabase
    .from("family_members")
    .select("user_id, role")
    .eq("family_id", familyId)
    .eq("role", "executor");

  const { data: tasks } = await supabase
    .from("tasks")
    .select("*")
    .eq("family_id", familyId)
    .order("created_at", { ascending: false });

  const taskList = (tasks ?? []) as Task[];
  const executorIds = (members ?? []).map((m) => m.user_id);
  const names = await getProfileNames(executorIds);

  const executors = executorIds.map((uid) => ({
    user_id: uid,
    label: names[uid] ?? uid.slice(0, 8) + "…",
  }));

  const dueByExecutor = new Map<string, number>();
  for (const t of taskList) {
    if (!t.assignee_id) continue;
    const bal = balanceCents([t]);
    if (bal > 0) {
      dueByExecutor.set(
        t.assignee_id,
        (dueByExecutor.get(t.assignee_id) ?? 0) + bal,
      );
    }
  }

  const toVerify = taskList.filter(
    (t) => t.status === "aguardando_verificacao",
  );
  const others = taskList.filter(
    (t) => t.status !== "aguardando_verificacao",
  );
  const openTasks = taskList.filter(
    (t) =>
      t.status === "atribuida" ||
      t.status === "aguardando_verificacao" ||
      t.status === "aprovada",
  ).length;

  const notifications = await listMyNotifications();
  const pendingNegos = await listPendingNegotiations(familyId);
  const taskTitles = Object.fromEntries(taskList.map((t) => [t.id, t.title]));
  const pendingIds = pendingNegos.map((n) => n.task_id);
  const totalDue = [...dueByExecutor.values()].reduce((a, b) => a + b, 0);

  return (
    <main className="mx-auto max-w-3xl space-y-8 px-6 py-10">
      <RealtimeNotifications userId={user.id} />
      <AppHeader
        badge="Área do responsável"
        title={family.name}
        subtitle={
          <>
            Convite:{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-foreground">
              {family.invite_code}
            </code>
          </>
        }
      />

      <div className="grid grid-cols-3 gap-3">
        <Stat label="Em aberto" value={String(openTasks)} />
        <Stat
          label="A verificar"
          value={String(toVerify.length)}
          accent={toVerify.length > 0 ? "warning" : undefined}
        />
        <Stat label="A pagar" value={formatBRL(totalDue)} />
      </div>

      <NotificationList items={notifications} />
      <PendingNegotiations items={pendingNegos} taskTitles={taskTitles} />

      {dueByExecutor.size > 0 && (
        <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Saldo devido por executor
          </h2>
          <ul className="space-y-3 text-sm">
            {[...dueByExecutor.entries()].map(([uid, cents]) => (
              <li
                key={uid}
                className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3 last:border-0 last:pb-0"
              >
                <div>
                  <span className="font-medium text-foreground">
                    {names[uid] ?? uid.slice(0, 8) + "…"}
                  </span>
                  <strong className="ml-3 text-base tabular-nums">
                    {formatBRL(cents)}
                  </strong>
                </div>
                <PayExecutorButton
                  familyId={familyId}
                  executorId={uid}
                  executorName={names[uid] ?? "executor"}
                  amountCents={cents}
                />
              </li>
            ))}
          </ul>
        </section>
      )}

      <CreateTaskForm familyId={familyId} executors={executors} />

      {toVerify.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">Aguardando verificação</h2>
            <span className="rounded-full bg-warning/15 px-2 py-0.5 text-xs font-semibold text-warning">
              {toVerify.length}
            </span>
          </div>
          <TaskList
            tasks={toVerify}
            role="responsavel"
            userId={user.id}
            pendingNegotiationTaskIds={pendingIds}
            nameByUserId={names}
          />
        </section>
      )}

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Todas as tarefas</h2>
          <span className="text-xs text-muted-foreground">
            {taskList.length} no total
          </span>
        </div>
        <TaskList
          tasks={toVerify.length > 0 ? others : taskList}
          role="responsavel"
          userId={user.id}
          pendingNegotiationTaskIds={pendingIds}
          nameByUserId={names}
        />
      </section>
    </main>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: "warning";
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p
        className={`mt-1 text-xl font-bold tabular-nums ${
          accent === "warning" ? "text-warning" : ""
        }`}
      >
        {value}
      </p>
    </div>
  );
}
