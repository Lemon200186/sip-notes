create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  user_id uuid default auth.uid(),
  name text not null check (char_length(name) between 1 and 80),
  type text not null check (type in ('feature_request','bug','product_advice')),
  message text not null check (char_length(message) between 1 and 4000),
  contact text check (contact is null or char_length(contact) <= 200),
  image text check (image is null or char_length(image) <= 500000),
  lang text,
  page text
);
alter table public.feedback enable row level security;
grant insert on public.feedback to anon, authenticated;
create policy "anyone can submit feedback" on public.feedback for insert to anon, authenticated with check (true);
