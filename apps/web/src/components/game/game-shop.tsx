"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { equipGameItem, purchaseGameItem } from "@/lib/actions/game";
import type { GameAvatar, GameInventoryItem, GameItem, GameItemSlot } from "@/lib/domain/types";
import { GameAvatar as Avatar } from "@/components/game/game-avatar";

const SLOT_LABEL: Record<GameItemSlot, string> = {
  skin: "Pele",
  hair: "Cabelo",
  hat: "Chapéus",
  outfit: "Roupas",
  shoes: "Calçados",
  face: "Rosto",
  accessory: "Acessórios",
  pet: "Companheiros",
  aura: "Auras",
  background: "Cenários",
};

const RARITY: Record<string, string> = {
  common: "Comum",
  rare: "Raro",
  epic: "Épico",
  legendary: "Lendário",
  mythic: "Mítico",
};

export function GameShop({
  items,
  inventory,
  avatar,
  coins,
}: {
  items: GameItem[];
  inventory: GameInventoryItem[];
  avatar: GameAvatar;
  coins: number;
}) {
  const router = useRouter();
  const [slot, setSlot] = useState<GameItemSlot | "all">("all");
  const [pending, startTransition] = useTransition();
  const owned = useMemo(() => new Map(inventory.map((row) => [row.item_id, row.quantity])), [inventory]);
  const equipped = new Set(Object.values(avatar.config));

  const visible = slot === "all" ? items : items.filter((item) => item.slot === slot);

  function buy(item: GameItem) {
    startTransition(async () => {
      const result = await purchaseGameItem(item.id);
      if (!result.ok) alert(result.error);
      else router.refresh();
    });
  }

  function equip(item: GameItem) {
    startTransition(async () => {
      const result = await equipGameItem(item.id);
      if (!result.ok) alert(result.error);
      else router.refresh();
    });
  }

  return (
    <div className="game-shop space-y-5">
      <div className="grid gap-4 md:grid-cols-[180px_1fr]">
        <div className="flex flex-col items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-950/10 p-4">
          <Avatar config={avatar.config} items={items} size="md" />
          <p className="mt-2 text-xs font-bold uppercase tracking-wider text-cyan-300">Seu personagem</p>
          <p className="mt-1 text-sm font-black text-yellow-300">🪙 {coins} moedas</p>
        </div>

        <div className="min-w-0">
          <div className="mb-3 flex flex-wrap gap-1.5">
            <button type="button" onClick={() => setSlot("all")} className={"rounded-full px-3 py-1.5 text-xs font-bold " + (slot === "all" ? "bg-cyan-400 text-slate-950" : "bg-white/5 text-white/70")}>Tudo</button>
            {(Object.keys(SLOT_LABEL) as GameItemSlot[]).map((key) => (
              <button key={key} type="button" onClick={() => setSlot(key)} className={"rounded-full px-3 py-1.5 text-xs font-bold " + (slot === key ? "bg-cyan-400 text-slate-950" : "bg-white/5 text-white/70")}>
                {SLOT_LABEL[key]}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {visible.map((item) => {
              const count = owned.get(item.id) ?? 0;
              const isEquipped = equipped.has(item.slug);
              return (
                <article key={item.id} className="rounded-xl border border-white/10 bg-white/[.035] p-2.5">
                  <div className="flex h-20 items-center justify-center rounded-lg" style={{ background: item.color }}>
                    <span className="text-4xl drop-shadow-md" aria-hidden>{item.emoji}</span>
                  </div>
                  <p className="mt-2 truncate text-xs font-black">{item.name}</p>
                  <p className="text-[10px] text-white/50">{RARITY[item.rarity]} · {SLOT_LABEL[item.slot]}</p>
                  <p className="mt-1 line-clamp-2 min-h-7 text-[10px] text-white/55">{item.description}</p>
                  {isEquipped ? (
                    <span className="mt-2 block rounded-md bg-emerald-400/15 px-2 py-1 text-center text-[10px] font-bold text-emerald-300">EQUIPADO</span>
                  ) : count > 0 ? (
                    <button type="button" disabled={pending} onClick={() => equip(item)} className="mt-2 w-full rounded-md bg-cyan-400 px-2 py-1.5 text-[10px] font-black text-slate-950 disabled:opacity-50">EQUIPAR · {count}</button>
                  ) : (
                    <button type="button" disabled={pending || coins < item.price_coins} onClick={() => buy(item)} className="mt-2 w-full rounded-md bg-yellow-400 px-2 py-1.5 text-[10px] font-black text-slate-950 disabled:cursor-not-allowed disabled:opacity-35">🪙 {item.price_coins}</button>
                  )}
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
