import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { CreateTaskFab } from "@/components/tasks/create-task-fab";
import { TaskList } from "@/components/tasks/task-list";
import { FamilyRealtime } from "@/components/realtime/family-realtime";
import { PendingNegotiations } from "@/components/negotiations/pending-list";
import { PendingOffers } from "@/components/offers/pending-offers";
import { PayExecutorButton } from "@/components/wallet/pay-executor-button";
import { CopyInvite } from "@/components/family/copy-invite";
import { AppHeader } from "@/components/layout/app-header";
import { Leaderboard } from "@/components/leaderboard/leaderboard";
import { listMyNotifications } from "@/lib/actions/notifications";
import { listPendingNegotiations } from "@/lib/actions/negotiations";
import { listPendingOffersForFamily } from "@/lib/actions/offers";
import { getProfileNames } from "@/lib/actions/profiles";
import { getOpenAdvancesByExecutor } from "@/lib/actions/wallet";
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
    .eq("family_id", familyId);

  const { data: tasks } = await supabase
    .from("tasks")
    .select("*")
    .eq("family_id", familyId)
    .order("created_at", { ascending: false });

  const taskList = (tasks ?? []) as Task[];
  const executorIds = (members ?? [])
    .filter((m) => m.role === "executor")
    .map((m) => m.user_id);
  const allIds = (members ?? []).map((m) => m.user_id);
  const names = await getProfileNames(allIds);

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

  const advancesByExecutor = await getOpenAdvancesByExecutor(familyId);

  const toVerify = taskList.filter(
    (t) => t.status === "aguardando_verificacao",
  );
  const openBoard = taskList.filter(
    (t) => t.status === "criada" && !t.assignee_id,
  ).length;
  const openTasks = taskList.filter(
    (t) =>
      t.status === "atribuida" ||
      t.status === "aguardando_verificacao" ||
      t.status === "aprovada",
  ).length;

  const notifications = await listMyNotifications();
  const pendingNegos = await listPendingNegotiations(familyId);
  const { offers, taskMeta } = await listPendingOffersForFamily(familyId);
  const taskTitles = Object.fromEntries(taskList.map((t) => [t.id, t.title]));
  const pendingIds = pendingNegos.map((n) => n.task_id);

  // Saldo líquido = devido − adiantamentos
  let totalNetDue = 0;
  const payRows: {
    uid: string;
    due: number;
    advance: number;
    remaining: number;
  }[] = [];
  const seen = new Set<string>();
  for (const [uid, due] of dueByExecutor.entries()) {
    const adv = advancesByExecutor[uid] ?? 0;
    const remaining = Math.max(0, due - adv);
    totalNetDue += remaining;
    payRows.push({ uid, due, advance: adv, remaining });
    seen.add(uid);
  }
  // Executores só com crédito (sem tarefas aprovadas no momento)
  for (const [uid, adv] of Object.entries(advancesByExecutor)) {
    if (seen.has(uid) || adv <= 0) continue;
    payRows.push({ uid, due: 0, advance: adv, remaining: 0 });
  }

  return (
    <main className="mx-auto max-w-3xl space-y-5 px-4 py-8 pb-28 sm:px-6">
      <FamilyRealtime userId={user.id} familyId={familyId} />
      <AppHeader
        badge="Dashboard"
        title={family.name}
        subtitle={
          <>
            Convite: <CopyInvite code={family.invite_code} />
          </>
        }
        notifications={notifications}
        createLabel="Nova tarefa"
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Ativas" value={String(openTasks)} />
        <Stat label="Quadro aberto" value={String(openBoard)} />
        <Stat
          label="A verificar"
          value={String(toVerify.length)}
          accent={toVerify.length > 0 ? "warning" : undefined}
        />
        <Stat label="A pagar" value={formatBRL(totalNetDue)} />
      </div>

      <Link
        href="/responsavel/tarefas"
        className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3 shadow-sm transition hover:border-primary/40 hover:shadow-md"
      >
        <div>
          <p className="text-sm font-semibold">Todas as tarefas</p>
          <p className="text-xs text-muted-foreground">
            {taskList.length} no total · filtros e histórico
          </p>
        </div>
        <span className="text-lg text-primary" aria-hidden>
          →
        </span>
      </Link>

      <Leaderboard
        tasks={taskList}
        nameByUserId={names}
        title="Ranking da família"
      />

      {(offers.length > 0 || pendingNegos.length > 0) && (
        <>
          <PendingOffers
            offers={offers}
            taskMeta={taskMeta}
            nameByUserId={names}
            currentUserId={user.id}
          />
          <PendingNegotiations items={pendingNegos} taskTitles={taskTitles} />
        </>
      )}

      {payRows.length > 0 && (
        <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            A pagar
          </h2>
          <ul className="space-y-3 text-sm">
            {payRows.map(({ uid, due, advance, remaining }) => (
              <li
                key={uid}
                className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3 last:border-0 last:pb-0"
              >
                <div>
                  <span className="font-medium">
                    {names[uid] ?? uid.slice(0, 8) + "…"}
                  </span>
                  <strong className="ml-3 tabular-nums">
                    {formatBRL(remaining)}
                  </strong>
                  {advance > 0 && (
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Devido {formatBRL(due)} · adiantado {formatBRL(advance)}
                    </p>
                  )}
                </div>
                <PayExecutorButton
                  familyId={familyId}
                  executorId={uid}
                  executorName={names[uid] ?? "executor"}
                  amountCents={due}
                  advanceCents={advance}
                />
              </li>
            ))}
          </ul>
        </section>
      )}

      {toVerify.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">
            A verificar{" "}
            <span className="text-sm text-warning">({toVerify.length})</span>
          </h2>
          <TaskList
            tasks={toVerify}
            role="responsavel"
            userId={user.id}
            pendingNegotiationTaskIds={pendingIds}
            nameByUserId={names}
          />
        </section>
      )}

      <CreateTaskFab
        familyId={familyId}
        executors={executors}
        allowOpenBoard
        label="Nova tarefa"
      />
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
    <div className="rounded-xl border border-border bg-card p-3 shadow-sm">
      <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p
        className={`mt-1 text-lg font-bold tabular-nums ${
          accent === "warning" ? "text-warning" : ""
        }`}
      >
        {value}
      </p>
    </div>
  );
}
