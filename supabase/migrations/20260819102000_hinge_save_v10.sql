-- TinDog V10
-- 1) Reliable full dog profile
-- 2) Reliable save/favorites for the signed-in adopter

create table if not exists public.favorites (
  user_id uuid not null references auth.users(id) on delete cascade,
  dog_id uuid not null references public.dogs(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, dog_id)
);

create or replace function public.get_dog_profile(p_dog_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select
    to_jsonb(d)
    || jsonb_build_object(
      'dog_photos',
      coalesce(
        (
          select jsonb_agg(to_jsonb(dp) order by dp.sort_order, dp.created_at)
          from public.dog_photos dp
          where dp.dog_id = d.id
        ),
        '[]'::jsonb
      ),
      'owner_name',
      coalesce(
        (
          select p.display_name
          from public.profiles p
          where p.id = d.owner_id
          limit 1
        ),
        ''
      ),
      'is_favorited',
      case
        when auth.uid() is null then false
        else exists (
          select 1
          from public.favorites f
          where f.user_id = auth.uid()
            and f.dog_id = d.id
        )
      end
    )
  from public.dogs d
  where d.id = p_dog_id;
$$;

create or replace function public.set_my_favorite(
  p_dog_id uuid,
  p_favorited boolean
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  if not exists (select 1 from public.dogs d where d.id = p_dog_id) then
    raise exception 'Dog not found';
  end if;

  if p_favorited then
    insert into public.favorites(user_id, dog_id)
    values (v_uid, p_dog_id)
    on conflict (user_id, dog_id) do nothing;
  else
    delete from public.favorites
    where user_id = v_uid
      and dog_id = p_dog_id;
  end if;

  return p_favorited;
end;
$$;

create or replace function public.get_my_favorites()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    jsonb_agg(
      to_jsonb(d)
      || jsonb_build_object(
        'dog_photos',
        coalesce(
          (
            select jsonb_agg(to_jsonb(dp) order by dp.sort_order, dp.created_at)
            from public.dog_photos dp
            where dp.dog_id = d.id
          ),
          '[]'::jsonb
        ),
        'owner_name',
        coalesce(
          (
            select p.display_name
            from public.profiles p
            where p.id = d.owner_id
            limit 1
          ),
          ''
        ),
        'is_favorited',
        true,
        'favorite_created_at',
        f.created_at
      )
      order by f.created_at desc
    ),
    '[]'::jsonb
  )
  from public.favorites f
  join public.dogs d on d.id = f.dog_id
  where f.user_id = auth.uid();
$$;

revoke all on function public.get_dog_profile(uuid) from public;
revoke all on function public.set_my_favorite(uuid, boolean) from public;
revoke all on function public.get_my_favorites() from public;

grant execute on function public.get_dog_profile(uuid) to authenticated;
grant execute on function public.set_my_favorite(uuid, boolean) to authenticated;
grant execute on function public.get_my_favorites() to authenticated;

grant execute on function public.get_dog_profile(uuid) to service_role;
grant execute on function public.set_my_favorite(uuid, boolean) to service_role;
grant execute on function public.get_my_favorites() to service_role;
