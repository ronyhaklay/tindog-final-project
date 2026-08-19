"use client";

import { useRef, useState } from "react";
import { PauseIcon, Volume2Icon } from "lucide-react";

function mediaUrl(bucket: string, storagePath: string) {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return `${base}/storage/v1/object/public/${bucket}/${storagePath}`;
}

export function DogMediaPanel({
  dogName,
  videoPath,
  barkAudioPath,
}: {
  dogName: string;
  videoPath?: string | null;
  barkAudioPath?: string | null;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [barking, setBarking] = useState(false);

  if (!videoPath && !barkAudioPath) return null;

  async function toggleBark() {
    const audio = audioRef.current;
    if (!audio) return;

    if (!audio.paused) {
      audio.pause();
      audio.currentTime = 0;
      setBarking(false);
      return;
    }

    try {
      await audio.play();
      setBarking(true);
    } catch {
      setBarking(false);
    }
  }

  return (
    <section className="overflow-hidden rounded-3xl border border-white/80 bg-white/90 p-4 shadow-sm backdrop-blur">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold">להכיר את {dogName} באמת</h2>
          <p className="text-sm text-muted-foreground">וידאו וקול נביחה מהפרופיל</p>
        </div>

        {barkAudioPath && (
          <>
            <audio
              ref={audioRef}
              src={mediaUrl("dog-media", barkAudioPath)}
              preload="metadata"
              onEnded={() => setBarking(false)}
              onPause={() => setBarking(false)}
            />
            <button
              type="button"
              onClick={toggleBark}
              className="inline-flex h-11 items-center gap-2 rounded-full border bg-white px-4 text-sm font-bold shadow-sm transition hover:bg-rose-50"
            >
              {barking ? <PauseIcon className="size-4" /> : <Volume2Icon className="size-4 text-primary" />}
              {barking ? "עצור נביחה" : "לשמוע נביחה"}
            </button>
          </>
        )}
      </div>

      {videoPath && (
        <div className="overflow-hidden rounded-2xl bg-black">
          <video
            controls
            playsInline
            preload="metadata"
            className="aspect-video w-full object-cover"
            src={mediaUrl("dog-media", videoPath)}
          >
            הדפדפן שלך לא תומך בהצגת וידאו.
          </video>
        </div>
      )}
    </section>
  );
}
