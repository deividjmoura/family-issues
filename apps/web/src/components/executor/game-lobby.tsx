"use client";

import { useState } from "react";
import type { Task, TaskOffer } from "@/lib/domain/types";
import type { AppNotification } from "@/lib/actions/notifications";
import { TaskList } from "@/components/tasks/task-list";
import { Leaderboard } from "@/components/leaderboard/leaderboard";
import { PendingOffers } from "@/components/offers/pending-offers";
import { ConfirmAllButton } from "@/components/wallet/confirm-all-button";
import { SideMenu } from "@/components/layout/side-menu";
import { OPEN_CREATE_TASK_EVENT } from "@/components/tasks/create-task-fab";
import { formatBRL } from "@/lib/domain/money";
import { GameShop } from "@/components/game/game-shop";
import { GameAvatar as AvatarPreview } from "@/components/game/game-avatar";
import type { GameAvatar, GameInventoryItem, GameItem } from "@/lib/domain/types";

type PanelId = "quests" | "board" | "ranking" | "gold" | "stats" | "done" | "offers" | "achievements" | "shop" | null;

export function GameLobby(props: {
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
  gameItems: GameItem[];
  gameInventory: GameInventoryItem[];
  gameAvatar: GameAvatar;
  gameCoins: number;
}) {
  const {
    familyName, familyId, userId, gold, xp, totalEarned, completionPct,
    activeCount, boardCount, doneCount, offersCount, notifications,
    activeTasks, boardTasks, doneTasks, familyTasks, pendingIds, names,
    offers, taskMeta, awaitingConfirmCount, confirmCents,
    gameItems, gameInventory, gameAvatar, gameCoins,
  } = props;

  const [panel, setPanel] = useState<PanelId>(null);
  const level = Math.floor(xp / 100) + 1;
  const levelProgress = xp % 100;
  const featured = activeTasks[0] ?? null;

  const tiles: { id: PanelId | "new"; icon: string; label: string; badge?: number }[] = [
    { id: "quests", icon: "⚔️", label: "Aventuras", badge: activeCount || undefined },
    { id: "board", icon: "🗺️", label: "Mapa", badge: boardCount || undefined },
    { id: "ranking", icon: "🏆", label: "Pódio" },
    { id: "gold", icon: "💰", label: "Tesouro", badge: awaitingConfirmCount || undefined },
    { id: "stats", icon: "⚡", label: "Poder" },
    { id: "done", icon: "🌟", label: "Vitórias" },
    { id: "offers", icon: "🎁", label: "Trocas", badge: offersCount || undefined },
    { id: "achievements", icon: "🏅", label: "Medalhas" },
    { id: "shop", icon: "🛍️", label: "Loja" },
    { id: "new", icon: "✨", label: "Criar" },
  ];

  function open(id: PanelId | "new") {
    if (id === "new") {
      window.dispatchEvent(new Event(OPEN_CREATE_TASK_EVENT));
      return;
    }
    setPanel(id);
  }

  const body =
    panel === "quests" ? (
      <TaskList tasks={activeTasks} role="executor" userId={userId} pendingNegotiationTaskIds={pendingIds} nameByUserId={names} />
    ) : panel === "board" ? (
      <TaskList tasks={boardTasks} role="executor" userId={userId} pendingNegotiationTaskIds={pendingIds} nameByUserId={names} />
    ) : panel === "ranking" ? (
      <Leaderboard tasks={familyTasks} nameByUserId={names} title="Ranking" />
    ) : panel === "gold" ? (
      <div className="space-y-4 p-2">
        <p className="text-lg font-black">A receber: {formatBRL(gold)}</p>
        <p className="text-sm opacity-70">Já confirmado: {formatBRL(totalEarned)}</p>
        {awaitingConfirmCount > 0 && (
          <ConfirmAllButton familyId={familyId} amountCents={confirmCents} count={awaitingConfirmCount} />
        )}
      </div>
    ) : panel === "stats" ? (
      <div className="space-y-2 p-2">
        <p className="font-black">Nível {level} · {xp} XP</p>
        <p>{completionPct}% concluído · {doneCount} vitórias · {activeCount} ativas</p>
        <div className="h-2 rounded-full bg-white/10 overflow-hidden">
          <div className="h-full bg-cyan-400" style={{ width: `${Math.max(3, levelProgress)}%` }} />
        </div>
      </div>
    ) : panel === "done" ? (
      <TaskList tasks={doneTasks} role="executor" userId={userId} pendingNegotiationTaskIds={pendingIds} nameByUserId={names} />
    ) : panel === "offers" ? (
      offersCount > 0 ? (
        <PendingOffers offers={offers} taskMeta={taskMeta} nameByUserId={names} currentUserId={userId} />
      ) : (
        <p className="p-6 text-center text-sm opacity-60">Nenhuma troca no momento.</p>
      )
    ) : panel === "shop" ? (
      <GameShop items={gameItems} inventory={gameInventory} avatar={gameAvatar} coins={gameCoins} />
    ) : panel === "achievements" ? (
      <p className="p-6 text-center text-sm">Complete missões para desbloquear medalhas 🏅</p>
    ) : null;

  return (
    <div className="mx-auto max-w-md px-3 pb-8 pt-2">
      <div className="mb-3 flex items-center gap-2">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-black">{familyName}</p>
          <p className="text-[10px] font-bold uppercase tracking-widest text-cyan-300/80">Base do herói</p>
        </div>
        <span className="rounded-full border border-yellow-400/40 bg-yellow-400/10 px-2 py-1 text-xs font-bold">💰 {formatBRL(gold)}</span>
        <span className="rounded-full border border-violet-400/40 bg-violet-400/10 px-2 py-1 text-xs font-bold">⭐ {xp}</span>
        <SideMenu notifications={notifications} createLabel="Nova aventura" />
      </div>

      <div className="mb-4 flex flex-col items-center gap-2 rounded-2xl border border-cyan-400/30 bg-gradient-to-b from-cyan-950/40 to-slate-950/60 p-4 text-center">
        <button type="button" onClick={() => open("shop")} className="rounded-2xl border border-cyan-300/40 bg-slate-900/50 p-2" aria-label="Personalizar personagem">
          <AvatarPreview config={gameAvatar.config} items={gameItems} size="md" />
        </button>
        <p className="text-lg font-black">
          {activeCount > 0 ? "Hora da aventura!" : boardCount > 0 ? "Tem missão no mapa!" : "Seu herói está pronto!"}
        </p>
        <p className="text-xs opacity-70">Nível {level} · {levelProgress}/100 XP · 🪙 {gameCoins}</p>
        {awaitingConfirmCount > 0 && (
          <button type="button" onClick={() => open("gold")} className="rounded-full bg-emerald-500/20 px-3 py-1.5 text-xs font-black text-emerald-300">
            💎 Tesouro chegou! Confirmar
          </button>
        )}
      </div>

      {featured && (
        <button
          type="button"
          onClick={() => open("quests")}
          className="mb-4 w-full rounded-2xl border-2 border-yellow-400/50 bg-yellow-400/10 p-3 text-left"
        >
          <span className="text-[10px] font-black tracking-wider text-yellow-200">PRÓXIMA AVENTURA</span>
          <p className="mt-1 font-black">{featured.title}</p>
          <p className="mt-1 text-xs font-bold opacity-80">⭐ {featured.points} XP · 💰 {formatBRL(featured.value_cents)}</p>
        </button>
      )}

      <div className="grid grid-cols-4 gap-2">
        {tiles.map((t) => (
          <button
            key={String(t.id)}
            type="button"
            onClick={() => open(t.id)}
            className="relative flex aspect-square flex-col items-center justify-center gap-0.5 rounded-xl border border-white/15 bg-slate-900/70 p-1"
          >
            {t.badge != null && t.badge > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-pink-500 px-1 text-[10px] font-black text-white">
                {t.badge > 9 ? "9+" : t.badge}
              </span>
            )}
            <span className="text-xl" aria-hidden>{t.icon}</span>
            <span className="text-[10px] font-bold uppercase">{t.label}</span>
          </button>
        ))}
      </div>

      {panel && (
        <div className="fixed inset-0 z-[10000] flex items-end justify-center bg-black/70 p-3 sm:items-center" role="presentation" onClick={() => setPanel(null)}>
          <div className="max-h-[85dvh] w-full max-w-lg overflow-y-auto rounded-2xl border border-cyan-400/40 bg-slate-950 p-3" role="dialog" onClick={(e) => e.stopPropagation()}>
            <div className="mb-2 flex items-center justify-between">
              <h2 className="font-black text-cyan-300">Painel</h2>
              <button type="button" className="rounded-full px-3 py-1 text-lg" onClick={() => setPanel(null)} aria-label="Fechar">×</button>
            </div>
            {body}
          </div>
        </div>
      )}
    </div>
  );
}
