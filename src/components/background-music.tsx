"use client";

import { CirclePauseIcon, CirclePlayIcon } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState } from "react";

const VIDEO_ID = "ojULkWEUsPs";
const START_SECONDS = 47;

const PLAY_URL =
  `https://www.youtube.com/embed/${VIDEO_ID}` +
  `?autoplay=1&start=${START_SECONDS}&loop=1&playlist=${VIDEO_ID}` +
  `&controls=0&disablekb=1&playsinline=1&rel=0&modestbranding=1`;

export function BackgroundMusic() {
  const pathname = usePathname();
  const [playing, setPlaying] = useState(false);

  // The root layout keeps this component mounted during normal Next.js navigation,
  // so both the button and the currently-playing iframe continue across pages.
  const isHome = pathname === "/";

  return (
    <>
      {playing ? (
        <iframe
          title="TinDog background music"
          src={PLAY_URL}
          allow="autoplay; encrypted-media"
          className="pointer-events-none fixed left-0 top-0 h-px w-px opacity-0"
        />
      ) : null}

      <button
        type="button"
        onClick={() => setPlaying((current) => !current)}
        aria-pressed={playing}
        aria-label={playing ? "עצירת מוזיקה" : "הפעלת מוזיקה"}
        className={`fixed top-5 z-[9999] flex items-center gap-2 rounded-full border border-rose-200/80 bg-white/95 px-3.5 py-2 text-sm font-bold text-slate-800 backdrop-blur-xl transition hover:bg-white ${
          isHome ? "left-5 sm:left-[20.5rem]" : "left-5"
        }`}
      >
        <span className="flex size-7 items-center justify-center rounded-full bg-primary text-white">
          {playing ? (
            <CirclePauseIcon className="size-5" />
          ) : (
            <CirclePlayIcon className="size-5" />
          )}
        </span>
        <span>מוזיקה</span>
      </button>
    </>
  );
}
