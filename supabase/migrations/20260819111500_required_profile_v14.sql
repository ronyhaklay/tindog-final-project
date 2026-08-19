-- TinDog V14 — mandatory profile completion before matching.

alter table public.profiles
  add column if not exists has_children_answered boolean not null default false,
  add column if not exists has_other_pets_answered boolean not null default false,
  add column if not exists profile_completed_at timestamptz,
  add column if not exists shelter_name text;

-- Keep established shelter/demo accounts usable if they already own listings.
update public.profiles p
set
  household_type = coalesce(p.household_type, 'apartment'),
  activity_level = coalesce(p.activity_level, 'medium'),
  preferred_size = coalesce(p.preferred_size, 'medium'),
  dog_experience = coalesce(p.dog_experience, 'some'),
  bio = coalesce(nullif(btrim(p.bio), ''), 'פרופיל עמותה פעיל ב-TinDog.'),
  city = coalesce(nullif(btrim(p.city), ''), 'Tel Aviv'),
  shelter_name = coalesce(nullif(btrim(p.shelter_name), ''), p.display_name),
  has_children_answered = true,
  has_other_pets_answered = true,
  profile_completed_at = coalesce(p.profile_completed_at, now())
where exists (
  select 1 from public.dogs d where d.owner_id = p.id
);

create or replace function public.profile_is_complete(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select
        nullif(btrim(p.display_name), '') is not null
        and nullif(btrim(p.city), '') is not null
        and nullif(btrim(p.bio), '') is not null
        and p.account_mode in ('adopter', 'lister', 'both')
        and p.household_type in ('apartment', 'house')
        and p.activity_level in ('low', 'medium', 'high')
        and p.preferred_size in ('small', 'medium', 'large')
        and p.dog_experience in ('first_time', 'some', 'experienced')
        and p.has_children_answered = true
        and p.has_other_pets_answered = true
        and (
          p.account_mode = 'adopter'
          or nullif(btrim(p.shelter_name), '') is not null
        )
      from public.profiles p
      where p.id = p_user_id
    ),
    false
  );
$$;

create or replace function public.complete_my_profile(
  p_display_name text,
  p_city text,
  p_bio text,
  p_account_mode text,
  p_household_type text,
  p_has_children boolean,
  p_has_other_pets boolean,
  p_activity_level text,
  p_preferred_size text,
  p_dog_experience text,
  p_shelter_name text default null
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_shelter_name text := nullif(btrim(coalesce(p_shelter_name, '')), '');
begin
  if v_uid is null then raise exception 'Not authenticated'; end if;
  if char_length(btrim(coalesce(p_display_name, ''))) < 2 then raise exception 'Display name is required'; end if;
  if char_length(btrim(coalesce(p_city, ''))) < 2 then raise exception 'City is required'; end if;
  if char_length(btrim(coalesce(p_bio, ''))) < 10 then raise exception 'About you must contain at least 10 characters'; end if;
  if p_account_mode not in ('adopter', 'lister', 'both') then raise exception 'Account mode is required'; end if;
  if p_household_type not in ('apartment', 'house') then raise exception 'Home type is required'; end if;
  if p_activity_level not in ('low', 'medium', 'high') then raise exception 'Activity level is required'; end if;
  if p_preferred_size not in ('small', 'medium', 'large') then raise exception 'Preferred dog size is required'; end if;
  if p_dog_experience not in ('first_time', 'some', 'experienced') then raise exception 'Dog experience is required'; end if;
  if p_account_mode in ('lister', 'both') and v_shelter_name is null then raise exception 'Shelter name is required'; end if;

  update public.profiles
  set
    display_name = btrim(p_display_name),
    city = btrim(p_city),
    bio = btrim(p_bio),
    account_mode = p_account_mode,
    household_type = p_household_type,
    has_children = p_has_children,
    has_other_pets = p_has_other_pets,
    has_children_answered = true,
    has_other_pets_answered = true,
    activity_level = p_activity_level,
    preferred_size = p_preferred_size,
    dog_experience = p_dog_experience,
    shelter_name = case when p_account_mode in ('lister', 'both') then v_shelter_name else shelter_name end,
    profile_completed_at = now()
  where id = v_uid;

  if not found then raise exception 'Profile not found'; end if;
  return true;
end;
$$;

revoke all on function public.profile_is_complete(uuid) from public;
revoke all on function public.complete_my_profile(text,text,text,text,text,boolean,boolean,text,text,text,text) from public;

grant execute on function public.profile_is_complete(uuid) to authenticated, service_role;
grant execute on function public.complete_my_profile(text,text,text,text,text,boolean,boolean,text,text,text,text) to authenticated, service_role;
