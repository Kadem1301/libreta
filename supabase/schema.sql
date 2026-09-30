-- Solito · esquema de base de datos (Supabase / Postgres)
-- Se corre una sola vez en el SQL Editor del proyecto (o como migración).
-- Cada usuario solo ve y modifica sus propios datos (Row Level Security).

-- ───────────── Perfiles ─────────────
create table if not exists public.profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  full_name       text,
  currency        text not null default 'PEN',
  monthly_budget  numeric(12,2) not null default 0 check (monthly_budget >= 0),
  plan            text not null default 'free' check (plan in ('free','premium')),
  whatsapp_phone  text,                          -- para el bot de avisos (premium, más adelante)
  created_at      timestamptz not null default now()
);

-- ───────────── Categorías ─────────────
create table if not exists public.categories (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade default auth.uid(),
  kind        text not null check (kind in ('expense','income')),
  name        text not null check (char_length(name) between 1 and 40),
  icon        text not null default 'wallet',
  color       text not null default '#8E8E93',
  sort        int  not null default 0,
  archived    boolean not null default false,
  created_at  timestamptz not null default now()
);
create index if not exists categories_user_idx on public.categories(user_id);

-- ───────────── Movimientos ─────────────
create table if not exists public.transactions (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade default auth.uid(),
  kind         text not null check (kind in ('expense','income')),
  amount       numeric(12,2) not null check (amount > 0),
  category_id  uuid references public.categories(id) on delete set null,
  merchant     text not null check (char_length(merchant) between 1 and 80),
  note         text,
  occurred_on  date not null default current_date,
  occurred_at  time,
  source       text not null default 'manual' check (source in ('manual','email','whatsapp','import')),
  external_id  text,                             -- id del correo del banco, para no duplicar (premium)
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists transactions_category_idx on public.transactions(category_id);
create index if not exists transactions_user_date_idx on public.transactions(user_id, occurred_on desc);
create unique index if not exists transactions_external_uidx
  on public.transactions(user_id, source, external_id) where external_id is not null;

create or replace function public.touch_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end $$;

drop trigger if exists transactions_touch on public.transactions;
create trigger transactions_touch before update on public.transactions
  for each row execute function public.touch_updated_at();

-- ───────────── Seguridad (RLS) ─────────────
alter table public.profiles     enable row level security;
alter table public.categories   enable row level security;
alter table public.transactions enable row level security;

drop policy if exists "perfil propio: leer"       on public.profiles;
drop policy if exists "perfil propio: actualizar" on public.profiles;
create policy "perfil propio: leer"       on public.profiles for select to authenticated using ((select auth.uid()) = id);
create policy "perfil propio: actualizar" on public.profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

drop policy if exists "categorias propias" on public.categories;
create policy "categorias propias" on public.categories for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists "movimientos propios" on public.transactions;
create policy "movimientos propios" on public.transactions for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- El usuario solo puede editar estas columnas de su perfil: el plan (free/premium)
-- no lo cambia desde la app. (Un revoke por columna no basta porque Supabase da
-- UPDATE sobre toda la tabla; se quita ese permiso y se concede columna por columna.)
revoke update on public.profiles from anon, authenticated;
grant update (full_name, currency, monthly_budget, whatsapp_phone) on public.profiles to authenticated;

-- ───────────── Alta de usuario: perfil + categorías base ─────────────
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)));

  insert into public.categories (user_id, kind, name, icon, color, sort) values
    (new.id, 'expense', 'Alimentación',    'food',      '#FF9500', 1),
    (new.id, 'expense', 'Transporte',      'transport', '#007AFF', 2),
    (new.id, 'expense', 'Vivienda',        'house',     '#AF52DE', 3),
    (new.id, 'expense', 'Entretenimiento', 'fun',       '#FF2D55', 4),
    (new.id, 'expense', 'Salud',           'health',    '#30B0C7', 5),
    (new.id, 'expense', 'Compras',         'shopping',  '#FFCC00', 6),
    (new.id, 'expense', 'Servicios',       'services',  '#5856D6', 7),
    (new.id, 'expense', 'Otros',           'wallet',    '#8E8E93', 8),
    (new.id, 'income',  'Sueldo',          'briefcase', '#34C759', 1),
    (new.id, 'income',  'Freelance',       'spark',     '#30D158', 2),
    (new.id, 'income',  'Otros ingresos',  'arrowUp',   '#00C7BE', 3);
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Las funciones de trigger no deben poder llamarse como RPC desde la API.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.touch_updated_at() from public, anon, authenticated;

-- ───────────── Una categoría solo puede ser del mismo dueño del movimiento ─────────────
-- La FK sola aceptaría el id de una categoría ajena; este trigger lo impide.
create or replace function public.check_txn_category_owner() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
  if new.category_id is not null and not exists (
    select 1 from public.categories c where c.id = new.category_id and c.user_id = new.user_id
  ) then
    raise exception 'La categoría no pertenece al usuario' using errcode = '42501';
  end if;
  return new;
end $$;

drop trigger if exists transactions_category_owner on public.transactions;
create trigger transactions_category_owner
  before insert or update of category_id, user_id on public.transactions
  for each row execute function public.check_txn_category_owner();

revoke execute on function public.check_txn_category_owner() from public, anon, authenticated;

-- Auditoría (debe dar 0): movimientos cuya categoría es de otro usuario.
-- select count(*) from public.transactions t join public.categories c on c.id = t.category_id where c.user_id <> t.user_id;
