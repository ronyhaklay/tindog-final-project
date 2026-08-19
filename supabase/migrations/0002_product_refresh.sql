-- TinDog product refresh: richer adoption profiles, dog compatibility data,
-- saved dogs, and advanced swipe filters.

-- ============================================================
-- 1. Richer adopter / lister profiles
-- ============================================================

alter table public.profiles
  add column if not exists account_mode text not null default 'adopter'
    check (account_mode in ('adopter', 'lister', 'both')),
  add column if not exists household_type text
    check (household_type in ('apartment', 'house')),
  add column if not exists has_children boolean not null default false,
  add column if not exists has_other_pets boolean not null default false,
  add column if not exists activity_level text
    check (activity_level in ('low', 'medium', 'high')),
  add column if not exists preferred_size text
    check (preferred_size in ('small', 'medium', 'large')),
  add column if not exists dog_experience text
    check (dog_experience in ('first_time', 'some', 'experienced'));

-- New signups can choose their primary intent. Existing users keep the default.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name, account_mode)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data ->> 'display_name', ''), 'New user'),
    case
      when new.raw_user_meta_data ->> 'account_mode' in ('adopter', 'lister', 'both')
        then new.raw_user_meta_data ->> 'account_mode'
      else 'adopter'
    end
  );
  return new;
end;
$$;

-- ============================================================
-- 2. More useful dog compatibility data
-- ============================================================

alter table public.dogs
  add column if not exists gender text
    check (gender in ('female', 'male')),
  add column if not exists good_with_kids boolean not null default false,
  add column if not exists good_with_dogs boolean not null default false,
  add column if not exists good_with_cats boolean not null default false,
  add column if not exists house_trained boolean not null default false,
  add column if not exists vaccinated boolean not null default false,
  add column if not exists neutered boolean not null default false;

-- ============================================================
-- 3. Saved dogs / favorites
-- ============================================================

create table if not exists public.favorites (
  user_id uuid not null references public.profiles (id) on delete cascade,
  dog_id uuid not null references public.dogs (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, dog_id)
);

create index if not exists favorites_user_created_idx
  on public.favorites (user_id, created_at desc);

alter table public.favorites enable row level security;

drop policy if exists "favorites_select_own" on public.favorites;
create policy "favorites_select_own" on public.favorites
  for select to authenticated using (user_id = auth.uid());

drop policy if exists "favorites_insert_own" on public.favorites;
create policy "favorites_insert_own" on public.favorites
  for insert to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.dogs d
      where d.id = dog_id and d.is_active = true and d.owner_id <> auth.uid()
    )
  );

drop policy if exists "favorites_delete_own" on public.favorites;
create policy "favorites_delete_own" on public.favorites
  for delete to authenticated using (user_id = auth.uid());

grant all on public.favorites to authenticated, service_role;

-- ============================================================
-- 4. Expanded swipe deck filters + favorite state
-- ============================================================

-- Remove the old signature so there is a single unambiguous RPC.
drop function if exists public.get_swipe_deck(text, text, int);

create or replace function public.get_swipe_deck(
  p_listing_type text default null,
  p_city text default null,
  p_size text default null,
  p_energy_level text default null,
  p_good_with_kids boolean default null,
  p_limit int default 10
)
returns table (
  id uuid,
  owner_id uuid,
  name text,
  breed text,
  age_years numeric,
  size text,
  energy_level text,
  temperament text,
  special_needs text,
  description text,
  listing_type text,
  city text,
  is_active boolean,
  created_at timestamptz,
  gender text,
  good_with_kids boolean,
  good_with_dogs boolean,
  good_with_cats boolean,
  house_trained boolean,
  vaccinated boolean,
  neutered boolean,
  photo_paths text[],
  owner_name text,
  is_favorited boolean
)
language sql
security invoker
set search_path = ''
as $$
  select
    d.id, d.owner_id, d.name, d.breed, d.age_years, d.size, d.energy_level,
    d.temperament, d.special_needs, d.description, d.listing_type, d.city,
    d.is_active, d.created_at, d.gender, d.good_with_kids, d.good_with_dogs,
    d.good_with_cats, d.house_trained, d.vaccinated, d.neutered,
    coalesce(
      (select array_agg(p.storage_path order by p.sort_order)
       from public.dog_photos p where p.dog_id = d.id),
      '{}'
    ) as photo_paths,
    pr.display_name as owner_name,
    exists (
      select 1 from public.favorites f
      where f.user_id = auth.uid() and f.dog_id = d.id
    ) as is_favorited
  from public.dogs d
  join public.profiles pr on pr.id = d.owner_id
  where d.is_active = true
    and d.owner_id <> auth.uid()
    and not exists (
      select 1 from public.swipes s
      where s.swiper_id = auth.uid() and s.dog_id = d.id
    )
    and (p_listing_type is null or d.listing_type = p_listing_type)
    and (p_city is null or d.city ilike '%' || p_city || '%')
    and (p_size is null or d.size = p_size)
    and (p_energy_level is null or d.energy_level = p_energy_level)
    and (p_good_with_kids is null or d.good_with_kids = p_good_with_kids)
  order by d.created_at desc
  limit least(greatest(p_limit, 1), 50);
$$;
