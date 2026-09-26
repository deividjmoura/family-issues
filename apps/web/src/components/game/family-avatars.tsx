"use client";

import { useState, useTransition } from "react";
import { giftGameItem } from "@/lib/actions/game";
import type { GameAvatar, GameItem } from "@/lib/domain/types";
import { GameAvatar as Avatar } from "@/components/game/game-avatar";

type FamilyProfile = {
  userId: string;
  name: string;
  avatar: GameAvatar;
  inventoryCount: number;
  itemMap: Record<string, GameItem>;
};

export function FamilyAvatars({
  profiles,
}: {
  profiles: FamilyProfile[];
}) {
  const [recipient, setRecipient] = useState<FamilyProfile | null>(null);
  const [itemId, setItemId] = useState("");
  const [pending, startTransition] = useTransition();

  const items = profiles[0] ? Object.values(profiles[0].itemMap) : [];

  function sendGift() {
    if (!recipient || !itemId) return;
    startTransition(async () => {
      const message = window.prompt("Mensagem do presente (opcional)") ?? "";
      const result = await giftGameItem(recipient.userId, itemId, message);
      if (!result.ok) alert(result.error);
      else {
        alert("🎁 Presente enviado!");
        setRecipient(null);
        setItemId("");
      }
    });
  }

  if (!profiles.length) {
    return (
      <section className="rounded-2xl border border-border bg-card p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Personagens da família</h2>
        <p className="mt-2 text-sm text-muted-foreground">Quando um executor entrar na família, o personagem aparecerá aqui.</p>
      </section>
    );
  }

  return (
    <section className="responsavel-section-card rounded-2xl border border-border bg-card p-5">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[.18em] text-primary">Family Game</p>
          <h2 className="mt-1 text-xl font-black">Os personagens da família</h2>
          <p className="mt-1 text-sm text-muted-foreground">Veja a evolução, os itens e presenteie quem estiver jogando.</p>
        </div>
        <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">🎁 Presentes liberados</span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {profiles.map((profile) => (
          <article key={profile.userId} className="rounded-2xl border border-border bg-muted/20 p-4">
            <div className="flex items-center justify-center rounded-xl bg-gradient-to-br from-primary/10 via-purple-500/10 to-orange-500/10 py-4">
              <Avatar config={profile.avatar.config} items={items} size="md" name={profile.name} />
            </div>
            <div className="mt-3 flex items-center justify-between gap-2">
              <div>
                <p className="font-bold">{profile.name}</p>
                <p className="text-xs text-muted-foreground">🎒 {profile.inventoryCount} itens</p>
              </div>
              <button type="button" onClick={() => setRecipient(profile)} className="rounded-lg bg-primary px-3 py-2 text-xs font-bold text-primary-foreground">
                🎁 Presentear
              </button>
            </div>
          </article>
        ))}
      </div>

      {recipient && (
        <div className="fixed inset-0 z-[10001] grid place-items-center bg-black/60 p-4 backdrop-blur-sm" onClick={() => setRecipient(null)}>
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Presente</p>
                <h3 className="text-lg font-black">Escolha algo para {recipient.name}</h3>
              </div>
              <button type="button" onClick={() => setRecipient(null)} className="text-2xl text-muted-foreground">×</button>
            </div>
            <select value={itemId} onChange={(e) => setItemId(e.target.value)} className="mt-4 w-full rounded-xl border border-border bg-background px-3 py-3 text-sm">
              <option value="">Selecione um item…</option>
              {items.map((item) => (
                <option key={item.id} value={item.id}>🪙 {item.name} — {item.price_coins} moedas</option>
              ))}
            </select>
            <p className="mt-2 text-xs text-muted-foreground">O presente não desconta moedas do responsável. É uma recompensa direta para o executor.</p>
            <button type="button" disabled={!itemId || pending} onClick={sendGift} className="mt-4 w-full rounded-xl bg-primary px-4 py-3 text-sm font-black text-primary-foreground disabled:opacity-40">
              {pending ? "Enviando…" : "🎁 Enviar presente"}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
