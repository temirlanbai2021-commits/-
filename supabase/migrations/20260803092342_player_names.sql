create or replace function public.sync_player_profile(player_name text)
returns void language plpgsql security definer set search_path = public as $$
begin
  insert into player_profiles (user_id, display_name, updated_at)
  values (auth.uid(), left(trim(player_name), 30), now())
  on conflict (user_id) do nothing;
end;
$$;

create or replace function public.update_player_name(player_name text)
returns void language plpgsql security definer set search_path = public as $$
declare
  clean_name text := trim(player_name);
begin
  if auth.uid() is null then raise exception 'Sign in required'; end if;
  if char_length(clean_name) < 2 or char_length(clean_name) > 20 then
    raise exception 'Name must contain 2-20 characters';
  end if;
  if clean_name !~ '^[[:alnum:]_ -]+$' then
    raise exception 'Name contains unsupported characters';
  end if;
  if exists (
    select 1 from player_profiles
    where lower(display_name) = lower(clean_name) and user_id <> auth.uid()
  ) then raise exception 'Name is already taken'; end if;

  insert into player_profiles (user_id, display_name, updated_at)
  values (auth.uid(), clean_name, now())
  on conflict (user_id) do update
    set display_name = excluded.display_name, updated_at = now();
end;
$$;

revoke all on function public.update_player_name(text) from public;
grant execute on function public.update_player_name(text) to authenticated;
