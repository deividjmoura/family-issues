-- V3 Game World: avatar, shop, inventory, gifts and 200+ daily challenges.
-- All game tables are protected by RLS; purchases are atomic in a database function.

create table if not exists public.game_items (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text not null,
  slot text not null check (slot in ('skin','hair','hat','outfit','shoes','face','accessory','pet','aura','background')),
  emoji text not null,
  color text not null default '#3b82f6',
  rarity text not null default 'common' check (rarity in ('common','rare','epic','legendary','mythic')),
  price_coins integer not null check (price_coins >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.game_inventory (
  user_id uuid not null references auth.users(id) on delete cascade,
  item_id uuid not null references public.game_items(id) on delete cascade,
  quantity integer not null default 1 check (quantity > 0),
  source text not null default 'purchase' check (source in ('purchase','gift','starter')),
  updated_at timestamptz not null default now(),
  primary key (user_id, item_id)
);

create table if not exists public.game_purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  item_id uuid not null references public.game_items(id) on delete restrict,
  price_coins integer not null check (price_coins > 0),
  created_at timestamptz not null default now()
);

create table if not exists public.game_gifts (
  id uuid primary key default gen_random_uuid(),
  from_user_id uuid not null references auth.users(id) on delete cascade,
  to_user_id uuid not null references auth.users(id) on delete cascade,
  item_id uuid not null references public.game_items(id) on delete restrict,
  message text,
  created_at timestamptz not null default now()
);

create table if not exists public.game_avatars (
  user_id uuid primary key references auth.users(id) on delete cascade,
  config jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.daily_challenges (
  id uuid primary key default gen_random_uuid(),
  challenge_key text not null unique,
  category text not null,
  title text not null,
  description text not null,
  value_cents integer not null default 0 check (value_cents >= 0),
  points integer not null check (points > 0),
  icon text not null default '⭐',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.tasks add column if not exists daily_challenge_id uuid references public.daily_challenges(id) on delete set null;
alter table public.tasks add column if not exists daily_challenge_date date;
create index if not exists tasks_daily_challenge_idx on public.tasks(daily_challenge_id, daily_challenge_date);
create unique index if not exists tasks_one_daily_challenge_per_user_day
  on public.tasks(family_id, assignee_id, daily_challenge_id, daily_challenge_date)
  where daily_challenge_id is not null;

create index if not exists game_inventory_user_idx on public.game_inventory(user_id);
create index if not exists game_purchases_user_idx on public.game_purchases(user_id);
create index if not exists game_gifts_to_user_idx on public.game_gifts(to_user_id);
create index if not exists daily_challenges_category_idx on public.daily_challenges(category);

alter table public.game_items enable row level security;
alter table public.game_inventory enable row level security;
alter table public.game_purchases enable row level security;
alter table public.game_gifts enable row level security;
alter table public.game_avatars enable row level security;
alter table public.daily_challenges enable row level security;

drop policy if exists game_items_select on public.game_items;
create policy game_items_select on public.game_items for select to authenticated using (true);

drop policy if exists game_inventory_select on public.game_inventory;
create policy game_inventory_select on public.game_inventory for select to authenticated using (
  (select auth.uid()) = user_id
  or exists (
    select 1 from public.family_members me
    join public.family_members target on target.family_id = me.family_id
    where me.user_id = (select auth.uid())
      and me.role = 'responsavel'
      and target.user_id = game_inventory.user_id
  )
);

drop policy if exists game_avatars_select on public.game_avatars;
create policy game_avatars_select on public.game_avatars for select to authenticated using (
  (select auth.uid()) = user_id
  or exists (
    select 1 from public.family_members me
    join public.family_members target on target.family_id = me.family_id
    where me.user_id = (select auth.uid())
      and me.role = 'responsavel'
      and target.user_id = game_avatars.user_id
  )
);

drop policy if exists game_avatars_insert on public.game_avatars;
create policy game_avatars_insert on public.game_avatars for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists game_avatars_update on public.game_avatars;
create policy game_avatars_update on public.game_avatars for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists game_purchases_select on public.game_purchases;
create policy game_purchases_select on public.game_purchases for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists game_gifts_select on public.game_gifts;
create policy game_gifts_select on public.game_gifts for select to authenticated using (
  (select auth.uid()) = from_user_id or (select auth.uid()) = to_user_id
);

drop policy if exists daily_challenges_select on public.daily_challenges;
create policy daily_challenges_select on public.daily_challenges for select to authenticated using (active);

revoke all on table public.game_items, public.game_inventory, public.game_purchases, public.game_gifts, public.game_avatars, public.daily_challenges from anon, authenticated;
grant select on public.game_items, public.daily_challenges to authenticated;
grant select on public.game_inventory, public.game_purchases, public.game_gifts, public.game_avatars to authenticated;
grant insert, update on public.game_avatars to authenticated;

insert into public.daily_challenges (challenge_key, category, title, description, value_cents, points, icon)
values
('daily-001','Quarto','Arrume a cama','Desafio quarto — conclua esta missão e ganhe 8 XP.',0,8,'🛏️'),
('daily-002','Quarto','Organize a mesa de cabeceira','Desafio quarto — conclua esta missão e ganhe 8 XP.',0,8,'🛏️'),
('daily-003','Quarto','Guarde as roupas limpas','Desafio quarto — conclua esta missão e ganhe 8 XP.',0,8,'🛏️'),
('daily-004','Quarto','Separe as roupas para lavar','Desafio quarto — conclua esta missão e ganhe 8 XP.',0,8,'🛏️'),
('daily-005','Quarto','Organize seus livros','Desafio quarto — conclua esta missão e ganhe 8 XP.',0,8,'🛏️'),
('daily-006','Quarto','Arrume seus brinquedos','Desafio quarto — conclua esta missão e ganhe 12 XP.',0,12,'🛏️'),
('daily-007','Quarto','Deixe o chão livre','Desafio quarto — conclua esta missão e ganhe 12 XP.',0,12,'🛏️'),
('daily-008','Quarto','Organize a mochila','Desafio quarto — conclua esta missão e ganhe 12 XP.',0,12,'🛏️'),
('daily-009','Quarto','Guarde os sapatos','Desafio quarto — conclua esta missão e ganhe 12 XP.',0,12,'🛏️'),
('daily-010','Quarto','Dobre um cobertor','Desafio quarto — conclua esta missão e ganhe 12 XP.',0,12,'🛏️'),
('daily-011','Quarto','Organize uma gaveta','Desafio quarto — conclua esta missão e ganhe 12 XP.',0,12,'🛏️'),
('daily-012','Quarto','Separe objetos fora do lugar','Desafio quarto — conclua esta missão e ganhe 12 XP.',0,12,'🛏️'),
('daily-013','Quarto','Limpe uma prateleira','Desafio quarto — conclua esta missão e ganhe 16 XP.',0,16,'🛏️'),
('daily-014','Quarto','Organize seus cabides','Desafio quarto — conclua esta missão e ganhe 16 XP.',0,16,'🛏️'),
('daily-015','Quarto','Guarde acessórios','Desafio quarto — conclua esta missão e ganhe 16 XP.',0,16,'🛏️'),
('daily-016','Quarto','Arrume o criado-mudo','Desafio quarto — conclua esta missão e ganhe 16 XP.',0,16,'🛏️'),
('daily-017','Quarto','Faça uma pequena organização no armário','Desafio quarto — conclua esta missão e ganhe 16 XP.',0,16,'🛏️'),
('daily-018','Quarto','Separe cinco coisas para guardar','Desafio quarto — conclua esta missão e ganhe 20 XP.',0,20,'🛏️'),
('daily-019','Quarto','Deixe o quarto pronto para dormir','Desafio quarto — conclua esta missão e ganhe 20 XP.',0,20,'🛏️'),
('daily-020','Quarto','Faça uma inspeção final no quarto','Desafio quarto — conclua esta missão e ganhe 20 XP.',0,20,'🛏️'),
('daily-021','Cozinha','Guarde a louça limpa','Desafio cozinha — conclua esta missão e ganhe 8 XP.',0,8,'🍳'),
('daily-022','Cozinha','Lave sua louça','Desafio cozinha — conclua esta missão e ganhe 8 XP.',0,8,'🍳'),
('daily-023','Cozinha','Limpe a mesa','Desafio cozinha — conclua esta missão e ganhe 8 XP.',0,8,'🍳'),
('daily-024','Cozinha','Limpe a bancada','Desafio cozinha — conclua esta missão e ganhe 8 XP.',0,8,'🍳'),
('daily-025','Cozinha','Organize os talheres','Desafio cozinha — conclua esta missão e ganhe 8 XP.',0,8,'🍳'),
('daily-026','Cozinha','Guarde os copos','Desafio cozinha — conclua esta missão e ganhe 12 XP.',0,12,'🍳'),
('daily-027','Cozinha','Encha a garrafa de água','Desafio cozinha — conclua esta missão e ganhe 12 XP.',0,12,'🍳'),
('daily-028','Cozinha','Limpe uma prateleira da geladeira','Desafio cozinha — conclua esta missão e ganhe 12 XP.',0,12,'🍳'),
('daily-029','Cozinha','Organize os temperos','Desafio cozinha — conclua esta missão e ganhe 12 XP.',0,12,'🍳'),
('daily-030','Cozinha','Recolha a mesa após a refeição','Desafio cozinha — conclua esta missão e ganhe 12 XP.',0,12,'🍳'),
('daily-031','Cozinha','Limpe o micro-ondas por fora','Desafio cozinha — conclua esta missão e ganhe 12 XP.',0,12,'🍳'),
('daily-032','Cozinha','Varra a cozinha','Desafio cozinha — conclua esta missão e ganhe 12 XP.',0,12,'🍳'),
('daily-033','Cozinha','Passe pano em uma área da cozinha','Desafio cozinha — conclua esta missão e ganhe 16 XP.',0,16,'🍳'),
('daily-034','Cozinha','Guarde os alimentos','Desafio cozinha — conclua esta missão e ganhe 16 XP.',0,16,'🍳'),
('daily-035','Cozinha','Organize um armário','Desafio cozinha — conclua esta missão e ganhe 16 XP.',0,16,'🍳'),
('daily-036','Cozinha','Separe recicláveis da cozinha','Desafio cozinha — conclua esta missão e ganhe 16 XP.',0,16,'🍳'),
('daily-037','Cozinha','Limpe a pia','Desafio cozinha — conclua esta missão e ganhe 16 XP.',0,16,'🍳'),
('daily-038','Cozinha','Ajude a preparar a mesa','Desafio cozinha — conclua esta missão e ganhe 20 XP.',0,20,'🍳'),
('daily-039','Cozinha','Confira se a geladeira ficou organizada','Desafio cozinha — conclua esta missão e ganhe 20 XP.',0,20,'🍳'),
('daily-040','Cozinha','Faça uma ronda final na cozinha','Desafio cozinha — conclua esta missão e ganhe 20 XP.',0,20,'🍳'),
('daily-041','Casa','Varra a sala','Desafio casa — conclua esta missão e ganhe 8 XP.',0,8,'🏠'),
('daily-042','Casa','Passe pano na sala','Desafio casa — conclua esta missão e ganhe 8 XP.',0,8,'🏠'),
('daily-043','Casa','Organize o sofá','Desafio casa — conclua esta missão e ganhe 8 XP.',0,8,'🏠'),
('daily-044','Casa','Recolha objetos da sala','Desafio casa — conclua esta missão e ganhe 8 XP.',0,8,'🏠'),
('daily-045','Casa','Tire o lixo','Desafio casa — conclua esta missão e ganhe 8 XP.',0,8,'🏠'),
('daily-046','Casa','Troque o saco da lixeira','Desafio casa — conclua esta missão e ganhe 12 XP.',0,12,'🏠'),
('daily-047','Casa','Organize os sapatos da entrada','Desafio casa — conclua esta missão e ganhe 12 XP.',0,12,'🏠'),
('daily-048','Casa','Limpe uma porta','Desafio casa — conclua esta missão e ganhe 12 XP.',0,12,'🏠'),
('daily-049','Casa','Limpe uma maçaneta','Desafio casa — conclua esta missão e ganhe 12 XP.',0,12,'🏠'),
('daily-050','Casa','Organize a mesa de jantar','Desafio casa — conclua esta missão e ganhe 12 XP.',0,12,'🏠'),
('daily-051','Casa','Ajude a arrumar a casa','Desafio casa — conclua esta missão e ganhe 12 XP.',0,12,'🏠'),
('daily-052','Casa','Recolha almofadas','Desafio casa — conclua esta missão e ganhe 12 XP.',0,12,'🏠'),
('daily-053','Casa','Limpe uma superfície empoeirada','Desafio casa — conclua esta missão e ganhe 16 XP.',0,16,'🏠'),
('daily-054','Casa','Organize um canto da casa','Desafio casa — conclua esta missão e ganhe 16 XP.',0,16,'🏠'),
('daily-055','Casa','Junte papéis espalhados','Desafio casa — conclua esta missão e ganhe 16 XP.',0,16,'🏠'),
('daily-056','Casa','Separe recicláveis','Desafio casa — conclua esta missão e ganhe 16 XP.',0,16,'🏠'),
('daily-057','Casa','Limpe um espelho','Desafio casa — conclua esta missão e ganhe 16 XP.',0,16,'🏠'),
('daily-058','Casa','Organize o corredor','Desafio casa — conclua esta missão e ganhe 20 XP.',0,20,'🏠'),
('daily-059','Casa','Faça uma volta pela casa e guarde o que estiver fora do lugar','Desafio casa — conclua esta missão e ganhe 20 XP.',0,20,'🏠'),
('daily-060','Casa','Deixe a sala pronta para receber alguém','Desafio casa — conclua esta missão e ganhe 20 XP.',0,20,'🏠'),
('daily-061','Banheiro','Organize seus produtos','Desafio banheiro — conclua esta missão e ganhe 8 XP.',0,8,'🧼'),
('daily-062','Banheiro','Guarde as toalhas','Desafio banheiro — conclua esta missão e ganhe 8 XP.',0,8,'🧼'),
('daily-063','Banheiro','Troque a toalha de rosto','Desafio banheiro — conclua esta missão e ganhe 8 XP.',0,8,'🧼'),
('daily-064','Banheiro','Limpe a pia','Desafio banheiro — conclua esta missão e ganhe 8 XP.',0,8,'🧼'),
('daily-065','Banheiro','Passe pano no chão','Desafio banheiro — conclua esta missão e ganhe 8 XP.',0,8,'🧼'),
('daily-066','Banheiro','Reponha o papel higiênico','Desafio banheiro — conclua esta missão e ganhe 12 XP.',0,12,'🧼'),
('daily-067','Banheiro','Organize o armário','Desafio banheiro — conclua esta missão e ganhe 12 XP.',0,12,'🧼'),
('daily-068','Banheiro','Limpe o espelho','Desafio banheiro — conclua esta missão e ganhe 12 XP.',0,12,'🧼'),
('daily-069','Banheiro','Recolha roupas do banheiro','Desafio banheiro — conclua esta missão e ganhe 12 XP.',0,12,'🧼'),
('daily-070','Banheiro','Coloque roupas sujas no cesto','Desafio banheiro — conclua esta missão e ganhe 12 XP.',0,12,'🧼'),
('daily-071','Banheiro','Confira os produtos vazios','Desafio banheiro — conclua esta missão e ganhe 12 XP.',0,12,'🧼'),
('daily-072','Banheiro','Organize escovas e cremes','Desafio banheiro — conclua esta missão e ganhe 12 XP.',0,12,'🧼'),
('daily-073','Banheiro','Limpe uma prateleira','Desafio banheiro — conclua esta missão e ganhe 16 XP.',0,16,'🧼'),
('daily-074','Banheiro','Lave a lixeira','Desafio banheiro — conclua esta missão e ganhe 16 XP.',0,16,'🧼'),
('daily-075','Banheiro','Ajude na limpeza do banheiro','Desafio banheiro — conclua esta missão e ganhe 16 XP.',0,16,'🧼'),
('daily-076','Banheiro','Deixe a bancada livre','Desafio banheiro — conclua esta missão e ganhe 16 XP.',0,16,'🧼'),
('daily-077','Banheiro','Organize as toalhas','Desafio banheiro — conclua esta missão e ganhe 16 XP.',0,16,'🧼'),
('daily-078','Banheiro','Faça uma revisão rápida no banheiro','Desafio banheiro — conclua esta missão e ganhe 20 XP.',0,20,'🧼'),
('daily-079','Banheiro','Reponha um item que acabou','Desafio banheiro — conclua esta missão e ganhe 20 XP.',0,20,'🧼'),
('daily-080','Banheiro','Deixe o banheiro pronto para o próximo uso','Desafio banheiro — conclua esta missão e ganhe 20 XP.',0,20,'🧼'),
('daily-081','Roupas','Coloque roupas sujas no cesto','Desafio roupas — conclua esta missão e ganhe 8 XP.',0,8,'👕'),
('daily-082','Roupas','Dobre cinco peças','Desafio roupas — conclua esta missão e ganhe 8 XP.',0,8,'👕'),
('daily-083','Roupas','Guarde suas roupas','Desafio roupas — conclua esta missão e ganhe 8 XP.',0,8,'👕'),
('daily-084','Roupas','Separe roupas claras e escuras','Desafio roupas — conclua esta missão e ganhe 8 XP.',0,8,'👕'),
('daily-085','Roupas','Organize uma gaveta de roupas','Desafio roupas — conclua esta missão e ganhe 8 XP.',0,8,'👕'),
('daily-086','Roupas','Separe peças para doação','Desafio roupas — conclua esta missão e ganhe 12 XP.',0,12,'👕'),
('daily-087','Roupas','Combine as meias','Desafio roupas — conclua esta missão e ganhe 12 XP.',0,12,'👕'),
('daily-088','Roupas','Guarde os pijamas','Desafio roupas — conclua esta missão e ganhe 12 XP.',0,12,'👕'),
('daily-089','Roupas','Organize os cabides','Desafio roupas — conclua esta missão e ganhe 12 XP.',0,12,'👕'),
('daily-090','Roupas','Leve roupas para a lavanderia','Desafio roupas — conclua esta missão e ganhe 12 XP.',0,12,'👕'),
('daily-091','Roupas','Retire roupas secas do varal','Desafio roupas — conclua esta missão e ganhe 12 XP.',0,12,'👕'),
('daily-092','Roupas','Dobre uma toalha','Desafio roupas — conclua esta missão e ganhe 12 XP.',0,12,'👕'),
('daily-093','Roupas','Guarde roupas de cama','Desafio roupas — conclua esta missão e ganhe 16 XP.',0,16,'👕'),
('daily-094','Roupas','Separe uma troca para amanhã','Desafio roupas — conclua esta missão e ganhe 16 XP.',0,16,'👕'),
('daily-095','Roupas','Organize seus acessórios','Desafio roupas — conclua esta missão e ganhe 16 XP.',0,16,'👕'),
('daily-096','Roupas','Confira se há roupas no chão','Desafio roupas — conclua esta missão e ganhe 16 XP.',0,16,'👕'),
('daily-097','Roupas','Ajude a estender roupas','Desafio roupas — conclua esta missão e ganhe 16 XP.',0,16,'👕'),
('daily-098','Roupas','Ajude a recolher roupas','Desafio roupas — conclua esta missão e ganhe 20 XP.',0,20,'👕'),
('daily-099','Roupas','Monte um pequeno conjunto para o dia seguinte','Desafio roupas — conclua esta missão e ganhe 20 XP.',0,20,'👕'),
('daily-100','Roupas','Deixe a área de roupas organizada','Desafio roupas — conclua esta missão e ganhe 20 XP.',0,20,'👕'),
('daily-101','Pet','Coloque água fresca para o pet','Desafio pet — conclua esta missão e ganhe 8 XP.',0,8,'🐾'),
('daily-102','Pet','Coloque comida para o pet','Desafio pet — conclua esta missão e ganhe 8 XP.',0,8,'🐾'),
('daily-103','Pet','Recolha brinquedos do pet','Desafio pet — conclua esta missão e ganhe 8 XP.',0,8,'🐾'),
('daily-104','Pet','Brinque com o pet por alguns minutos','Desafio pet — conclua esta missão e ganhe 8 XP.',0,8,'🐾'),
('daily-105','Pet','Escove o pet','Desafio pet — conclua esta missão e ganhe 8 XP.',0,8,'🐾'),
('daily-106','Pet','Limpe o espaço do pet','Desafio pet — conclua esta missão e ganhe 12 XP.',0,12,'🐾'),
('daily-107','Pet','Lave o pote de água','Desafio pet — conclua esta missão e ganhe 12 XP.',0,12,'🐾'),
('daily-108','Pet','Lave o pote de comida','Desafio pet — conclua esta missão e ganhe 12 XP.',0,12,'🐾'),
('daily-109','Pet','Confira se o pet tem água','Desafio pet — conclua esta missão e ganhe 12 XP.',0,12,'🐾'),
('daily-110','Pet','Guarde os acessórios do pet','Desafio pet — conclua esta missão e ganhe 12 XP.',0,12,'🐾'),
('daily-111','Pet','Organize os brinquedos do pet','Desafio pet — conclua esta missão e ganhe 12 XP.',0,12,'🐾'),
('daily-112','Pet','Ajude no passeio','Desafio pet — conclua esta missão e ganhe 12 XP.',0,12,'🐾'),
('daily-113','Pet','Recolha sujeira do pet','Desafio pet — conclua esta missão e ganhe 16 XP.',0,16,'🐾'),
('daily-114','Pet','Troque a manta do pet','Desafio pet — conclua esta missão e ganhe 16 XP.',0,16,'🐾'),
('daily-115','Pet','Deixe o cantinho do pet arrumado','Desafio pet — conclua esta missão e ganhe 16 XP.',0,16,'🐾'),
('daily-116','Pet','Confira a ração','Desafio pet — conclua esta missão e ganhe 16 XP.',0,16,'🐾'),
('daily-117','Pet','Ajude a preparar o passeio','Desafio pet — conclua esta missão e ganhe 16 XP.',0,16,'🐾'),
('daily-118','Pet','Dê atenção ao pet por dez minutos','Desafio pet — conclua esta missão e ganhe 20 XP.',0,20,'🐾'),
('daily-119','Pet','Faça uma pequena limpeza no espaço do pet','Desafio pet — conclua esta missão e ganhe 20 XP.',0,20,'🐾'),
('daily-120','Pet','Finalize o dia deixando o cantinho do pet pronto','Desafio pet — conclua esta missão e ganhe 20 XP.',0,20,'🐾'),
('daily-121','Estudo','Organize os materiais','Desafio estudo — conclua esta missão e ganhe 8 XP.',0,8,'📚'),
('daily-122','Estudo','Guarde os cadernos','Desafio estudo — conclua esta missão e ganhe 8 XP.',0,8,'📚'),
('daily-123','Estudo','Separe o material de amanhã','Desafio estudo — conclua esta missão e ganhe 8 XP.',0,8,'📚'),
('daily-124','Estudo','Arrume a mesa de estudo','Desafio estudo — conclua esta missão e ganhe 8 XP.',0,8,'📚'),
('daily-125','Estudo','Revise uma atividade','Desafio estudo — conclua esta missão e ganhe 8 XP.',0,8,'📚'),
('daily-126','Estudo','Leia algumas páginas','Desafio estudo — conclua esta missão e ganhe 12 XP.',0,12,'📚'),
('daily-127','Estudo','Organize os livros','Desafio estudo — conclua esta missão e ganhe 12 XP.',0,12,'📚'),
('daily-128','Estudo','Guarde os lápis','Desafio estudo — conclua esta missão e ganhe 12 XP.',0,12,'📚'),
('daily-129','Estudo','Apague rascunhos desnecessários','Desafio estudo — conclua esta missão e ganhe 12 XP.',0,12,'📚'),
('daily-130','Estudo','Separe a mochila','Desafio estudo — conclua esta missão e ganhe 12 XP.',0,12,'📚'),
('daily-131','Estudo','Confira a agenda','Desafio estudo — conclua esta missão e ganhe 12 XP.',0,12,'📚'),
('daily-132','Estudo','Organize uma pasta','Desafio estudo — conclua esta missão e ganhe 12 XP.',0,12,'📚'),
('daily-133','Estudo','Revise uma matéria por dez minutos','Desafio estudo — conclua esta missão e ganhe 16 XP.',0,16,'📚'),
('daily-134','Estudo','Faça uma tarefa pendente','Desafio estudo — conclua esta missão e ganhe 16 XP.',0,16,'📚'),
('daily-135','Estudo','Limpe a mesa de estudo','Desafio estudo — conclua esta missão e ganhe 16 XP.',0,16,'📚'),
('daily-136','Estudo','Separe um livro para leitura','Desafio estudo — conclua esta missão e ganhe 16 XP.',0,16,'📚'),
('daily-137','Estudo','Organize arquivos escolares','Desafio estudo — conclua esta missão e ganhe 16 XP.',0,16,'📚'),
('daily-138','Estudo','Confira se não esqueceu nenhum material','Desafio estudo — conclua esta missão e ganhe 20 XP.',0,20,'📚'),
('daily-139','Estudo','Prepare o espaço para estudar amanhã','Desafio estudo — conclua esta missão e ganhe 20 XP.',0,20,'📚'),
('daily-140','Estudo','Deixe a mochila pronta','Desafio estudo — conclua esta missão e ganhe 20 XP.',0,20,'📚'),
('daily-141','Família','Ajude alguém da família','Desafio família — conclua esta missão e ganhe 8 XP.',0,8,'💛'),
('daily-142','Família','Pergunte se alguém precisa de ajuda','Desafio família — conclua esta missão e ganhe 8 XP.',0,8,'💛'),
('daily-143','Família','Faça um elogio sincero','Desafio família — conclua esta missão e ganhe 8 XP.',0,8,'💛'),
('daily-144','Família','Ajude sem ser chamado','Desafio família — conclua esta missão e ganhe 8 XP.',0,8,'💛'),
('daily-145','Família','Prepare algo simples para alguém','Desafio família — conclua esta missão e ganhe 8 XP.',0,8,'💛'),
('daily-146','Família','Compartilhe uma tarefa','Desafio família — conclua esta missão e ganhe 12 XP.',0,12,'💛'),
('daily-147','Família','Agradeça alguém da família','Desafio família — conclua esta missão e ganhe 12 XP.',0,12,'💛'),
('daily-148','Família','Faça uma surpresa simples','Desafio família — conclua esta missão e ganhe 12 XP.',0,12,'💛'),
('daily-149','Família','Ajude um irmão ou irmã','Desafio família — conclua esta missão e ganhe 12 XP.',0,12,'💛'),
('daily-150','Família','Dê atenção a alguém por dez minutos','Desafio família — conclua esta missão e ganhe 12 XP.',0,12,'💛'),
('daily-151','Família','Faça uma gentileza inesperada','Desafio família — conclua esta missão e ganhe 12 XP.',0,12,'💛'),
('daily-152','Família','Ofereça ajuda em uma tarefa','Desafio família — conclua esta missão e ganhe 12 XP.',0,12,'💛'),
('daily-153','Família','Ajude a organizar um espaço comum','Desafio família — conclua esta missão e ganhe 16 XP.',0,16,'💛'),
('daily-154','Família','Pergunte como foi o dia de alguém','Desafio família — conclua esta missão e ganhe 16 XP.',0,16,'💛'),
('daily-155','Família','Ajude alguém que esteja ocupado','Desafio família — conclua esta missão e ganhe 16 XP.',0,16,'💛'),
('daily-156','Família','Faça uma tarefa que normalmente não é sua','Desafio família — conclua esta missão e ganhe 16 XP.',0,16,'💛'),
('daily-157','Família','Deixe uma mensagem positiva','Desafio família — conclua esta missão e ganhe 16 XP.',0,16,'💛'),
('daily-158','Família','Compartilhe uma recompensa','Desafio família — conclua esta missão e ganhe 20 XP.',0,20,'💛'),
('daily-159','Família','Reconheça o esforço de alguém','Desafio família — conclua esta missão e ganhe 20 XP.',0,20,'💛'),
('daily-160','Família','Faça uma boa ação em família','Desafio família — conclua esta missão e ganhe 20 XP.',0,20,'💛'),
('daily-161','Autonomia','Prepare suas coisas sozinho','Desafio autonomia — conclua esta missão e ganhe 8 XP.',0,8,'⚡'),
('daily-162','Autonomia','Escolha sua roupa e deixe pronta','Desafio autonomia — conclua esta missão e ganhe 8 XP.',0,8,'⚡'),
('daily-163','Autonomia','Organize sua agenda','Desafio autonomia — conclua esta missão e ganhe 8 XP.',0,8,'⚡'),
('daily-164','Autonomia','Programe um lembrete','Desafio autonomia — conclua esta missão e ganhe 8 XP.',0,8,'⚡'),
('daily-165','Autonomia','Prepare uma garrafa de água','Desafio autonomia — conclua esta missão e ganhe 8 XP.',0,8,'⚡'),
('daily-166','Autonomia','Confira seus compromissos','Desafio autonomia — conclua esta missão e ganhe 12 XP.',0,12,'⚡'),
('daily-167','Autonomia','Deixe suas coisas prontas para amanhã','Desafio autonomia — conclua esta missão e ganhe 12 XP.',0,12,'⚡'),
('daily-168','Autonomia','Organize seus cabos','Desafio autonomia — conclua esta missão e ganhe 12 XP.',0,12,'⚡'),
('daily-169','Autonomia','Cuide de um objeto pessoal','Desafio autonomia — conclua esta missão e ganhe 12 XP.',0,12,'⚡'),
('daily-170','Autonomia','Faça uma lista curta de prioridades','Desafio autonomia — conclua esta missão e ganhe 12 XP.',0,12,'⚡'),
('daily-171','Autonomia','Complete uma tarefa sem lembrete','Desafio autonomia — conclua esta missão e ganhe 12 XP.',0,12,'⚡'),
('daily-172','Autonomia','Resolva uma pequena pendência','Desafio autonomia — conclua esta missão e ganhe 12 XP.',0,12,'⚡'),
('daily-173','Autonomia','Organize seu material pessoal','Desafio autonomia — conclua esta missão e ganhe 16 XP.',0,16,'⚡'),
('daily-174','Autonomia','Separe o que precisa levar','Desafio autonomia — conclua esta missão e ganhe 16 XP.',0,16,'⚡'),
('daily-175','Autonomia','Confira seu espaço antes de sair','Desafio autonomia — conclua esta missão e ganhe 16 XP.',0,16,'⚡'),
('daily-176','Autonomia','Faça uma rotina de cinco minutos de organização','Desafio autonomia — conclua esta missão e ganhe 16 XP.',0,16,'⚡'),
('daily-177','Autonomia','Planeje uma tarefa da semana','Desafio autonomia — conclua esta missão e ganhe 16 XP.',0,16,'⚡'),
('daily-178','Autonomia','Termine algo que começou','Desafio autonomia — conclua esta missão e ganhe 20 XP.',0,20,'⚡'),
('daily-179','Autonomia','Escolha uma tarefa extra para ajudar','Desafio autonomia — conclua esta missão e ganhe 20 XP.',0,20,'⚡'),
('daily-180','Autonomia','Faça seu check-list de fim do dia','Desafio autonomia — conclua esta missão e ganhe 20 XP.',0,20,'⚡'),
('daily-181','Extra','Faça uma tarefa extra da casa','Desafio extra — conclua esta missão e ganhe 8 XP.',0,8,'✨'),
('daily-182','Extra','Organize um pequeno espaço esquecido','Desafio extra — conclua esta missão e ganhe 8 XP.',0,8,'✨'),
('daily-183','Extra','Limpe algo que você usa todos os dias','Desafio extra — conclua esta missão e ganhe 8 XP.',0,8,'✨'),
('daily-184','Extra','Ajude por quinze minutos','Desafio extra — conclua esta missão e ganhe 8 XP.',0,8,'✨'),
('daily-185','Extra','Escolha uma tarefa rápida e conclua','Desafio extra — conclua esta missão e ganhe 8 XP.',0,8,'✨'),
('daily-186','Extra','Faça uma ronda de organização','Desafio extra — conclua esta missão e ganhe 12 XP.',0,12,'✨'),
('daily-187','Extra','Encontre três coisas fora do lugar e guarde','Desafio extra — conclua esta missão e ganhe 12 XP.',0,12,'✨'),
('daily-188','Extra','Ajude a deixar a casa mais agradável','Desafio extra — conclua esta missão e ganhe 12 XP.',0,12,'✨'),
('daily-189','Extra','Faça uma tarefa antes de alguém pedir','Desafio extra — conclua esta missão e ganhe 12 XP.',0,12,'✨'),
('daily-190','Extra','Organize algo que estava acumulando','Desafio extra — conclua esta missão e ganhe 12 XP.',0,12,'✨'),
('daily-191','Extra','Faça uma limpeza expressa de cinco minutos','Desafio extra — conclua esta missão e ganhe 12 XP.',0,12,'✨'),
('daily-192','Extra','Escolha um canto e deixe melhor','Desafio extra — conclua esta missão e ganhe 12 XP.',0,12,'✨'),
('daily-193','Extra','Ajude na preparação de uma refeição','Desafio extra — conclua esta missão e ganhe 16 XP.',0,16,'✨'),
('daily-194','Extra','Ajude na organização do fim do dia','Desafio extra — conclua esta missão e ganhe 16 XP.',0,16,'✨'),
('daily-195','Extra','Faça uma tarefa surpresa para a família','Desafio extra — conclua esta missão e ganhe 16 XP.',0,16,'✨'),
('daily-196','Extra','Conclua uma tarefa simples com capricho','Desafio extra — conclua esta missão e ganhe 16 XP.',0,16,'✨'),
('daily-197','Extra','Deixe um espaço melhor do que encontrou','Desafio extra — conclua esta missão e ganhe 16 XP.',0,16,'✨'),
('daily-198','Extra','Faça uma pequena missão de cuidado','Desafio extra — conclua esta missão e ganhe 20 XP.',0,20,'✨'),
('daily-199','Extra','Escolha uma tarefa útil e faça agora','Desafio extra — conclua esta missão e ganhe 20 XP.',0,20,'✨'),
('daily-200','Extra','Feche o dia com uma última missão de organização','Desafio extra — conclua esta missão e ganhe 20 XP.',0,20,'✨')
on conflict (challenge_key) do update set
  category=excluded.category,title=excluded.title,description=excluded.description,
  value_cents=excluded.value_cents,points=excluded.points,icon=excluded.icon,active=true;

insert into public.game_items (slug, name, description, slot, emoji, color, rarity, price_coins)
values
('pele-dourada','Pele Dourada','Tonalidade quente para seu personagem','skin','🧑','#f2c9a5','common',60),
('pele-solar','Pele Solar','Um tom ensolarado','skin','🧑','#d99a6c','rare',120),
('pele-canela','Pele Canela','Visual acolhedor','skin','🧑','#a96845','rare',120),
('pele-chocolate','Pele Chocolate','Tom profundo e marcante','skin','🧑','#6f4535','epic',220),
('pele-lunar','Pele Lunar','Visual fantástico','skin','🧑','#e8d7d0','epic',220),
('pele-coral','Pele Coral','Edição divertida','skin','🧑','#f0a08b','rare',120),
('pele-mbar','Pele Âmbar','Tom dourado','skin','🧑','#c9824e','epic',220),
('pele-estelar','Pele Estelar','Edição mítica','skin','🧑','#b78de8','mythic',750),
('cachos','Cachos','Cabelo cacheado clássico','hair','🧑‍🦱','#6b4226','common',60),
('corte-pixel','Corte Pixel','Corte inspirado em games','hair','🧑‍🎤','#263238','rare',120),
('franja-pop','Franja Pop','Franja colorida','hair','🧑‍🎤','#7c3aed','rare',120),
('moicano-neon','Moicano Neon','Estilo energético','hair','🧑‍🎤','#06b6d4','epic',220),
('cabelo-azul','Cabelo Azul','Edição oceano','hair','🧑‍🎤','#2563eb','rare',120),
('cabelo-rosa','Cabelo Rosa','Edição galáxia','hair','🧑‍🎤','#ec4899','epic',220),
('cabelo-prateado','Cabelo Prateado','Visual lendário','hair','🧑‍🎤','#cbd5e1','legendary',400),
('cabelo-arco-ris','Cabelo Arco-Íris','Edição mítica','hair','🧑‍🎤','#f59e0b','mythic',750),
('bon-azul','Boné Azul','Boné de explorador','hat','🧢','#2563eb','common',60),
('bon-laranja','Boné Laranja','Boné de velocidade','hat','🧢','#f97316','common',60),
('gorro-roxo','Gorro Roxo','Conforto de inverno','hat','🧶','#7c3aed','rare',120),
('coroa-dourada','Coroa Dourada','Para quem subiu de nível','hat','👑','#facc15','legendary',400),
('capacete-espacial','Capacete Espacial','Pronto para outra missão','hat','🪖','#94a3b8','epic',220),
('chap-u-de-mago','Chapéu de Mago','Poder arcano','hat','🧙','#6d28d9','epic',220),
('orelhas-de-gato','Orelhas de Gato','Modo felino','hat','🐱','#f59e0b','rare',120),
('capacete-drag-o','Capacete Dragão','Edição mítica','hat','🐉','#dc2626','mythic',750),
('camiseta-azul','Camiseta Azul','Uniforme clássico','outfit','👕','#3b82f6','common',60),
('camiseta-roxa','Camiseta Roxa','Visual de XP','outfit','👕','#8b5cf6','common',60),
('moletom','Moletom','Modo conforto','outfit','🧥','#64748b','rare',120),
('jaqueta-neon','Jaqueta Neon','Energia máxima','outfit','🧥','#06b6d4','epic',220),
('armadura-pixel','Armadura Pixel','Proteção de aventureiro','outfit','🛡️','#475569','epic',220),
('capa-de-her-i','Capa de Herói','Para missões especiais','outfit','🦸','#ef4444','legendary',400),
('kimono-lunar','Kimono Lunar','Estilo raro','outfit','🥋','#6366f1','legendary',400),
('traje-c-smico','Traje Cósmico','Edição mítica','outfit','👾','#a855f7','mythic',750),
('t-nis-azul','Tênis Azul','Passos rápidos','shoes','👟','#3b82f6','common',60),
('t-nis-verde','Tênis Verde','Energia diária','shoes','👟','#22c55e','common',60),
('t-nis-neon','Tênis Neon','Correio da galáxia','shoes','👟','#06b6d4','rare',120),
('botas-de-aventura','Botas de Aventura','Prontas para explorar','shoes','🥾','#92400e','rare',120),
('botas-de-fogo','Botas de Fogo','Velocidade lendária','shoes','🥾','#f97316','epic',220),
('patins','Patins','Movimento especial','shoes','🛼','#ec4899','epic',220),
('botas-espaciais','Botas Espaciais','Gravidade opcional','shoes','👢','#64748b','legendary',400),
('t-nis-arco-ris','Tênis Arco-Íris','Edição mítica','shoes','👟','#f59e0b','mythic',750),
('sorriso','Sorriso','Expressão padrão','face','😊','#facc15','common',60),
('-culos','Óculos','Visual estudioso','face','🤓','#60a5fa','common',60),
('piscadinha','Piscadinha','Carisma extra','face','😉','#f59e0b','rare',120),
('-culos-escuros','Óculos Escuros','Modo secreto','face','😎','#111827','rare',120),
('pintura-de-guerra','Pintura de Guerra','Pronto para a missão','face','🎭','#ef4444','epic',220),
('m-scara-ninja','Máscara Ninja','Modo furtivo','face','🥷','#111827','epic',220),
('visor-gamer','Visor Gamer','HUD ativado','face','🤖','#06b6d4','legendary',400),
('olhos-estelares','Olhos Estelares','Edição mítica','face','🤩','#a855f7','mythic',750),
('mochila','Mochila','Leve seus itens','accessory','🎒','#2563eb','common',60),
('fone-gamer','Fone Gamer','Som de vitória','accessory','🎧','#7c3aed','rare',120),
('skate','Skate','Mobilidade extra','accessory','🛹','#f97316','rare',120),
('livro-m-gico','Livro Mágico','Conhecimento bônus','accessory','📖','#8b5cf6','epic',220),
('espada-de-brinquedo','Espada de Brinquedo','Herói da família','accessory','🗡️','#94a3b8','epic',220),
('escudo-solar','Escudo Solar','Defesa brilhante','accessory','🛡️','#facc15','legendary',400),
('varinha','Varinha','Feitiço de organização','accessory','🪄','#ec4899','legendary',400),
('cristal-de-xp','Cristal de XP','Relíquia mítica','accessory','💎','#22d3ee','mythic',750),
('gatinho','Gatinho','Companheiro fofo','pet','🐱','#f59e0b','common',60),
('cachorrinho','Cachorrinho','Parceiro fiel','pet','🐶','#a16207','common',60),
('coelhinho','Coelhinho','Companheiro veloz','pet','🐰','#f5f5f5','rare',120),
('pinguim','Pinguim','Amigo gelado','pet','🐧','#334155','rare',120),
('drag-ozinho','Dragãozinho','Mini guardião','pet','🐲','#22c55e','epic',220),
('raposa','Raposa','Companheira esperta','pet','🦊','#f97316','epic',220),
('robozinho','Robozinho','Parceiro tecnológico','pet','🤖','#94a3b8','legendary',400),
('f-nix','Fênix','Companheira mítica','pet','🔥','#f97316','mythic',750),
('brilho-azul','Brilho Azul','Aura de progresso','aura','✨','#38bdf8','common',60),
('brilho-roxo','Brilho Roxo','Aura de XP','aura','✨','#a78bfa','rare',120),
('fa-scas','Faíscas','Energia extra','aura','⚡','#facc15','rare',120),
('chamas','Chamas','Modo missão','aura','🔥','#f97316','epic',220),
('cora-es','Corações','Espalhe carinho','aura','💖','#ec4899','epic',220),
('estrelas','Estrelas','Efeito lendário','aura','🌟','#facc15','legendary',400),
('aurora','Aurora','Efeito raro','aura','🌈','#22d3ee','legendary',400),
('supernova','Supernova','Efeito mítico','aura','💫','#c084fc','mythic',750),
('quarto-gamer','Quarto Gamer','Base pessoal','background','🎮','#172554','common',60),
('floresta','Floresta','Mapa de aventura','background','🌲','#14532d','common',60),
('praia','Praia','Dia de recompensa','background','🏖️','#0c4a6e','rare',120),
('cidade-neon','Cidade Neon','Missão noturna','background','🌃','#312e81','rare',120),
('castelo','Castelo','Salão dos heróis','background','🏰','#3f3f46','epic',220),
('espa-o','Espaço','Entre as estrelas','background','🌌','#1e1b4b','epic',220),
('planeta-candy','Planeta Candy','Edição divertida','background','🍭','#831843','legendary',400),
('gal-xia-m-tica','Galáxia Mítica','Base lendária','background','🌠','#4c1d95','mythic',750)
on conflict (slug) do update set
  name=excluded.name,description=excluded.description,slot=excluded.slot,emoji=excluded.emoji,
  color=excluded.color,rarity=excluded.rarity,price_coins=excluded.price_coins;

-- Starter avatar configuration.
insert into public.game_avatars (user_id, config)
select id, '{"skin":"pele-dourada","hair":"cachos","outfit":"camiseta-azul","shoes":"tenis-azul","face":"sorriso","background":"quarto-gamer"}'::jsonb
from auth.users
on conflict (user_id) do nothing;

insert into public.game_inventory (user_id, item_id, quantity, source)
select u.id, i.id, 1, 'starter'
from auth.users u
join public.game_items i on i.slug in ('pele-dourada','cachos','camiseta-azul','tenis-azul','sorriso','quarto-gamer')
on conflict (user_id,item_id) do nothing;

-- New signups also receive the starter avatar automatically.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do update
    set full_name = coalesce(excluded.full_name, public.profiles.full_name),
        updated_at = now();

  insert into public.game_avatars (user_id, config)
  values (
    new.id,
    '{"skin":"pele-dourada","hair":"cachos","outfit":"camiseta-azul","shoes":"tenis-azul","face":"sorriso","background":"quarto-gamer"}'::jsonb
  )
  on conflict (user_id) do nothing;

  insert into public.game_inventory (user_id, item_id, quantity, source)
  select new.id, i.id, 1, 'starter'
  from public.game_items i
  where i.slug in ('pele-dourada','cachos','camiseta-azul','tenis-azul','sorriso','quarto-gamer')
  on conflict (user_id,item_id) do nothing;

  return new;
end;
$$;

-- Purchase atomically checks the user's earned coins (10 coins per approved XP)
-- against previous purchases, then updates inventory.
create or replace function public.purchase_game_item(p_item_id uuid)
returns table(ok boolean, message text, balance integer)
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := (select auth.uid());
  price integer;
  earned integer;
  spent integer;
begin
  if uid is null then return query select false, 'Não autenticado.', 0; return; end if;
  select price_coins into price from public.game_items where id = p_item_id;
  if price is null then return query select false, 'Item não encontrado.', 0; return; end if;

  select coalesce(sum(t.points),0) * 10 into earned
  from public.tasks t
  where t.assignee_id = uid and t.status in ('aprovada','paga','confirmada');

  select coalesce(sum(p.price_coins),0) into spent
  from public.game_purchases p where p.user_id = uid;

  if earned - spent < price then
    return query select false, 'Você ainda não tem moedas suficientes.', greatest(0, earned-spent);
    return;
  end if;

  insert into public.game_purchases(user_id,item_id,price_coins) values(uid,p_item_id,price);
  insert into public.game_inventory(user_id,item_id,quantity,source)
  values(uid,p_item_id,1,'purchase')
  on conflict(user_id,item_id) do update
    set quantity=public.game_inventory.quantity+1, source='purchase', updated_at=now();

  return query select true, 'Item comprado!', earned-spent-price;
end;
$$;

revoke execute on function public.purchase_game_item(uuid) from public, anon;
grant execute on function public.purchase_game_item(uuid) to authenticated;

-- Responsible can gift any catalog item to an executor in the same family.
create or replace function public.gift_game_item(p_recipient_id uuid, p_item_id uuid, p_message text default null)
returns table(ok boolean, message text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := (select auth.uid());
  item_exists boolean;
  allowed boolean;
begin
  select exists(select 1 from public.game_items where id=p_item_id) into item_exists;
  if not item_exists then return query select false, 'Item não encontrado.'; return; end if;

  select exists(
    select 1
    from public.family_members me
    join public.family_members target on target.family_id=me.family_id
    where me.user_id=uid and me.role='responsavel'
      and target.user_id=p_recipient_id and target.role='executor'
  ) into allowed;

  if not allowed then return query select false, 'Você só pode presentear executores da sua família.'; return; end if;

  insert into public.game_gifts(from_user_id,to_user_id,item_id,message)
  values(uid,p_recipient_id,p_item_id,left(trim(coalesce(p_message,'')),240));

  insert into public.game_inventory(user_id,item_id,quantity,source)
  values(p_recipient_id,p_item_id,1,'gift')
  on conflict(user_id,item_id) do update
    set quantity=public.game_inventory.quantity+1, source='gift', updated_at=now();

  return query select true, 'Presente enviado!';
end;
$$;

revoke execute on function public.gift_game_item(uuid,uuid,text) from public, anon;
grant execute on function public.gift_game_item(uuid,uuid,text) to authenticated;
