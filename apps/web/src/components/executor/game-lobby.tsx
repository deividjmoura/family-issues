"use client";

import { useEffect, useRef, useState, type MouseEvent } from "react";
import { createPortal } from "react-dom";
import type { Task, TaskOffer } from "@/lib/domain/types";
import type { AppNotification } from "@/lib/actions/notifications";
import { TaskList } from "@/components/tasks/task-list";
import { Leaderboard } from "@/components/leaderboard/leaderboard";
import { PendingOffers } from "@/components/offers/pending-offers";
import { ConfirmAllButton } from "@/components/wallet/confirm-all-button";
import { SideMenu } from "@/components/layout/side-menu";
import { OPEN_CREATE_TASK_EVENT } from "@/components/tasks/create-task-fab";
import { GAME_LEVEL_UP_EVENT } from "@/components/executor/game-feedback";
import { formatBRL } from "@/lib/domain/money";
import { sfx } from "@/lib/sounds";

type PanelId =
  | "quests"
  | "board"
  | "ranking"
  | "gold"
  | "stats"
  | "done"
  | "offers"
  | "achievements"
  | null;

type Burst = {
  id: number;
  x: number;
  y: number;
};

const BURST_MS = 900;
const CLOSE_MS = 280;

export function GameLobby({
  familyName,
  familyId,
  userId,
  gold,
  xp,
  totalEarned,
  completionPct,
  activeCount,
  boardCount,
  doneCount,
  offersCount,
  notifications,
  activeTasks,
  boardTasks,
  doneTasks,
  familyTasks,
  pendingIds,
  names,
  offers,
  taskMeta,
  awaitingConfirmCount,
  confirmCents,
}: {
  familyName: string;
  familyId: string;
  userId: string;
  gold: number;
  xp: number;
  totalEarned: number;
  completionPct: number;
  activeCount: number;
  boardCount: number;
  doneCount: number;
  offersCount: number;
  notifications: AppNotification[];
  activeTasks: Task[];
  boardTasks: Task[];
  doneTasks: Task[];
  familyTasks: Task[];
  pendingIds: string[];
  names: Record<string, string>;
  offers: TaskOffer[];
  taskMeta: Record<string, { title: string; value_cents: number }>;
  awaitingConfirmCount: number;
  confirmCents: number;
}) {
  const [panel, setPanel] = useState<PanelId>(null);
  const [mounted, setMounted] = useState(false);
  const [closing, setClosing] = useState(false);
  const [bursts, setBursts] = useState<Burst[]>([]);
  const [firingTile, setFiringTile] = useState<string | null>(null);
  const closeTimerRef = useRef<number | null>(null);
  const burstTimersRef = useRef<number[]>([]);

  const level = Math.floor(xp / 100) + 1;
  const levelProgress = xp % 100;
  const xpToNextLevel = 100 - levelProgress;
  const dateKey = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };
  const completedDates = new Set(
    doneTasks
      .map((task) => task.completed_at)
      .filter((date): date is string => Boolean(date))
      .map((date) => dateKey(new Date(date))),
  );
  const today = new Date();
  let streak = 0;
  for (let i = 0; i < 365; i += 1) {
    const day = new Date(today);
    day.setDate(today.getDate() - i);
    if (!completedDates.has(dateKey(day))) break;
    streak += 1;
  }
  const todayKey = dateKey(today);
  const todayCompleted = doneTasks.filter(
    (task) => task.completed_at && dateKey(new Date(task.completed_at)) === todayKey,
  ).length;
  const achievements = [
    { icon: "🌟", title: "Primeira missão", unlocked: doneTasks.length >= 1, text: "Conclua sua primeira missão." },
    { icon: "🔥", title: "Em sequência", unlocked: streak >= 3, text: "Mantenha 3 dias seguidos." },
    { icon: "⚡", title: "Caçador de XP", unlocked: xp >= 100, text: "Alcance 100 XP." },
    { icon: "🏅", title: "Veterano", unlocked: doneTasks.length >= 10, text: "Conclua 10 missões." },
    { icon: "🚀", title: "Combo diário", unlocked: todayCompleted >= 3, text: "Complete 3 missões no mesmo dia." },
  ];

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current);
      burstTimersRef.current.forEach((id) => window.clearTimeout(id));
    };
  }, []);

  useEffect(() => {
    const key = `family-game:last-level:${userId}`;
    const previous = window.localStorage.getItem(key);
    if (previous === null) {
      window.localStorage.setItem(key, String(level));
      return;
    }

    const previousLevel = Number(previous);
    if (Number.isFinite(previousLevel) && level > previousLevel) {
      window.dispatchEvent(
        new CustomEvent(GAME_LEVEL_UP_EVENT, {
          detail: { from: previousLevel, to: level },
        }),
      );
    }
    window.localStorage.setItem(key, String(level));
  }, [level, userId]);

  useEffect(() => {
    if (!panel) return;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closePanel();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [panel, closing]);

  function spawnBurst(x: number, y: number) {
    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) return;

    const id = Date.now() + Math.random();
    setBursts((prev) => [...prev, { id, x, y }]);
    const timer = window.setTimeout(() => {
      setBursts((prev) => prev.filter((b) => b.id !== id));
    }, BURST_MS);
    burstTimersRef.current.push(timer);
  }

  function closePanel(fromX?: number, fromY?: number) {
    if (!panel || closing) return;
    setClosing(true);
    sfx.close();
    const x = fromX ?? window.innerWidth / 2;
    const y = fromY ?? window.innerHeight / 2;
    spawnBurst(x, y);
    if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current);
    closeTimerRef.current = window.setTimeout(() => {
      setPanel(null);
      setClosing(false);
      closeTimerRef.current = null;
    }, CLOSE_MS);
  }

  const tiles: {
    id: PanelId | "new";
    icon: string;
    label: string;
    sub?: string;
    badge?: number;
    color: string;
  }[] = [
    {
      id: "quests",
      icon: "⚔️",
      label: "Missões",
      sub: "ativas",
      badge: activeCount,
      color: "tile-cyan",
    },
    {
      id: "board",
      icon: "🗺️",
      label: "Quadro",
      sub: "abertas",
      badge: boardCount,
      color: "tile-orange",
    },
    {
      id: "ranking",
      icon: "🏆",
      label: "Ranking",
      sub: "top XP",
      color: "tile-gold",
    },
    {
      id: "gold",
      icon: "💰",
      label: "Gold",
      sub: formatBRL(gold),
      badge: awaitingConfirmCount > 0 ? awaitingConfirmCount : undefined,
      color: "tile-yellow",
    },
    {
      id: "stats",
      icon: "📊",
      label: "Stats",
      sub: `${completionPct}%`,
      color: "tile-purple",
    },
    {
      id: "done",
      icon: "✅",
      label: "Feitas",
      sub: `${doneCount}`,
      color: "tile-green",
    },
    {
      id: "offers",
      icon: "📢",
      label: "Ofertas",
      sub: offersCount ? "novas" : "vazio",
      badge: offersCount || undefined,
      color: "tile-pink",
    },
    {
      id: "achievements",
      icon: "🏅",
      label: "Conquistas",
      sub: `${achievements.filter((item) => item.unlocked).length}/${achievements.length}`,
      color: "tile-purple",
    },
    {
      id: "new",
      icon: "➕",
      label: "Nova",
      sub: "missão",
      color: "tile-lime",
    },
  ];

  function onTile(id: PanelId | "new", event: MouseEvent<HTMLButtonElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    spawnBurst(x, y);
    setFiringTile(String(id));
    window.setTimeout(() => setFiringTile(null), 450);

    if (id === "new") {
      sfx.click();
      window.dispatchEvent(new Event(OPEN_CREATE_TASK_EVENT));
      return;
    }

    sfx.open();
    sfx.whoosh();
    setClosing(false);
    setPanel(id);
  }

  const titles: Record<Exclude<PanelId, null>, string> = {
    quests: "⚔️ Missões ativas",
    board: "🗺️ Quadro de missões",
    ranking: "🏆 Ranking da família",
    gold: "💰 Gold & loot",
    stats: "📊 System stats",
    done: "✅ Missões concluídas",
    offers: "📢 Ofertas pendentes",
    achievements: "🏅 Conquistas desbloqueáveis",
  };

  const panelBody =
    panel === "quests" ? (
      <TaskList
        tasks={activeTasks}
        role="executor"
        userId={userId}
        pendingNegotiationTaskIds={pendingIds}
        nameByUserId={names}
      />
    ) : panel === "board" ? (
      <TaskList
        tasks={boardTasks}
        role="executor"
        userId={userId}
        pendingNegotiationTaskIds={pendingIds}
        nameByUserId={names}
      />
    ) : panel === "ranking" ? (
      <Leaderboard
        tasks={familyTasks}
        nameByUserId={names}
        title="Ranking"
      />
    ) : panel === "gold" ? (
      <div className="space-y-4">
        <div className="game-stat-row">
          <div className="game-stat-card">
            <span className="game-stat-card__label">A receber</span>
            <span className="game-stat-card__value coin">{formatBRL(gold)}</span>
          </div>
          <div className="game-stat-card">
            <span className="game-stat-card__label">Já confirmado</span>
            <span className="game-stat-card__value">
              {formatBRL(totalEarned)}
            </span>
          </div>
        </div>
        {awaitingConfirmCount > 0 ? (
          <div className="rounded-xl border border-[var(--console-green)]/40 bg-[var(--console-green)]/10 p-4">
            <p className="mb-3 text-sm">
              💵 Pagamento na conta — confirme o loot:
            </p>
            <ConfirmAllButton
              familyId={familyId}
              amountCents={confirmCents}
              count={awaitingConfirmCount}
            />
          </div>
        ) : (
          <p className="text-center text-sm text-muted-foreground">
            Nenhum pagamento aguardando confirmação.
          </p>
        )}
      </div>
    ) : panel === "stats" ? (
      <div className="space-y-4">
        <div className="game-stat-row">
          <div className="game-stat-card wide">
            <span className="game-stat-card__label">Performance</span>
            <span className="game-stat-card__value cyan">{completionPct}%</span>
            <p className="mt-1 text-xs text-muted-foreground">
              {doneCount} concluídas · {activeCount} ativas
            </p>
          </div>
          <div className="game-stat-card">
            <span className="game-stat-card__label">XP</span>
            <span className="game-stat-card__value xp">⭐ {xp}</span>
          </div>
        </div>
        <div className="game-xp-bar">
          <div
            className="game-xp-bar__fill"
            style={{
              width: `${Math.min(100, Math.max(8, xp % 100 || 8))}%`,
            }}
          />
        </div>
        <p className="text-center text-xs text-muted-foreground">
          Próximo nível: {xpToNextLevel} XP
        </p>
      </div>
    ) : panel === "done" ? (
      <TaskList
        tasks={doneTasks}
        role="executor"
        userId={userId}
        pendingNegotiationTaskIds={pendingIds}
        nameByUserId={names}
      />
    ) : panel === "offers" ? (
      offersCount > 0 ? (
        <PendingOffers
          offers={offers}
          taskMeta={taskMeta}
          nameByUserId={names}
          currentUserId={userId}
        />
      ) : (
        <p className="py-8 text-center text-sm text-muted-foreground">
          Nenhuma oferta no momento.
        </p>
      )
    ) : panel === "achievements" ? (
      <div className="game-achievements">
        <div className="game-streak">
          <span className="game-streak__flame">🔥</span>
          <div>
            <strong>{streak} {streak === 1 ? "dia" : "dias"} de sequência</strong>
            <span>Complete uma missão hoje para manter seu ritmo.</span>
          </div>
        </div>
        <div className="game-achievements__grid">
          {achievements.map((item) => (
            <div key={item.title} className={`game-achievement ${item.unlocked ? "is-unlocked" : "is-locked"}`}>
              <span className="game-achievement__icon" aria-hidden>{item.unlocked ? item.icon : "🔒"}</span>
              <strong>{item.title}</strong>
              <span>{item.unlocked ? "DESBLOQUEADA" : item.text}</span>
            </div>
          ))}
        </div>
      </div>
    ) : null;

  const burstLayer =
    mounted && bursts.length > 0
      ? createPortal(
          <>
            {bursts.map((b) => (
              <div
                key={b.id}
                className="game-burst"
                style={{ left: b.x, top: b.y }}
                aria-hidden
              >
                <span className="game-burst__core" />
                {Array.from({ length: 24 }, (_, i) => (
                  <span
                    key={i}
                    className="game-burst__particle"
                    style={{ animationDelay: `${(i % 7) * 0.012}s` }}
                  />
                ))}
              </div>
            ))}
          </>,
          document.body,
        )
      : null;

  const modal =
    panel && mounted
      ? createPortal(
          <div
            className={`game-panel-root${closing ? " is-closing" : ""}`}
            role="presentation"
            onClick={(e) => closePanel(e.clientX, e.clientY)}
          >
            <div
              className="game-panel"
              role="dialog"
              aria-modal="true"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="game-panel__head">
                <h2 className="game-panel__title">{titles[panel]}</h2>
                <button
                  type="button"
                  className="game-panel__close"
                  onClick={(e) => closePanel(e.clientX, e.clientY)}
                  aria-label="Fechar"
                >
                  ×
                </button>
              </div>
              <div className="game-panel__body">{panelBody}</div>
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <div className="game-lobby">
      <div className="game-hud">
        <div className="game-hud__left">
          <p className="game-hud__family">{familyName}</p>
          <p className="game-hud__tag">MISSION LOBBY</p>
        </div>
        <div className="game-hud__pills">
          <span className="game-pill game-pill--gold" title="Gold a receber">
            💰 {formatBRL(gold)}
          </span>
          <span className="game-pill game-pill--xp" title={`${xp} XP`}>
            ⭐ {xp} XP
          </span>
          <span className="game-pill game-pill--level" title={`Nível ${level}`}>
            LVL {level}
          </span>
          <span className="game-pill game-pill--streak" title="Sequência atual">
            🔥 {streak}
          </span>
        </div>
        <SideMenu notifications={notifications} createLabel="Nova missão" />
      </div>

      <div className="game-hero">
        <div className="game-hero__avatar" aria-hidden>
          <span className="game-avatar__emoji">
            {streak >= 3 ? "🦸" : level >= 5 ? "🧙" : activeCount > 0 ? "🎮" : "😎"}
          </span>
          <span className="game-avatar__orbit" aria-hidden />
        </div>
        <div className="game-hero__info">
          <p className="game-hero__title">
            {streak >= 3 ? "🔥 Sequência ativa!" : activeCount > 0 ? "Pronto pra jogar?" : "Base segura!"}
          </p>
          <div className="game-level">
            <div className="game-level__row">
              <span>NÍVEL {level}</span>
              <span>{levelProgress}/100 XP</span>
            </div>
            <div className="game-level__track" aria-label={`${levelProgress}% para o próximo nível`}>
              <div className="game-level__fill" style={{ width: `${Math.max(3, levelProgress)}%` }} />
            </div>
          </div>
          <p className="game-hero__sub">
            {activeCount > 0
              ? `${activeCount} missão${activeCount === 1 ? "" : "ões"} te esperando`
              : boardCount > 0
                ? `${boardCount} no quadro aberto`
                : "Toque nos ícones abaixo"}
          </p>
        </div>
        {awaitingConfirmCount > 0 && (
          <button
            type="button"
            className="game-loot-alert"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              spawnBurst(rect.left + rect.width / 2, rect.top + rect.height / 2);
              sfx.open();
              setPanel("gold");
            }}
          >
            💎 Loot! Confirmar pagamento
          </button>
        )}
      </div>

      <div className="game-grid">
        {tiles.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`game-tile ${t.color}${firingTile === String(t.id) ? " is-firing" : ""}`}
            onClick={(e) => onTile(t.id, e)}
          >
            {t.badge != null && t.badge > 0 && (
              <span className="game-tile__badge">
                {t.badge > 9 ? "9+" : t.badge}
              </span>
            )}
            <span className="game-tile__icon" aria-hidden>
              {t.icon}
            </span>
            <span className="game-tile__label">{t.label}</span>
            {t.sub && <span className="game-tile__sub">{t.sub}</span>}
          </button>
        ))}
      </div>

      <p className="game-lobby-hint">
        Toque em um ícone para abrir · lobby de jogo
      </p>

      {burstLayer}
      {modal}
    </div>
  );
}
