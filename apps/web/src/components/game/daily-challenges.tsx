"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { createTask } from "@/lib/actions/tasks";
import type { DailyChallenge } from "@/lib/domain/types";

export function DailyChallenges({
  familyId,
  challenges,
  acceptedIds,
  date,
}: {
  familyId: string;
  challenges: DailyChallenge[];
  acceptedIds: string[];
  date: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const accepted = new Set(acceptedIds);

  function accept(challenge: DailyChallenge) {
    startTransition(async () => {
      const result = await createTask({
        familyId,
        title: challenge.title,
        description: challenge.description,
        valueCents: challenge.value_cents,
        points: challenge.points,
        dailyChallengeId: challenge.id,
        dailyChallengeDate: date,
      });
      if (!result.ok) alert(result.error);
      else router.refresh();
    });
  }

  return (
    <section className="rounded-2xl border border-cyan-400/20 bg-slate-950/30 p-4">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[.2em] text-cyan-300">Desafios do dia</p>
          <h2 className="mt-1 text-xl font-black text-white">Escolha sua próxima missão</h2>
          <p className="mt-1 text-xs text-white/55">Uma rotação de 200 missões mantém a rotina sempre diferente.</p>
        </div>
        <span className="rounded-full border border-yellow-300/30 bg-yellow-300/10 px-2.5 py-1 text-[10px] font-black text-yellow-200">200 MISSÕES</span>
      </div>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {challenges.map((challenge) => {
          const done = accepted.has(challenge.id);
          return (
            <article key={challenge.id} className="rounded-xl border border-white/10 bg-white/[.035] p-3 transition hover:border-cyan-300/30">
              <div className="flex gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-cyan-400/10 text-xl" aria-hidden>{challenge.icon}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-cyan-300/70">{challenge.category}</p>
                  <h3 className="mt-0.5 text-sm font-black text-white">{challenge.title}</h3>
                  <p className="mt-1 text-[11px] leading-4 text-white/50">{challenge.description}</p>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <span className="text-xs font-black text-violet-300">⭐ {challenge.points} XP</span>
                    {done ? (
                      <span className="rounded-md bg-emerald-400/10 px-2 py-1 text-[10px] font-bold text-emerald-300">ADICIONADA</span>
                    ) : (
                      <button type="button" disabled={pending} onClick={() => accept(challenge)} className="rounded-md bg-cyan-400 px-2.5 py-1.5 text-[10px] font-black text-slate-950 disabled:opacity-50">ACEITAR</button>
                    )}
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
