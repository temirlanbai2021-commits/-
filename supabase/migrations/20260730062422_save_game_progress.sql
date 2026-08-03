create table public.game_progress (
  user_id uuid primary key references auth.users (id) on delete cascade,
  progress jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.game_progress enable row level security;

create policy "read own game progress"
  on public.game_progress for select
  using (auth.uid() = user_id);

create policy "insert own game progress"
  on public.game_progress for insert
  with check (auth.uid() = user_id);

create policy "update own game progress"
  on public.game_progress for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
