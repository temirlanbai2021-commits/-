create table public.player_profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null check (char_length(display_name) between 2 and 30),
  updated_at timestamptz not null default now()
);

alter table public.player_profiles enable row level security;
create policy "read own profile" on public.player_profiles for select using (auth.uid() = user_id);
create policy "insert own profile" on public.player_profiles for insert with check (auth.uid() = user_id);
create policy "update own profile" on public.player_profiles for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table public.friendships (
  user_id uuid not null references auth.users (id) on delete cascade,
  friend_id uuid not null references auth.users (id) on delete cascade,
  status text not null check (status in ('sent', 'pending', 'accepted')),
  created_at timestamptz not null default now(),
  primary key (user_id, friend_id),
  check (user_id <> friend_id)
);

alter table public.friendships enable row level security;
create policy "read own friendships" on public.friendships for select using (auth.uid() = user_id);

create or replace function public.sync_player_profile(player_name text)
returns void language plpgsql security definer set search_path = public as $$
begin
  insert into player_profiles (user_id, display_name, updated_at)
  values (auth.uid(), left(trim(player_name), 30), now())
  on conflict (user_id) do update set display_name = excluded.display_name, updated_at = now();
end;
$$;

create or replace function public.search_players(query text)
returns table (user_id uuid, display_name text) language sql security definer set search_path = public as $$
  select p.user_id, p.display_name from player_profiles p
  where p.user_id <> auth.uid() and p.display_name ilike '%' || trim(query) || '%'
  order by p.display_name limit 10;
$$;

create or replace function public.send_friend_request(target_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null or auth.uid() = target_id then raise exception 'Invalid friend'; end if;
  insert into friendships (user_id, friend_id, status) values (auth.uid(), target_id, 'sent')
  on conflict (user_id, friend_id) do nothing;
  insert into friendships (user_id, friend_id, status) values (target_id, auth.uid(), 'pending')
  on conflict (user_id, friend_id) do nothing;
end;
$$;

create or replace function public.accept_friend_request(target_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from friendships where user_id = auth.uid() and friend_id = target_id and status = 'pending')
    then raise exception 'Request not found'; end if;
  update friendships set status = 'accepted' where user_id = auth.uid() and friend_id = target_id;
  update friendships set status = 'accepted' where user_id = target_id and friend_id = auth.uid();
end;
$$;

create or replace function public.remove_friend(target_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  delete from friendships where (user_id = auth.uid() and friend_id = target_id)
    or (user_id = target_id and friend_id = auth.uid());
end;
$$;

create or replace function public.list_friends()
returns table (user_id uuid, display_name text, status text) language sql security definer set search_path = public as $$
  select f.friend_id, p.display_name, f.status from friendships f
  join player_profiles p on p.user_id = f.friend_id where f.user_id = auth.uid()
  order by case f.status when 'pending' then 0 when 'accepted' then 1 else 2 end, p.display_name;
$$;

revoke all on function public.search_players(text) from public;
revoke all on function public.send_friend_request(uuid) from public;
revoke all on function public.accept_friend_request(uuid) from public;
revoke all on function public.remove_friend(uuid) from public;
revoke all on function public.list_friends() from public;
grant execute on function public.sync_player_profile(text), public.search_players(text),
  public.send_friend_request(uuid), public.accept_friend_request(uuid),
  public.remove_friend(uuid), public.list_friends() to authenticated;
