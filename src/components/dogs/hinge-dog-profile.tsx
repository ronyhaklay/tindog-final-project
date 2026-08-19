"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowRightIcon,
  CatIcon,
  CheckCircle2Icon,
  DogIcon,
  HeartHandshakeIcon,
  HomeIcon,
  MapPinIcon,
  PauseIcon,
  ShieldCheckIcon,
  SparklesIcon,
  UsersIcon,
  Volume2Icon,
  ZapIcon,
} from "lucide-react";
import { FavoriteButton } from "@/components/favorites/favorite-button";
import { Button } from "@/components/ui/button";
import { publicDogMediaUrl, publicPhotoUrl } from "@/lib/photos";

type Photo = {
  id?: string;
  storage_path: string;
  sort_order?: number;
};

type DogProfile = {
  id: string;
  owner_id?: string;
  name: string;
  breed?: string | null;
  age_years?: number | string | null;
  size?: string | null;
  energy_level?: string | null;
  temperament?: string | null;
  special_needs?: string | null;
  description?: string | null;
  listing_type?: string | null;
  city?: string | null;
  gender?: string | null;
  good_with_kids?: boolean | null;
  good_with_dogs?: boolean | null;
  good_with_cats?: boolean | null;
  house_trained?: boolean | null;
  vaccinated?: boolean | null;
  neutered?: boolean | null;
  video_path?: string | null;
  bark_audio_path?: string | null;
  owner_name?: string | null;
  is_favorited?: boolean | null;
  dog_photos?: Photo[] | null;
};

const CITY_HE: Record<string, string> = {
  "Tel Aviv": "תל אביב",
  "Tel Aviv-Yafo": "תל אביב-יפו",
  Jerusalem: "ירושלים",
  "Ramat Gan": "רמת גן",
  Herzliya: "הרצליה",
  Netanya: "נתניה",
  Haifa: "חיפה",
  Holon: "חולון",
  "Bat Yam": "בת ים",
  "Petah Tikva": "פתח תקווה",
  "Rishon LeZion": "ראשון לציון",
  Rehovot: "רחובות",
  "Kfar Saba": "כפר סבא",
  Raanana: "רעננה",
  "Beer Sheva": "באר שבע",
  Ashdod: "אשדוד",
  Ashkelon: "אשקלון",
  Eilat: "אילת",
};

const BREED_HE: Array<[RegExp, string]> = [
  [/golden retriever/i, "גולדן רטריבר"],
  [/labrador/i, "לברדור"],
  [/border collie/i, "בורדר קולי"],
  [/siberian husky|husky/i, "האסקי"],
  [/miniature pinscher|pinscher/i, "פינצ׳ר"],
  [/german shepherd/i, "רועה גרמני"],
  [/cocker spaniel/i, "קוקר ספנייל"],
  [/samoyed/i, "סמוייד"],
  [/rottweiler/i, "רוטוויילר"],
  [/chihuahua/i, "צ׳יוואווה"],
  [/dachshund/i, "תחש"],
  [/poodle/i, "פודל"],
  [/beagle/i, "ביגל"],
  [/boxer/i, "בוקסר"],
  [/pug/i, "פאג"],
  [/malamute/i, "מלמוט"],
  [/terrier/i, "טרייר"],
  [/retriever/i, "רטריבר"],
  [/collie/i, "קולי"],
];

function mediaUrl(value?: string | null) {
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value;
  return publicDogMediaUrl(value);
}

function breedLabel(raw: string | null | undefined, he: boolean) {
  const value = raw?.trim() || (he ? "מעורב" : "Mixed breed");
  if (!he) return value;

  for (const [pattern, label] of BREED_HE) {
    if (pattern.test(value)) {
      return /\bmix(?:ed)?\b/i.test(value) ? `${label} מעורב` : label;
    }
  }

  return /^mixed/i.test(value) ? "מעורב" : value;
}

function ageLabel(raw: DogProfile["age_years"], he: boolean) {
  const value = Number(raw);
  if (!Number.isFinite(value)) return "";
  if (he) return value === 1 ? "שנה" : `${value} שנים`;
  return value === 1 ? "1 year" : `${value} years`;
}

function personality(dog: DogProfile, he: boolean) {
  if (!he) {
    return dog.temperament || dog.description || "A lovely dog looking for a caring home.";
  }

  const female = dog.gender === "female";

  if (dog.energy_level === "high") {
    return female
      ? "חברותית, אנרגטית וסקרנית. אוהבת משחק, טיולים וקרבה לאנשים."
      : "חברותי, אנרגטי וסקרן. אוהב משחק, טיולים וקרבה לאנשים.";
  }

  if (dog.energy_level === "low") {
    return female
      ? "רגועה, מתוקה ונעימה. אוהבת קרבה ושגרה רגועה."
      : "רגוע, מתוק ונעים. אוהב קרבה ושגרה רגועה.";
  }

  return female
    ? "חברותית, נעימה ונאמנה, עם שילוב טוב של משחק ורוגע."
    : "חברותי, נעים ונאמן, עם שילוב טוב של משחק ורוגע.";
}

function description(dog: DogProfile, he: boolean) {
  if (!he) {
    return dog.description || "Looking for a warm, stable home and a family to love.";
  }

  const female = dog.gender === "female";
  const items: string[] = [];
  if (dog.good_with_kids) items.push("ילדים");
  if (dog.good_with_dogs) items.push("כלבים");
  if (dog.good_with_cats) items.push("חתולים");

  const text = [
    female
      ? "מחפשת בית חם, יציב ואוהב שבו תוכל להרגיש בטוחה ולהיות חלק מהמשפחה."
      : "מחפש בית חם, יציב ואוהב שבו יוכל להרגיש בטוח ולהיות חלק מהמשפחה.",
  ];

  if (items.length) {
    text.push(`${female ? "מתאימה" : "מתאים"} לבית עם ${items.join(", ")}.`);
  }

  return text.join(" ");
}

function PhotoCard({
  photo,
  dogName,
  index,
}: {
  photo: Photo;
  dogName: string;
  index: number;
}) {
  return (
    <div className="overflow-hidden rounded-[2rem] border border-white/80 bg-white shadow-[0_18px_60px_rgba(15,23,42,0.10)]">
      <img
        src={publicPhotoUrl(photo.storage_path)}
        alt={`${dogName} ${index + 1}`}
        className="block aspect-[4/5] w-full object-cover"
        loading={index === 0 ? "eager" : "lazy"}
      />
    </div>
  );
}

function PromptCard({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof SparklesIcon;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[2rem] border border-white/80 bg-white/92 p-6 shadow-[0_14px_50px_rgba(15,23,42,0.07)] backdrop-blur">
      <div className="mb-3 flex items-center gap-2">
        <span className="flex size-9 items-center justify-center rounded-full bg-rose-50 text-primary">
          <Icon className="size-4" />
        </span>
        <h2 className="text-xl font-black">{title}</h2>
      </div>
      {children}
    </section>
  );
}

export function HingeDogProfile({ dog }: { dog: DogProfile }) {
  const [he, setHe] = useState(false);
  const [barking, setBarking] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const root = document.documentElement;
    setHe(root.dir === "rtl" || root.lang?.toLowerCase().startsWith("he"));
  }, []);

  const photos = useMemo(
    () =>
      [...(dog.dog_photos || [])].sort(
        (a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0),
      ),
    [dog.dog_photos],
  );

  const compatibility = [
    { ok: dog.good_with_kids, he: "מתאים עם ילדים", en: "Good with kids", icon: UsersIcon },
    { ok: dog.good_with_dogs, he: "מסתדר עם כלבים", en: "Good with dogs", icon: DogIcon },
    { ok: dog.good_with_cats, he: "מסתדר עם חתולים", en: "Good with cats", icon: CatIcon },
    { ok: dog.house_trained, he: "מורגל לבית", en: "House trained", icon: HomeIcon },
    { ok: dog.vaccinated, he: "מחוסן", en: "Vaccinated", icon: ShieldCheckIcon },
    { ok: dog.neutered, he: "מסורס / מעוקרת", en: "Spayed / neutered", icon: CheckCircle2Icon },
  ].filter((item) => item.ok);

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

  const city = he ? CITY_HE[dog.city || ""] || dog.city : dog.city;

  return (
    <div dir={he ? "rtl" : "ltr"} className="mx-auto w-full max-w-[680px] pb-20">
      <div className="sticky top-2 z-30 mb-4 flex items-center justify-between rounded-full border border-white/75 bg-white/90 p-2 shadow-lg backdrop-blur">
        <Link href="/swipe">
          <Button variant="ghost" className="rounded-full">
            <ArrowRightIcon className={he ? "" : "rotate-180"} />
            {he ? "חזרה לכלבים" : "Back"}
          </Button>
        </Link>

        <FavoriteButton
          dogId={dog.id}
          initialFavorited={Boolean(dog.is_favorited)}
        />
      </div>

      <div className="flex flex-col gap-5">
        {photos[0] && <PhotoCard photo={photos[0]} dogName={dog.name} index={0} />}

        <PromptCard icon={HeartHandshakeIcon} title={he ? "הכירו מקרוב" : "Meet your match"}>
          <h1 className="text-4xl font-black tracking-tight">{dog.name}</h1>
          <p className="mt-1 text-lg font-bold text-foreground/75">
            {ageLabel(dog.age_years, he)}
          </p>
          <p className="mt-3 flex flex-wrap items-center gap-1.5 text-base text-muted-foreground">
            <MapPinIcon className="size-4" />
            {city || (he ? "ישראל" : "Israel")} · {breedLabel(dog.breed, he)}
          </p>

          <div className="mt-5 flex flex-wrap gap-2">
            {dog.gender && (
              <span className="rounded-full bg-muted px-3 py-1.5 text-sm font-semibold">
                {he
                  ? dog.gender === "female"
                    ? "נקבה"
                    : "זכר"
                  : dog.gender === "female"
                    ? "Female"
                    : "Male"}
              </span>
            )}

            {dog.size && (
              <span className="rounded-full bg-muted px-3 py-1.5 text-sm font-semibold">
                {he
                  ? dog.size === "small"
                    ? "קטן"
                    : dog.size === "large"
                      ? "גדול"
                      : "בינוני"
                  : dog.size}
              </span>
            )}

            {dog.energy_level && (
              <span className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1.5 text-sm font-semibold">
                <ZapIcon className="size-3.5" />
                {he
                  ? dog.energy_level === "high"
                    ? "אנרגטי"
                    : dog.energy_level === "low"
                      ? "רגוע"
                      : "אנרגיה בינונית"
                  : `${dog.energy_level} energy`}
              </span>
            )}
          </div>

          <p className="mt-5 text-lg leading-8 text-foreground/80">
            {description(dog, he)}
          </p>
        </PromptCard>

        {photos[1] && <PhotoCard photo={photos[1]} dogName={dog.name} index={1} />}

        <PromptCard icon={SparklesIcon} title={he ? "האישיות שלי" : "My personality"}>
          <p className="text-lg leading-8">{personality(dog, he)}</p>
        </PromptCard>

        {photos[2] && <PhotoCard photo={photos[2]} dogName={dog.name} index={2} />}

        <PromptCard icon={UsersIcon} title={he ? "למי אני יכול להתאים?" : "A good fit for"}>
          {compatibility.length ? (
            <div className="grid gap-2 sm:grid-cols-2">
              {compatibility.map(({ he: heLabel, en, icon: Icon }) => (
                <div
                  key={en}
                  className="flex items-center gap-2 rounded-2xl bg-muted/65 px-4 py-3 font-semibold"
                >
                  <Icon className="size-4 text-primary" />
                  {he ? heLabel : en}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">
              {he
                ? "העמותה תשמח לספר לך עוד על ההתאמה לבית שלך."
                : "The shelter can tell you more about household compatibility."}
            </p>
          )}
        </PromptCard>

        {photos[3] && <PhotoCard photo={photos[3]} dogName={dog.name} index={3} />}

        {(dog.video_path || dog.bark_audio_path) && (
          <PromptCard icon={DogIcon} title={he ? "עוד קצת ממני" : "See and hear me"}>
            <div className="space-y-4">
              {dog.video_path && (
                <div className="overflow-hidden rounded-3xl bg-black">
                  <video
                    src={mediaUrl(dog.video_path)}
                    controls
                    playsInline
                    preload="metadata"
                    className="aspect-video w-full object-cover"
                  />
                </div>
              )}

              {dog.bark_audio_path && (
                <div className="rounded-2xl bg-rose-50 p-4">
                  <audio
                    ref={audioRef}
                    src={mediaUrl(dog.bark_audio_path)}
                    preload="metadata"
                    onEnded={() => setBarking(false)}
                    onPause={() => setBarking(false)}
                  />
                  <button
                    type="button"
                    onClick={() => void toggleBark()}
                    className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2.5 font-bold shadow-sm"
                  >
                    {barking ? (
                      <PauseIcon className="size-4" />
                    ) : (
                      <Volume2Icon className="size-4 text-primary" />
                    )}
                    {barking
                      ? he
                        ? "עצירת הנביחה"
                        : "Stop bark"
                      : he
                        ? "לשמוע נביחה"
                        : "Hear bark"}
                  </button>
                </div>
              )}
            </div>
          </PromptCard>
        )}

        {photos.slice(4).map((photo, offset) => (
          <PhotoCard
            key={photo.id || photo.storage_path}
            photo={photo}
            dogName={dog.name}
            index={offset + 4}
          />
        ))}

        {dog.special_needs && (
          <PromptCard icon={ShieldCheckIcon} title={he ? "חשוב לדעת" : "Good to know"}>
            <p className="leading-7">
              {he
                ? "יש מידע נוסף שחשוב לקבל מנציגי העמותה לפני האימוץ."
                : dog.special_needs}
            </p>
          </PromptCard>
        )}

        <PromptCard icon={HeartHandshakeIcon} title={he ? "השלב הבא" : "Next step"}>
          <p className="text-lg font-bold">
            {he
              ? `הפרופיל מנוהל על ידי ${dog.owner_name || "העמותה"}.`
              : `Listed by ${dog.owner_name || "the shelter"}.`}
          </p>
          <p className="mt-2 leading-7 text-muted-foreground">
            {he
              ? "אם יש התאמה, אפשר לחזור למסך הכלבים ולהחליק ימינה. לאחר אישור העמותה תוכלו להתחיל שיחה ולתאם מפגש."
              : "Return to Discover and swipe right to send an adoption request. After approval, you can start a chat and arrange a meeting."}
          </p>
        </PromptCard>
      </div>
    </div>
  );
}
