-- TinDog v2: shelter managers, richer media, verified organizations,
-- and one-time match celebrations.

-- ============================================================
-- 1. Roles and shelter identity
-- ============================================================

alter table public.profiles
  add column if not exists role text not null default 'adopter'
    check (role in ('adopter', 'shelter_admin')),
  add column if not exists shelter_name text,
  add column if not exists shelter_about text,
  add column if not exists shelter_website text,
  add column if not exists shelter_verified boolean not null default false;

-- Existing people who already own a listing become shelter managers so
-- the migration does not lock them out of their dogs.
update public.profiles p
set role = 'shelter_admin',
    shelter_name = coalesce(nullif(p.shelter_name, ''), p.display_name || ' Rescue')
where exists (select 1 from public.dogs d where d.owner_id = p.id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name, account_mode, role, shelter_name)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data ->> 'display_name', ''), 'New user'),
    case when new.raw_user_meta_data ->> 'role' = 'shelter_admin' then 'lister' else 'adopter' end,
    case when new.raw_user_meta_data ->> 'role' = 'shelter_admin' then 'shelter_admin' else 'adopter' end,
    case when new.raw_user_meta_data ->> 'role' = 'shelter_admin'
      then nullif(new.raw_user_meta_data ->> 'shelter_name', '')
      else null end
  );
  return new;
end;
$$;

-- ============================================================
-- 2. Dog video + bark recording
-- ============================================================

alter table public.dogs
  add column if not exists video_path text,
  add column if not exists bark_audio_path text;

-- TinDog v2 is adoption/foster focused; retire the old playdate mode.
update public.dogs set listing_type = 'adoption' where listing_type = 'playdate';
alter table public.dogs drop constraint if exists dogs_listing_type_check;
alter table public.dogs add constraint dogs_listing_type_check
  check (listing_type in ('adoption', 'foster'));

-- ============================================================
-- 3. Match celebration state
-- ============================================================

alter table public.match_requests
  add column if not exists match_seen_at timestamptz;

create or replace function public.mark_match_seen(p_request_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.match_requests
  set match_seen_at = coalesce(match_seen_at, now())
  where id = p_request_id
    and requester_id = auth.uid()
    and status = 'approved';
end;
$$;

grant execute on function public.mark_match_seen(uuid) to authenticated;

-- ============================================================
-- 4. Role-based listing permissions
-- ============================================================

drop policy if exists "dogs_insert_own" on public.dogs;
drop policy if exists "dogs_update_own" on public.dogs;
drop policy if exists "dogs_delete_own" on public.dogs;

create policy "dogs_insert_shelter" on public.dogs
  for insert to authenticated
  with check (
    owner_id = auth.uid()
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'shelter_admin')
  );

create policy "dogs_update_shelter_own" on public.dogs
  for update to authenticated
  using (
    owner_id = auth.uid()
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'shelter_admin')
  )
  with check (owner_id = auth.uid());

create policy "dogs_delete_shelter_own" on public.dogs
  for delete to authenticated
  using (
    owner_id = auth.uid()
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'shelter_admin')
  );

-- Photo metadata must follow the same rule.
drop policy if exists "dog_photos_insert_own" on public.dog_photos;
drop policy if exists "dog_photos_delete_own" on public.dog_photos;

create policy "dog_photos_insert_shelter" on public.dog_photos
  for insert to authenticated
  with check (exists (
    select 1 from public.dogs d
    join public.profiles p on p.id = d.owner_id
    where d.id = dog_id and d.owner_id = auth.uid() and p.role = 'shelter_admin'
  ));

create policy "dog_photos_delete_shelter" on public.dog_photos
  for delete to authenticated
  using (exists (
    select 1 from public.dogs d
    join public.profiles p on p.id = d.owner_id
    where d.id = dog_id and d.owner_id = auth.uid() and p.role = 'shelter_admin'
  ));

-- Storage itself is also shelter-only for writes.
drop policy if exists "dog_photos_upload_own_folder" on storage.objects;
drop policy if exists "dog_photos_delete_own_folder" on storage.objects;

create policy "dog_photos_upload_shelter_folder" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'dog-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'shelter_admin')
  );

create policy "dog_photos_delete_shelter_folder" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'dog-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'shelter_admin')
  );

insert into storage.buckets (id, name, public)
values ('dog-media', 'dog-media', true)
on conflict (id) do update set public = true;

create policy "dog_media_public_read" on storage.objects
  for select using (bucket_id = 'dog-media');

create policy "dog_media_upload_shelter_folder" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'dog-media'
    and (storage.foldername(name))[1] = auth.uid()::text
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'shelter_admin')
  );

create policy "dog_media_delete_shelter_folder" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'dog-media'
    and (storage.foldername(name))[1] = auth.uid()::text
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'shelter_admin')
  );

-- ============================================================
-- 5. Adopters swipe; shelter accounts manage listings
-- ============================================================

create or replace function public.record_swipe(p_dog_id uuid, p_direction text)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_request_id uuid;
begin
  if not exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'adopter') then
    raise exception 'only adopters can swipe';
  end if;
  if p_direction not in ('like', 'pass') then raise exception 'invalid direction'; end if;

  insert into public.swipes (swiper_id, dog_id, direction)
  values (auth.uid(), p_dog_id, p_direction)
  on conflict (swiper_id, dog_id) do nothing;

  if p_direction = 'like' then
    insert into public.match_requests (dog_id, requester_id)
    values (p_dog_id, auth.uid())
    on conflict (dog_id, requester_id) do nothing;
    select id into v_request_id from public.match_requests where dog_id = p_dog_id and requester_id = auth.uid();
  end if;
  return v_request_id;
end;
$$;

-- One deck RPC containing shelter identity and media flags.
drop function if exists public.get_swipe_deck(text, text, text, text, boolean, int);
create or replace function public.get_swipe_deck(
  p_listing_type text default null,
  p_city text default null,
  p_size text default null,
  p_energy_level text default null,
  p_good_with_kids boolean default null,
  p_limit int default 10
)
returns table (
  id uuid, owner_id uuid, name text, breed text, age_years numeric, size text,
  energy_level text, temperament text, special_needs text, description text,
  listing_type text, city text, is_active boolean, created_at timestamptz,
  gender text, good_with_kids boolean, good_with_dogs boolean, good_with_cats boolean,
  house_trained boolean, vaccinated boolean, neutered boolean,
  video_path text, bark_audio_path text, photo_paths text[], owner_name text,
  shelter_name text, shelter_verified boolean, is_favorited boolean
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
    d.video_path, d.bark_audio_path,
    coalesce((select array_agg(dp.storage_path order by dp.sort_order) from public.dog_photos dp where dp.dog_id = d.id), '{}'),
    pr.display_name, pr.shelter_name, pr.shelter_verified,
    exists (select 1 from public.favorites f where f.user_id = auth.uid() and f.dog_id = d.id)
  from public.dogs d
  join public.profiles pr on pr.id = d.owner_id
  where d.is_active = true
    and exists (select 1 from public.profiles me where me.id = auth.uid() and me.role = 'adopter')
    and d.owner_id <> auth.uid()
    and not exists (select 1 from public.swipes s where s.swiper_id = auth.uid() and s.dog_id = d.id)
    and (p_listing_type is null or d.listing_type = p_listing_type)
    and (p_city is null or d.city ilike '%' || p_city || '%')
    and (p_size is null or d.size = p_size)
    and (p_energy_level is null or d.energy_level = p_energy_level)
    and (p_good_with_kids is null or d.good_with_kids = p_good_with_kids)
  order by d.created_at desc
  limit least(greatest(p_limit, 1), 50);
$$;

-- Tighten adopter-only interaction tables as well (defense in depth).
drop policy if exists "swipes_insert_own" on public.swipes;
create policy "swipes_insert_adopter" on public.swipes
  for insert to authenticated
  with check (
    swiper_id = auth.uid()
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'adopter')
  );

drop policy if exists "match_requests_insert_requester" on public.match_requests;
create policy "match_requests_insert_adopter" on public.match_requests
  for insert to authenticated
  with check (
    requester_id = auth.uid()
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'adopter')
    and not exists (select 1 from public.dogs d where d.id = dog_id and d.owner_id = auth.uid())
  );

drop policy if exists "favorites_insert_own" on public.favorites;
create policy "favorites_insert_adopter" on public.favorites
  for insert to authenticated
  with check (
    user_id = auth.uid()
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'adopter')
    and exists (select 1 from public.dogs d where d.id = dog_id and d.is_active = true and d.owner_id <> auth.uid())
  );

-- Users can edit profile content, but cannot promote themselves or self-verify.
revoke update on public.profiles from authenticated;
grant update (
  display_name, city, avatar_url, bio,
  shelter_name, shelter_about, shelter_website,
  household_type, has_children, has_other_pets,
  activity_level, preferred_size, dog_experience
) on public.profiles to authenticated;
