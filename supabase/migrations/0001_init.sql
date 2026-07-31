-- TinDog initial schema
-- Run this in the Supabase SQL Editor (or `supabase db push`).

-- ============================================================
-- 1. Tables
-- ============================================================

-- User profiles, 1:1 with auth.users.
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null check (char_length(display_name) between 2 and 50),
  city text,
  avatar_url text,
  bio text check (char_length(bio) <= 300),
  created_at timestamptz not null default now()
);

-- Dog profiles. listing_type unifies the two product use cases:
-- adoption / foster (dog needs a home) and playdate (dog wants friends).
create table public.dogs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 40),
  breed text,
  age_years numeric(4, 1) not null check (age_years >= 0 and age_years <= 25),
  size text not null check (size in ('small', 'medium', 'large')),
  energy_level text not null check (energy_level in ('low', 'medium', 'high')),
  temperament text check (char_length(temperament) <= 200),
  special_needs text check (char_length(special_needs) <= 300),
  description text check (char_length(description) <= 1000),
  listing_type text not null check (listing_type in ('adoption', 'foster', 'playdate')),
  city text not null check (char_length(city) between 2 and 60),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Photos live in the 'dog-photos' storage bucket; we store the path.
create table public.dog_photos (
  id uuid primary key default gen_random_uuid(),
  dog_id uuid not null references public.dogs (id) on delete cascade,
  storage_path text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- One swipe per user per dog. Powers "never show the same dog twice".
create table public.swipes (
  id uuid primary key default gen_random_uuid(),
  swiper_id uuid not null references public.profiles (id) on delete cascade,
  dog_id uuid not null references public.dogs (id) on delete cascade,
  direction text not null check (direction in ('like', 'pass')),
  created_at timestamptz not null default now(),
  unique (swiper_id, dog_id)
);

-- A right-swipe creates a pending request that the dog's owner
-- approves or declines. Approval unlocks chat.
create table public.match_requests (
  id uuid primary key default gen_random_uuid(),
  dog_id uuid not null references public.dogs (id) on delete cascade,
  requester_id uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'approved', 'declined')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (dog_id, requester_id)
);

-- Chat messages inside an approved match request.
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.match_requests (id) on delete cascade,
  sender_id uuid not null references public.profiles (id) on delete cascade,
  content text not null check (char_length(content) between 1 and 2000),
  created_at timestamptz not null default now()
);

-- ============================================================
-- 1b. Grants (RLS still applies on top of these)
-- ============================================================

grant usage on schema public to anon, authenticated, service_role;
grant all on all tables in schema public to anon, authenticated, service_role;
grant all on all sequences in schema public to anon, authenticated, service_role;
alter default privileges in schema public
  grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public
  grant all on sequences to anon, authenticated, service_role;

-- ============================================================
-- 2. Indexes (see docs/scale.md)
-- ============================================================

create index dogs_deck_idx on public.dogs (listing_type, city, is_active, created_at desc);
create index dogs_owner_idx on public.dogs (owner_id);
create index swipes_swiper_dog_idx on public.swipes (swiper_id, dog_id);
create index match_requests_dog_idx on public.match_requests (dog_id, status);
create index match_requests_requester_idx on public.match_requests (requester_id, status);
create index messages_request_created_idx on public.messages (request_id, created_at desc);
create index dog_photos_dog_idx on public.dog_photos (dog_id, sort_order);

-- ============================================================
-- 3. Triggers
-- ============================================================

-- Auto-create a profile row when a user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data ->> 'display_name', ''), 'New user')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Keep match_requests.updated_at fresh on status changes.
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger match_requests_touch
  before update on public.match_requests
  for each row execute function public.touch_updated_at();

-- ============================================================
-- 4. Row Level Security
-- ============================================================

alter table public.profiles enable row level security;
alter table public.dogs enable row level security;
alter table public.dog_photos enable row level security;
alter table public.swipes enable row level security;
alter table public.match_requests enable row level security;
alter table public.messages enable row level security;

-- profiles: any logged-in user can read (needed to show names in
-- deck/requests/chat); only the owner can update their own row.
create policy "profiles_select" on public.profiles
  for select to authenticated using (true);

create policy "profiles_update_own" on public.profiles
  for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

-- dogs: active dogs are visible to all logged-in users; owners can
-- always see and fully manage their own dogs.
create policy "dogs_select_active_or_own" on public.dogs
  for select to authenticated
  using (is_active = true or owner_id = auth.uid());

create policy "dogs_insert_own" on public.dogs
  for insert to authenticated with check (owner_id = auth.uid());

create policy "dogs_update_own" on public.dogs
  for update to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy "dogs_delete_own" on public.dogs
  for delete to authenticated using (owner_id = auth.uid());

-- dog_photos: readable if the dog is readable; writable by the dog owner.
create policy "dog_photos_select" on public.dog_photos
  for select to authenticated
  using (exists (
    select 1 from public.dogs d
    where d.id = dog_id and (d.is_active = true or d.owner_id = auth.uid())
  ));

create policy "dog_photos_insert_own" on public.dog_photos
  for insert to authenticated
  with check (exists (
    select 1 from public.dogs d where d.id = dog_id and d.owner_id = auth.uid()
  ));

create policy "dog_photos_delete_own" on public.dog_photos
  for delete to authenticated
  using (exists (
    select 1 from public.dogs d where d.id = dog_id and d.owner_id = auth.uid()
  ));

-- swipes: users only ever see and create their own swipes.
create policy "swipes_select_own" on public.swipes
  for select to authenticated using (swiper_id = auth.uid());

create policy "swipes_insert_own" on public.swipes
  for insert to authenticated with check (swiper_id = auth.uid());

-- match_requests: visible to the requester and to the dog's owner.
-- Created by the requester (via right-swipe); only the dog's owner
-- may update the status (approve/decline).
create policy "match_requests_select_participants" on public.match_requests
  for select to authenticated
  using (
    requester_id = auth.uid()
    or exists (select 1 from public.dogs d where d.id = dog_id and d.owner_id = auth.uid())
  );

create policy "match_requests_insert_requester" on public.match_requests
  for insert to authenticated
  with check (
    requester_id = auth.uid()
    -- can't request your own dog
    and not exists (select 1 from public.dogs d where d.id = dog_id and d.owner_id = auth.uid())
  );

create policy "match_requests_update_owner" on public.match_requests
  for update to authenticated
  using (exists (select 1 from public.dogs d where d.id = dog_id and d.owner_id = auth.uid()))
  with check (exists (select 1 from public.dogs d where d.id = dog_id and d.owner_id = auth.uid()));

-- messages: only the two participants of an APPROVED request can
-- read or write, and senders can only write as themselves.
create policy "messages_select_participants" on public.messages
  for select to authenticated
  using (exists (
    select 1
    from public.match_requests mr
    join public.dogs d on d.id = mr.dog_id
    where mr.id = request_id
      and mr.status = 'approved'
      and (mr.requester_id = auth.uid() or d.owner_id = auth.uid())
  ));

create policy "messages_insert_participants" on public.messages
  for insert to authenticated
  with check (
    sender_id = auth.uid()
    and exists (
      select 1
      from public.match_requests mr
      join public.dogs d on d.id = mr.dog_id
      where mr.id = request_id
        and mr.status = 'approved'
        and (mr.requester_id = auth.uid() or d.owner_id = auth.uid())
    )
  );

-- ============================================================
-- 5. RPC: swipe deck + atomic swipe
-- ============================================================

-- Returns the next batch of dogs for the current user:
-- active, not their own, never swiped before, with optional filters.
-- SECURITY INVOKER: runs with the caller's permissions under RLS.
create or replace function public.get_swipe_deck(
  p_listing_type text default null,
  p_city text default null,
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
  photo_paths text[],
  owner_name text
)
language sql
security invoker
set search_path = ''
as $$
  select
    d.id, d.owner_id, d.name, d.breed, d.age_years, d.size, d.energy_level,
    d.temperament, d.special_needs, d.description, d.listing_type, d.city,
    d.is_active, d.created_at,
    coalesce(
      (select array_agg(p.storage_path order by p.sort_order)
       from public.dog_photos p where p.dog_id = d.id),
      '{}'
    ) as photo_paths,
    pr.display_name as owner_name
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
  order by d.created_at desc
  limit least(greatest(p_limit, 1), 50);
$$;

-- Records a swipe and, for a right-swipe, creates the match request
-- in the same transaction. Idempotent thanks to unique constraints.
create or replace function public.record_swipe(
  p_dog_id uuid,
  p_direction text
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_request_id uuid;
begin
  if p_direction not in ('like', 'pass') then
    raise exception 'invalid direction';
  end if;

  insert into public.swipes (swiper_id, dog_id, direction)
  values (auth.uid(), p_dog_id, p_direction)
  on conflict (swiper_id, dog_id) do nothing;

  if p_direction = 'like' then
    insert into public.match_requests (dog_id, requester_id)
    values (p_dog_id, auth.uid())
    on conflict (dog_id, requester_id) do nothing;

    select id into v_request_id
    from public.match_requests
    where dog_id = p_dog_id and requester_id = auth.uid();
  end if;

  return v_request_id;
end;
$$;

-- ============================================================
-- 6. Realtime for chat
-- ============================================================

alter publication supabase_realtime add table public.messages;

-- ============================================================
-- 7. Storage bucket for dog photos
-- ============================================================

insert into storage.buckets (id, name, public)
values ('dog-photos', 'dog-photos', true)
on conflict (id) do nothing;

-- Uploads go to a folder named after the user's id:
-- dog-photos/<user_id>/<file>. Users may only write inside their folder.
create policy "dog_photos_upload_own_folder" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'dog-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "dog_photos_delete_own_folder" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'dog-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "dog_photos_public_read" on storage.objects
  for select using (bucket_id = 'dog-photos');
