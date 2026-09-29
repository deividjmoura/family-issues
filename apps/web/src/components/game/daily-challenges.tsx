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
    <section className="kids-daily">
      <div className="kids-daily__head">
        <div>
          <p className="kids-daily__eyebrow">✨ Desafios do dia</p>
          <h2 className="kids-daily__title">Escolha sua próxima aventura!</h2>
          <p className="kids-daily__sub">
            Cada dia traz missões novas. Aceite, complete e ganhe XP + recompensa.
          </p>
        </div>
        <span className="kids-daily__chip">200 MISSÕES</span>
      </div>
      <div className="kids-daily__grid">
        {challenges.map((challenge) => {
          const done = accepted.has(challenge.id);
          return (
            <article
              key={challenge.id}
              className={`kids-daily__card${done ? " is-done" : ""}`}
            >
              <div className="kids-daily__icon" aria-hidden>
                {challenge.icon}
              </div>
              <div className="kids-daily__body">
                <p className="kids-daily__cat">{challenge.category}</p>
                <h3 className="kids-daily__name">{challenge.title}</h3>
                <p className="kids-daily__desc">{challenge.description}</p>
                <div className="kids-daily__foot">
                  <span className="kids-daily__xp">⭐ {challenge.points} XP</span>
                  {done ? (
                    <span className="kids-daily__done">ADICIONADA ✓</span>
                  ) : (
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => accept(challenge)}
                      className="kids-daily__btn"
                    >
                      ACEITAR!
                    </button>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
