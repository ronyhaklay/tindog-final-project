"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { HeartIcon, MessageCircleIcon, PawPrintIcon, SparklesIcon, Volume2Icon, XIcon } from "lucide-react";
import { markMatchSeen } from "@/actions/requests";
import { useLanguage } from "@/components/language-provider";
import { Button } from "@/components/ui/button";
import { publicDogMediaUrl, publicPhotoUrl } from "@/lib/photos";

export function MatchCelebration({ requestId, dogName, photoPath, barkAudioPath, shelterName }: { requestId: string; dogName: string; photoPath: string | null; barkAudioPath: string | null; shelterName: string }) {
  const [visible, setVisible] = useState(true);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const { isHebrew } = useLanguage();

  function close() {
    startTransition(async () => {
      await markMatchSeen(requestId);
      setVisible(false);
      router.refresh();
    });
  }

  function openChat() {
    startTransition(async () => {
      await markMatchSeen(requestId);
      setVisible(false);
      router.push(`/matches/${requestId}`);
      router.refresh();
    });
  }
  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto bg-[radial-gradient(circle_at_top,#ff5875_0%,#d92c5b_38%,#651a58_100%)] px-4 py-8 text-white">
      <div className="match-paw paw-a">🐾</div><div className="match-paw paw-b">🐾</div><div className="match-paw paw-c">🦴</div><div className="match-paw paw-d">🐾</div><div className="match-paw paw-e">❤️</div>
      <button type="button" onClick={close} disabled={pending} className="absolute right-5 top-5 z-20 rounded-full bg-white/15 p-3 backdrop-blur hover:bg-white/25" aria-label={isHebrew ? "סגירת ההתאמה" : "Close match"}><XIcon className="size-5" /></button>
      <div className="relative z-10 mx-auto flex min-h-[calc(100svh-4rem)] max-w-2xl flex-col items-center justify-center text-center">
        <div className="mb-4 flex items-center gap-2 rounded-full border border-white/20 bg-white/12 px-4 py-2 text-sm font-semibold backdrop-blur"><SparklesIcon className="size-4" />{isHebrew ? "העמותה אישרה את הבקשה שלך" : "A shelter approved your request"}</div>
        <h1 className="text-5xl font-black italic tracking-[-0.06em] sm:text-7xl">{isHebrew ? "יש התאמה!" : "IT’S A MATCH!"}</h1>
        <p className="mt-3 max-w-lg text-lg text-white/85">{isHebrew ? <>את/ה ו-<strong className="text-white">{dogName}</strong> יכולים לעשות את הצעד הבא. {shelterName} פתחה עבורכם צ׳אט פרטי.</> : <>You and <strong className="text-white">{dogName}</strong> can take the next step. {shelterName} opened a private chat for you.</>}</p>

        <div className="relative mt-8">
          <div className="absolute -inset-5 rounded-full bg-white/20 blur-2xl" />
          <div className="relative size-52 overflow-hidden rounded-full border-8 border-white/90 bg-white/15 shadow-2xl sm:size-64">
            {photoPath ? <Image src={publicPhotoUrl(photoPath)} alt={dogName} fill sizes="256px" className="object-cover" priority /> : <div className="flex h-full items-center justify-center"><PawPrintIcon className="size-24 text-white/70" /></div>}
          </div>
          <div className="absolute -bottom-2 -right-2 flex size-16 items-center justify-center rounded-full bg-white text-primary shadow-xl"><HeartIcon className="size-8 fill-current" /></div>
        </div>

        {barkAudioPath && (
          <button type="button" className="mt-6 flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-semibold backdrop-blur hover:bg-white/25" onClick={(e) => { const audio = e.currentTarget.querySelector("audio"); audio?.play(); }}>
            <Volume2Icon className="size-4" />{isHebrew ? `לשמוע את ${dogName} אומר/ת שלום` : `Hear ${dogName} say hi`}<audio src={publicDogMediaUrl(barkAudioPath)} preload="none" />
          </button>
        )}

        <div className="mt-8 grid w-full max-w-md gap-3 sm:grid-cols-2">
          <Button size="lg" onClick={openChat} disabled={pending} className="w-full bg-white text-primary hover:bg-white/90"><MessageCircleIcon data-icon="inline-start" />{isHebrew ? "התחלת צ׳אט" : "Start chatting"}</Button>
          <Button size="lg" variant="outline" disabled={pending} onClick={close} className="border-white/40 bg-white/10 text-white hover:bg-white/20 hover:text-white"><PawPrintIcon data-icon="inline-start" />{isHebrew ? "להמשיך לגלות" : "Keep discovering"}</Button>
        </div>
        <p className="mt-5 text-xs text-white/65">{isHebrew ? "השלב הבא: מדברים, קובעים מפגש היכרות ונותנים לעמותה ללוות את תהליך האימוץ." : "Next: chat, arrange a meet & greet, and let the shelter guide the adoption process."}</p>
      </div>
    </div>
  );
}
