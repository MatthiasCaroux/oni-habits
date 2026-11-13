-- ONI Habits : une ligne par compte, avec toutes ses données (le même contenu que sur le téléphone).
-- À coller dans Supabase > SQL Editor > New query, puis Run.

create table if not exists public.user_state (
  user_id uuid primary key references auth.users (id) on delete cascade,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

-- Chacun ne peut lire et écrire que sa propre ligne.
alter table public.user_state enable row level security;

drop policy if exists "lire ses données" on public.user_state;
create policy "lire ses données" on public.user_state
  for select using (auth.uid() = user_id);

drop policy if exists "créer ses données" on public.user_state;
create policy "créer ses données" on public.user_state
  for insert with check (auth.uid() = user_id);

drop policy if exists "modifier ses données" on public.user_state;
create policy "modifier ses données" on public.user_state
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
