"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { Task, TaskOffer } from "@/lib/domain/types";
import type { AppNotification } from "@/lib/actions/notifications";
import { TaskList } from "@/components/tasks/task-list";
import { Leaderboard } from "@/components/leaderboard/leaderboard";
import { PendingOffers } from "@/components/offers/pending-offers";
import { ConfirmAllButton } from "@/components/wallet/confirm-all-button";
import { SideMenu } from "@/components/layout/side-menu";
import { OPEN_CREATE_TASK_EVENT } from "@/components/tasks/create-task-fab";
import { formatBRL } from "@/lib/domain/money";

type PanelId =
  | "quests"
  | "board"
  | "ranking"
  | "gold"
  | "stats"
  | "done"
  | "offers"
  | null;

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

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!panel) return;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPanel(null);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [panel]);

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
      id: "new",
      icon: "➕",
      label: "Nova",
      sub: "missão",
      color: "tile-lime",
    },
  ];

  function onTile(id: PanelId | "new") {
    if (id === "new") {
      window.dispatchEvent(new Event(OPEN_CREATE_TASK_EVENT));
      return;
    }
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
          Próximo nível: {100 - (xp % 100)} XP
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
    ) : null;

  const modal =
    panel && mounted
      ? createPortal(
          <div
            className="game-panel-root"
            role="presentation"
            onClick={() => setPanel(null)}
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
                  onClick={() => setPanel(null)}
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
          <span className="game-pill game-pill--xp" title="XP">
            ⭐ {xp}
          </span>
        </div>
        <SideMenu notifications={notifications} createLabel="Nova missão" />
      </div>

      <div className="game-hero">
        <div className="game-hero__avatar" aria-hidden>
          🎮
        </div>
        <div className="game-hero__info">
          <p className="game-hero__title">Pronto pra jogar?</p>
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
            onClick={() => setPanel("gold")}
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
            className={`game-tile ${t.color}`}
            onClick={() => onTile(t.id)}
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

      {modal}
    </div>
  );
}
