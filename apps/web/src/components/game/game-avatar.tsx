import type { GameItem } from "@/lib/domain/types";

export function GameAvatar({
  config,
  items,
  size = "md",
  name,
}: {
  config: Record<string, string>;
  items: GameItem[];
  size?: "sm" | "md" | "lg";
  name?: string;
}) {
  const bySlug = new Map(items.map((item) => [item.slug, item]));
  const get = (slot: string) => bySlug.get(config[slot]);
  const skin = get("skin");
  const hair = get("hair");
  const hat = get("hat");
  const outfit = get("outfit");
  const shoes = get("shoes");
  const face = get("face");
  const accessory = get("accessory");
  const pet = get("pet");
  const aura = get("aura");
  const background = get("background");

  const sizes = {
    sm: { root: "w-20 h-24", head: "w-12 h-12", body: "text-3xl", item: "text-lg" },
    md: { root: "w-32 h-36", head: "w-20 h-20", body: "text-5xl", item: "text-2xl" },
    lg: { root: "w-44 h-52", head: "w-28 h-28", body: "text-7xl", item: "text-3xl" },
  }[size];

  return (
    <div className="flex flex-col items-center gap-1" aria-label={name ? "Personagem de " + name : "Personagem"}>
      <div
        className={"relative overflow-hidden rounded-[28%] border border-white/15 shadow-2xl " + sizes.root}
        style={{ background: background?.color ?? "#182337" }}
      >
        {aura && <span className="absolute inset-2 rounded-full opacity-80 blur-md" style={{ background: aura.color }} aria-hidden /> }
        <div className="absolute inset-x-0 bottom-1/4 flex justify-center">
          <div
            className={"relative flex items-center justify-center rounded-full border-2 border-black/10 shadow-lg " + sizes.head}
            style={{ background: skin?.color ?? "#f2c9a5" }}
          >
            <span className={"relative z-10 " + sizes.item} aria-hidden>{face?.emoji ?? "😊"}</span>
            {hair && <span className={"absolute -top-2 left-1/2 -translate-x-1/2 " + sizes.item} aria-hidden>{hair.emoji}</span>}
            {hat && <span className={"absolute -top-5 left-1/2 -translate-x-1/2 " + sizes.item} aria-hidden>{hat.emoji}</span>}
            {accessory && <span className={"absolute -right-3 bottom-0 " + sizes.item} aria-hidden>{accessory.emoji}</span>}
          </div>
        </div>
        <div className="absolute inset-x-0 bottom-0 flex flex-col items-center">
          <span className={"leading-none " + sizes.body} aria-hidden>{outfit?.emoji ?? "👕"}</span>
          {shoes && <span className="text-lg leading-none" aria-hidden>{shoes.emoji}</span>}
        </div>
        {pet && <span className="absolute bottom-2 right-2 text-2xl drop-shadow-md" aria-hidden>{pet.emoji}</span>}
        {aura && <span className="absolute inset-0 rounded-[28%] border-2 opacity-60" style={{ borderColor: aura.color }} aria-hidden /> }
      </div>
      {name && <span className="max-w-full truncate text-xs font-bold text-foreground">{name}</span>}
    </div>
  );
}
