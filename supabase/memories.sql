-- Run once in Supabase: SQL Editor -> New query -> paste -> Run
create table if not exists public.memories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  client_id text not null,
  data jsonb not null,
  created_at timestamptz not null default now(),
  unique (user_id, client_id)
);
alter table public.memories enable row level security;
grant select, insert, update, delete on public.memories to authenticated;
create policy "own select" on public.memories for select to authenticated using (user_id = (select auth.uid()));
create policy "own insert" on public.memories for insert to authenticated with check (user_id = (select auth.uid()));
create policy "own update" on public.memories for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "own delete" on public.memories for delete to authenticated using (user_id = (select auth.uid()));
