-- TinDog media V3: external demo media URLs.
-- No remote-media download is required.

alter table public.dogs
  add column if not exists video_path text,
  add column if not exists bark_audio_path text;
