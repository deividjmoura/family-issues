import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { CreateTaskFab } from "@/components/tasks/create-task-fab";
import { TaskFilters } from "@/components/tasks/task-filters";
import { FamilyRealtime } from "@/components/realtime/family-realtime";
import { AppHeader } from "@/components/layout/app-header";
import { listMyNotifications } from "@/lib/actions/notifications";
import { listPendingNegotiations } from "@/lib/actions/negotiations";
import { getProfileNames } from "@/lib/actions/profiles";
import type { Task } from "@/lib/domain/types";

export default async function ResponsavelTarefasPage() {
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

  const notifications = await listMyNotifications();
  const pendingNegos = await listPendingNegotiations(familyId);
  const pendingIds = pendingNegos.map((n) => n.task_id);

  return (
    <main className="mx-auto max-w-3xl space-y-5 px-4 py-8 pb-28 sm:px-6">
      <FamilyRealtime userId={user.id} familyId={familyId} />
      <AppHeader
        badge="Tarefas"
        title="Todas as tarefas"
        subtitle={
          <Link
            href="/responsavel"
            className="inline-flex items-center gap-1 text-primary hover:underline"
          >
            ← Voltar ao dashboard
          </Link>
        }
        notifications={notifications}
        createLabel="Nova tarefa"
      />

      <section className="space-y-3">
        <TaskFilters
          tasks={taskList}
          role="responsavel"
          userId={user.id}
          pendingNegotiationTaskIds={pendingIds}
          nameByUserId={names}
        />
      </section>

      <CreateTaskFab
        familyId={familyId}
        executors={executors}
        allowOpenBoard
        label="Nova tarefa"
      />
    </main>
  );
}
