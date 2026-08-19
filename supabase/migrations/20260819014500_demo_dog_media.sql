-- TinDog demo media enrichment.
-- Safe to run even if the earlier TinDog media migration already exists.

alter table public.dogs
  add column if not exists video_path text,
  add column if not exists bark_audio_path text;

insert into storage.buckets (id, name, public)
values ('dog-media', 'dog-media', true)
on conflict (id) do update set public = true;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'dog_media_public_read'
  ) then
    create policy "dog_media_public_read"
      on storage.objects
      for select
      using (bucket_id = 'dog-media');
  end if;
end
$$;
