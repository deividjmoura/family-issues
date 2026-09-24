import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CreateTaskForm } from "@/components/tasks/create-task-form";
import { TaskList } from "@/components/tasks/task-list";
import { NotificationList } from "@/components/notifications/notification-list";
import { listMyNotifications } from "@/lib/actions/notifications";
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
  const executors = (members ?? []).map((m) => ({
    user_id: m.user_id,
    label: m.user_id.slice(0, 8) + "…",
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

  const notifications = await listMyNotifications();

  return (
    <main className="mx-auto max-w-3xl space-y-8 px-6 py-12">
      <header className="space-y-1">
        <p className="text-sm text-muted-foreground">Responsável</p>
        <h1 className="text-2xl font-bold">{family.name}</h1>
        <p className="text-sm text-muted-foreground">
          Código de convite:{" "}
          <code className="rounded bg-muted px-1.5 py-0.5 font-mono">
            {family.invite_code}
          </code>
        </p>
      </header>

      <NotificationList items={notifications} />

      {dueByExecutor.size > 0 && (
        <section className="rounded-lg border border-border bg-card p-4">
          <h2 className="mb-2 text-sm font-semibold">Saldo devido</h2>
          <ul className="space-y-1 text-sm">
            {[...dueByExecutor.entries()].map(([uid, cents]) => (
              <li key={uid}>
                {uid.slice(0, 8)}…: <strong>{formatBRL(cents)}</strong>
              </li>
            ))}
          </ul>
        </section>
      )}

      <CreateTaskForm familyId={familyId} executors={executors} />

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Tarefas</h2>
        <TaskList tasks={taskList} role="responsavel" userId={user.id} />
      </section>
    </main>
  );
}
