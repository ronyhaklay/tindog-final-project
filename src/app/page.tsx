import Image from "next/image";
import Link from "next/link";
import {
  Building2Icon,
  HeartHandshakeIcon,
  PawPrintIcon,
  VideoIcon,
  SearchIcon,
  ShieldCheckIcon,
  Volume2Icon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LanguageSwitcher } from "@/components/language-switcher";
import { getLocale } from "@/lib/i18n-server";
import { createClient } from "@/lib/supabase/server";

export default async function LandingPage() {
  const locale = await getLocale();
  const he = locale === "he";
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const features = he
    ? [
        {
          icon: SearchIcon,
          title: "התאמה לאורח החיים",
          text: "ציון התאמה לפי אנרגיה, סוג הבית, ילדים, חיות נוספות וגודל הכלב - ולא רק לפי תמונה חמודה.",
        },
        {
          icon: VideoIcon,
          title: "להכיר את הכלב באמת",
          text: "פרופילים יכולים לכלול תמונות, סרטון קצר ואפילו הקלטת נביחה קטנה.",
        },
        {
          icon: HeartHandshakeIcon,
          title: "התאמות באישור העמותה",
          text: "העמותה בוחנת את המתעניינים. אישור פותח צ׳אט פרטי ורגע Match חגיגי על כל המסך.",
        },
      ]
    : [
        {
          icon: SearchIcon,
          title: "Lifestyle matching",
          text: "See a fit score based on energy, home, kids, pets and dog size - not just a cute photo.",
        },
        {
          icon: VideoIcon,
          title: "Meet the real dog",
          text: "Profiles can include photos, a short video and even a tiny bark recording.",
        },
        {
          icon: HeartHandshakeIcon,
          title: "Shelter-approved matches",
          text: "Shelters review interested adopters. Approval unlocks a private chat and a full-screen match moment.",
        },
      ];

  return (
    <main className="relative flex min-h-svh flex-col overflow-hidden bg-[radial-gradient(circle_at_8%_10%,rgba(255,225,232,0.88),transparent_34%),radial-gradient(circle_at_92%_88%,rgba(255,239,197,0.72),transparent_32%),linear-gradient(135deg,#fffafb_0%,#fffdf9_52%,#fffaf2_100%)]">
      <div aria-hidden className="tindog-paw-bg" />

      {/* Denser, slightly darker dog + paw pattern across the landing page. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0 overflow-hidden select-none"
      >
        <span className="absolute left-[2%] top-[3%] rotate-[-18deg] text-4xl opacity-[0.09]">🐾</span>
        <span className="absolute left-[11%] top-[7%] rotate-[12deg] text-3xl opacity-[0.10]">🐶</span>
        <span className="absolute left-[22%] top-[4%] rotate-[-9deg] text-4xl opacity-[0.08]">🐾</span>
        <span className="absolute left-[37%] top-[9%] rotate-[17deg] text-3xl opacity-[0.09]">🐕</span>
        <span className="absolute left-[51%] top-[4%] rotate-[-14deg] text-5xl opacity-[0.075]">🐾</span>
        <span className="absolute right-[31%] top-[8%] rotate-[10deg] text-3xl opacity-[0.09]">🐶</span>
        <span className="absolute right-[16%] top-[4%] rotate-[-10deg] text-4xl opacity-[0.085]">🐾</span>
        <span className="absolute right-[4%] top-[10%] rotate-[16deg] text-3xl opacity-[0.10]">🐕</span>

        <span className="absolute left-[5%] top-[18%] rotate-[15deg] text-3xl opacity-[0.10]">🐶</span>
        <span className="absolute left-[17%] top-[23%] rotate-[-13deg] text-5xl opacity-[0.08]">🐾</span>
        <span className="absolute left-[31%] top-[17%] rotate-[7deg] text-4xl opacity-[0.085]">🐕</span>
        <span className="absolute left-[45%] top-[25%] rotate-[-17deg] text-3xl opacity-[0.095]">🐶</span>
        <span className="absolute right-[39%] top-[18%] rotate-[13deg] text-5xl opacity-[0.08]">🐾</span>
        <span className="absolute right-[25%] top-[24%] rotate-[-8deg] text-3xl opacity-[0.095]">🐕</span>
        <span className="absolute right-[12%] top-[18%] rotate-[18deg] text-4xl opacity-[0.09]">🐾</span>
        <span className="absolute right-[2%] top-[27%] rotate-[-14deg] text-3xl opacity-[0.10]">🐶</span>

        <span className="absolute left-[1%] top-[34%] rotate-[18deg] text-5xl opacity-[0.08]">🐾</span>
        <span className="absolute left-[13%] top-[39%] rotate-[-11deg] text-3xl opacity-[0.10]">🐕</span>
        <span className="absolute left-[27%] top-[33%] rotate-[10deg] text-4xl opacity-[0.085]">🐶</span>
        <span className="absolute left-[41%] top-[41%] rotate-[-16deg] text-5xl opacity-[0.075]">🐾</span>
        <span className="absolute right-[42%] top-[35%] rotate-[12deg] text-3xl opacity-[0.095]">🐕</span>
        <span className="absolute right-[28%] top-[40%] rotate-[-9deg] text-4xl opacity-[0.085]">🐾</span>
        <span className="absolute right-[15%] top-[33%] rotate-[17deg] text-3xl opacity-[0.10]">🐶</span>
        <span className="absolute right-[3%] top-[42%] rotate-[-15deg] text-5xl opacity-[0.08]">🐾</span>

        <span className="absolute left-[6%] top-[51%] rotate-[-12deg] text-4xl opacity-[0.09]">🐶</span>
        <span className="absolute left-[19%] top-[56%] rotate-[14deg] text-5xl opacity-[0.08]">🐾</span>
        <span className="absolute left-[33%] top-[49%] rotate-[-8deg] text-3xl opacity-[0.10]">🐕</span>
        <span className="absolute left-[47%] top-[57%] rotate-[17deg] text-4xl opacity-[0.085]">🐾</span>
        <span className="absolute right-[39%] top-[50%] rotate-[-14deg] text-3xl opacity-[0.095]">🐶</span>
        <span className="absolute right-[25%] top-[57%] rotate-[11deg] text-5xl opacity-[0.08]">🐾</span>
        <span className="absolute right-[11%] top-[51%] rotate-[-10deg] text-4xl opacity-[0.09]">🐕</span>
        <span className="absolute right-[1%] top-[60%] rotate-[16deg] text-3xl opacity-[0.10]">🐶</span>

        <span className="absolute left-[2%] top-[68%] rotate-[11deg] text-5xl opacity-[0.08]">🐾</span>
        <span className="absolute left-[15%] top-[73%] rotate-[-17deg] text-3xl opacity-[0.10]">🐶</span>
        <span className="absolute left-[29%] top-[66%] rotate-[8deg] text-4xl opacity-[0.09]">🐕</span>
        <span className="absolute left-[43%] top-[75%] rotate-[-12deg] text-5xl opacity-[0.075]">🐾</span>
        <span className="absolute right-[42%] top-[68%] rotate-[15deg] text-3xl opacity-[0.095]">🐶</span>
        <span className="absolute right-[28%] top-[74%] rotate-[-8deg] text-4xl opacity-[0.085]">🐾</span>
        <span className="absolute right-[14%] top-[67%] rotate-[18deg] text-3xl opacity-[0.10]">🐕</span>
        <span className="absolute right-[3%] top-[76%] rotate-[-14deg] text-5xl opacity-[0.08]">🐾</span>

        <span className="absolute left-[7%] top-[84%] rotate-[-10deg] text-4xl opacity-[0.09]">🐕</span>
        <span className="absolute left-[21%] top-[90%] rotate-[13deg] text-5xl opacity-[0.08]">🐾</span>
        <span className="absolute left-[36%] top-[83%] rotate-[-15deg] text-3xl opacity-[0.10]">🐶</span>
        <span className="absolute left-[52%] top-[91%] rotate-[10deg] text-4xl opacity-[0.085]">🐾</span>
        <span className="absolute right-[31%] top-[84%] rotate-[-12deg] text-3xl opacity-[0.095]">🐕</span>
        <span className="absolute right-[17%] top-[90%] rotate-[16deg] text-5xl opacity-[0.08]">🐾</span>
        <span className="absolute right-[5%] top-[85%] rotate-[-9deg] text-3xl opacity-[0.10]">🐶</span>
      </div>

      <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
        <Link href="/" className="flex items-center gap-2.5">
          <Image
            src="/logo.png"
            alt="TinDog logo"
            width={42}
            height={42}
            className="rounded-2xl shadow-sm"
          />
          <span className="text-xl font-extrabold tracking-tight">
            tin<span className="text-primary">dog</span>
          </span>
        </Link>

        <nav className="flex items-center gap-2">
          <LanguageSwitcher compact />
          {user ? (
            <Link href="/auth-start?intent=login">
              <Button>{he ? "כניסה לאפליקציה" : "Open app"}</Button>
            </Link>
          ) : (
            <Link href="/login">
              <Button className="bg-primary px-5 font-bold text-white shadow-sm hover:bg-primary/90">
                {he ? "התחברות" : "Log in"}
              </Button>
            </Link>
          )}
        </nav>
      </header>

      <section className="relative z-10 mx-auto grid w-full max-w-6xl flex-1 items-center gap-7 px-5 py-7 sm:px-8 lg:grid-cols-[1.05fr_.95fr] lg:py-10">
        <div>
          <div className="mb-4 inline-flex items-center rounded-full border border-primary/20 bg-white/90 px-5 py-3 text-lg font-extrabold text-primary shadow-md shadow-rose-100/70 backdrop-blur sm:px-6 sm:py-3.5 sm:text-xl">
            {he ? (
              <span className="inline-flex items-center gap-2.5" dir="rtl">
                <span>מחליקים. מתאהבים. מאמצים!</span>
                <span className="text-2xl leading-none sm:text-3xl">🐶</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-2.5">
                <span>Swipe. Fall in love. Adopt!</span>
                <span className="text-2xl leading-none sm:text-3xl">🐶</span>
              </span>
            )}
          </div>

          <h1 className="max-w-4xl text-4xl font-black leading-[1.02] tracking-[-.045em] sm:text-5xl lg:text-6xl">
            {he ? (
              <>
                TinDog היא האפליקציה המובילה והבטוחה ביותר להכיר את{" "}
                <span className="text-primary">החבר הכי טוב!</span>
              </>
            ) : (
              <>
                TinDog is the leading, safest way to meet your{" "}
                <span className="text-primary">best friend!</span>
              </>
            )}
          </h1>

          <p className="mt-4 max-w-3xl text-lg leading-8 text-muted-foreground sm:text-xl">
            {he
              ? "אימוץ כלבים הופך לחוויה ויזואלית, חמה ונגישה יותר - כל פרופיל של כלב מאושר ע״י בעלי עמותות מזוהות וכל התאמה מבוססת על אחוזי חיבור ואישור העמותות כך שיבטיח אימוץ בטוח ומרגש."
              : "Dog adoption becomes a warmer, more visual and accessible experience - every dog profile is approved by verified shelter managers, and every connection is based on a fit score and shelter approval for a safer, more exciting adoption."}
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/signup?role=adopter">
              <Button
                size="lg"
                className="h-12 border border-[#2F6654]/30 bg-[#4F8B73] pl-7 pr-5 font-bold text-white shadow-sm hover:bg-[#447B66] justify-center text-center"
              >
                <PawPrintIcon data-icon="inline-start" />
                <span className={he ? "relative translate-x-1.5" : ""}>{he ? "להכיר כלבים לאימוץ" : "Meet adoptable dogs"}</span>
              </Button>
            </Link>
            <Link href="/signup?role=shelter_admin">
              <Button size="lg" className="h-12 border border-emerald-950/25 bg-emerald-900 pl-7 pr-5 font-bold text-white shadow-sm hover:bg-emerald-800 justify-center text-center">
                <Building2Icon data-icon="inline-start" />
                <span className={he ? "relative translate-x-1.5" : ""}>{he ? "אני מעמותה" : "I'm a shelter"}</span>
              </Button>
            </Link>
          </div>

          <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground sm:text-base">
            <span>✓ {he ? "פרופילים בניהול עמותות" : "Shelter-managed listings"}</span>
            <span>
              ✓ {he ? "תמונות, סרטונים ואפילו קול נביחה של הכלב" : "Photos, videos and even the dog's bark"}
            </span>
            <span>
              ✓ {he ? "Match מוביל לשיחה עם נציג העמותה ותיאום דייט כלבבי" : "A Match opens a shelter chat and a doggy date"}
            </span>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-md lg:max-w-none">
          <div className="absolute -top-10 -left-10 size-52 rounded-full bg-rose-200/30 blur-3xl" />
          <div className="absolute -right-10 -bottom-10 size-52 rounded-full bg-amber-100/55 blur-3xl" />
          <Card className="relative rotate-2 overflow-hidden border border-slate-300/80 bg-slate-100 shadow-[0_30px_70px_rgba(15,23,42,0.18),0_8px_24px_rgba(100,116,139,0.12)]">
            <div className="relative aspect-[4/5] bg-[radial-gradient(circle_at_26%_16%,#ffffff_0%,#f8fafc_24%,#eef0f2_50%,#dfe3e7_76%,#cbd0d5_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.95),inset_0_-34px_70px_rgba(100,116,139,0.16)]">
              <div className="absolute inset-0 flex items-center justify-center">
                <Image
                  src="/logo.png"
                  alt="TinDog"
                  width={170}
                  height={170}
                  className="rounded-[36px] bg-white/95 opacity-95 shadow-2xl"
                />
              </div>
              <div className="absolute left-5 top-5 flex gap-2">
                <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-primary shadow">
                  <VideoIcon className="mr-1 inline size-3" />
                  {he ? "וידאו" : "VIDEO"}
                </span>
                <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-primary shadow">
                  <Volume2Icon className="mr-1 inline size-3" />
                  {he ? "נביחה" : "BARK"}
                </span>
              </div>
              <div className="absolute inset-x-0 bottom-0 border-t border-white/70 bg-white/45 p-6 text-slate-900 shadow-[inset_0_18px_35px_rgba(255,255,255,0.22)] backdrop-blur-md">
                <div className="mb-2 inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                  94% {he ? "התאמה לאורח החיים" : "LIFESTYLE FIT"}
                </div>
                <h2 className="text-3xl font-bold">{he ? "הכירו את ההתאמה שלכם 🐾" : "Meet your match 🐾"}</h2>
                <p className="mt-1 text-sm text-slate-600">
                  {he ? "כל כך הרבה כלבים מדהימים מחפשים בית חם" : "So many amazing dogs are looking for a warm home."}
                </p>
              </div>
            </div>
          </Card>
        </div>
      </section>

      <section className="relative z-10 mx-auto grid w-full max-w-6xl gap-4 px-5 pb-8 sm:px-8 md:grid-cols-3">
        {features.map((feature) => (
          <Card
            key={feature.title}
            className="min-h-[220px] border-rose-100/80 bg-white/92 shadow-md shadow-rose-100/50 backdrop-blur"
          >
            <CardContent className="flex h-full flex-col items-start gap-5 px-7 pb-7 pt-7">
              <div className="rounded-2xl bg-primary/10 p-3.5 text-primary">
                <feature.icon className="size-7" />
              </div>
              <h2 className="text-xl font-bold">{feature.title}</h2>
              <p className="text-base leading-7 text-muted-foreground">{feature.text}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="relative z-10 mx-auto mb-12 flex w-[calc(100%-2.5rem)] max-w-6xl flex-col items-center justify-center gap-3 overflow-hidden rounded-[28px] border border-white/50 bg-[linear-gradient(135deg,#ff6f8b_0%,#ff7b77_42%,#ff8b69_70%,#ffa05d_100%)] px-6 py-8 text-center text-white shadow-[0_18px_45px_rgba(255,96,112,0.20)] sm:px-8 md:py-9">
        <div className="flex flex-col items-center">
          <p className="flex items-center justify-center gap-2 text-xl font-extrabold md:text-2xl">
            <ShieldCheckIcon className="size-6 text-white md:size-7" />
            {he ? "בנוי סביב אימוץ אחראי" : "Built around responsible adoption"}
          </p>
          <p className="mt-2 max-w-3xl text-base font-medium leading-7 text-white/92 md:text-lg">
            {he
              ? "רק חשבונות של מנהלי עמותות יכולים לפרסם או לערוך פרופילי כלבים."
              : "Only shelter manager accounts can publish or edit dog listings."}
          </p>
        </div>
        <div className="mt-1 text-4xl drop-shadow-sm">🐶 🐾 🦴</div>
      </section>

      <footer className="relative z-10 border-t border-rose-100/70 bg-white/70 px-6 py-5 text-center text-xs text-muted-foreground backdrop-blur">
        {he
          ? "TinDog - עוזרים לכלבים טובים למצוא את האנשים הנכונים."
          : "TinDog - helping good dogs meet the right humans."}
      </footer>
    </main>
  );
}
