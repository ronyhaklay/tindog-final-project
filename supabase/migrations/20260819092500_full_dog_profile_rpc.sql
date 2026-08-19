-- TinDog V5: safe read RPC for the full dog profile.

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
          select jsonb_agg(to_jsonb(dp) order by dp.sort_order)
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
      )
    )
  from public.dogs d
  where d.id = p_dog_id;
$$;

revoke all on function public.get_dog_profile(uuid) from public;
grant execute on function public.get_dog_profile(uuid) to authenticated;
grant execute on function public.get_dog_profile(uuid) to service_role;
