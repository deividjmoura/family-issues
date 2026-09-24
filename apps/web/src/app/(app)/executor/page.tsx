import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TaskList } from "@/components/tasks/task-list";
import { NotificationList } from "@/components/notifications/notification-list";
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

  const { data: tasks } = await supabase
    .from("tasks")
    .select("*")
    .eq("family_id", membership.family_id)
    .eq("assignee_id", user.id)
    .order("created_at", { ascending: false });

  const taskList = (tasks ?? []) as Task[];
  const saldo = balanceCents(taskList);
  const ganhos = earnedCents(taskList);
  const notifications = await listMyNotifications();

  return (
    <main className="mx-auto max-w-3xl space-y-8 px-6 py-12">
      <header className="space-y-1">
        <p className="text-sm text-muted-foreground">Executor · {family.name}</p>
        <h1 className="text-2xl font-bold">Suas missões</h1>
      </header>

      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Saldo a receber
          </p>
          <p className="mt-1 text-3xl font-bold">{formatBRL(saldo)}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Já recebido
          </p>
          <p className="mt-1 text-3xl font-bold">{formatBRL(ganhos)}</p>
        </div>
      </div>

      <NotificationList items={notifications} />

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Tarefas</h2>
        <TaskList tasks={taskList} role="executor" userId={user.id} />
      </section>
    </main>
  );
}
