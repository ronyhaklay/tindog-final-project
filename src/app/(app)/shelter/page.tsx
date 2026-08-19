import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Building2Icon, CheckCircle2Icon, DogIcon, HeartHandshakeIcon, MessageCircleIcon, PlusIcon, ShieldCheckIcon, SparklesIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";
import { getLocale } from "@/lib/i18n-server";

export const metadata: Metadata = { title: "Shelter dashboard" };

export default async function ShelterDashboard() {
  const he = (await getLocale()) === "he";
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user!.id).single<Profile>();
  if (profile?.role !== "shelter_admin") redirect("/swipe");

  const { data: dogs } = await supabase.from("dogs").select("id,is_active").eq("owner_id", user!.id);
  const ids = (dogs ?? []).map((d) => d.id);
  let pending = 0;
  let approved = 0;
  if (ids.length) {
    const { count: p } = await supabase.from("match_requests").select("id", { count: "exact", head: true }).in("dog_id", ids).eq("status", "pending");
    const { count: a } = await supabase.from("match_requests").select("id", { count: "exact", head: true }).in("dog_id", ids).eq("status", "approved");
    pending = p ?? 0; approved = a ?? 0;
  }

  const stats = [
    { label: he ? "כלבים פעילים" : "Active dogs", value: (dogs ?? []).filter((d) => d.is_active).length, icon: DogIcon },
    { label: he ? "בקשות ממתינות" : "Waiting requests", value: pending, icon: HeartHandshakeIcon },
    { label: he ? "צ׳אטים פתוחים" : "Open chats", value: approved, icon: MessageCircleIcon },
  ];

  return (
    <div className="flex flex-col gap-6">
      <section className="relative overflow-hidden rounded-[32px] border border-white/80 bg-gradient-to-br from-rose-600 via-primary to-fuchsia-800 p-6 text-white shadow-2xl shadow-rose-200/40 sm:p-8">
        <div className="absolute -right-8 -top-8 text-[140px] opacity-10">🐾</div>
        <div className="relative z-10 flex flex-wrap items-end justify-between gap-5">
          <div>
            <div className="mb-3 flex flex-wrap items-center gap-2"><Badge className="bg-white/15 text-white hover:bg-white/20">{he ? "מנהלי עמותה" : "Shelter manager"}</Badge>{profile.shelter_verified && <Badge className="bg-emerald-400 text-emerald-950"><ShieldCheckIcon className="size-3" />{he ? "מאומתת" : "Verified"}</Badge>}</div>
            <p className="text-sm text-white/75">{he ? "ברוכים השבים" : "Welcome back"}</p>
            <h1 className="mt-1 text-4xl font-black tracking-tight">{profile.shelter_name || (he ? "העמותה שלך" : "Your shelter")}</h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-white/80">{he ? "פרסמו פרופילים עשירים, עברו על בקשות אימוץ ועזרו לכל כלב לפגוש את האדם שמתאים לחיים האמיתיים שלו." : "Publish rich profiles, listen to adoption requests, and help every dog meet the human who fits their real life."}</p>
          </div>
          <Link href="/dogs/new"><Button size="lg" className="bg-white text-primary hover:bg-white/90"><PlusIcon data-icon="inline-start" />{he ? "הוספת כלב" : "Add a dog"}</Button></Link>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map(({ label, value, icon: Icon }) => <Card key={label} className="border-white/80 bg-white/90 shadow-sm"><CardContent className="flex items-center gap-4 pt-5"><div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Icon className="size-5" /></div><div><p className="text-3xl font-black">{value}</p><p className="text-sm text-muted-foreground">{label}</p></div></CardContent></Card>)}
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.2fr_.8fr]">
        <Card className="border-white/80 bg-white/90"><CardContent className="pt-6"><h2 className="text-xl font-bold">{he ? "פעולות מהירות" : "Quick actions"}</h2><div className="mt-4 grid gap-3 sm:grid-cols-2"><Link href="/dogs"><Button variant="outline" className="h-auto w-full justify-start py-4"><DogIcon className="size-5" /><span className="text-start"><strong className="block">{he ? "ניהול פרסומים" : "Manage listings"}</strong><span className="text-xs font-normal text-muted-foreground">{he ? "תמונות, וידאו, נביחה וסיפור" : "Photos, video, bark & story"}</span></span></Button></Link><Link href="/requests"><Button variant="outline" className="h-auto w-full justify-start py-4"><HeartHandshakeIcon className="size-5" /><span className="text-start"><strong className="block">{he ? "בדיקת מאמצים" : "Review adopters"}</strong><span className="text-xs font-normal text-muted-foreground">{he ? "בדקו התאמה לאורח החיים לפני אישור" : "See lifestyle fit before approving"}</span></span></Button></Link></div></CardContent></Card>
        <Card className="border-amber-200/70 bg-gradient-to-br from-amber-50 to-rose-50"><CardContent className="pt-6"><h2 className="flex items-center gap-2 text-lg font-bold"><SparklesIcon className="size-5 text-primary" />{he ? "טיפים לפרופיל" : "Profile tips"}</h2><div className="mt-4 space-y-3 text-sm text-muted-foreground"><p className="flex gap-2"><CheckCircle2Icon className="mt-0.5 size-4 shrink-0 text-emerald-600" />{he ? "פתחו בתמונה מוארת בגובה העיניים." : "Lead with a bright eye-level photo."}</p><p className="flex gap-2"><CheckCircle2Icon className="mt-0.5 size-4 shrink-0 text-emerald-600" />{he ? "הוסיפו סרטון קצר שבו רואים את הכלב בתנועה." : "Add a short movement video."}</p><p className="flex gap-2"><CheckCircle2Icon className="mt-0.5 size-4 shrink-0 text-emerald-600" />{he ? "הקליטו נביחה או ברכת שלום שמחה של הכלב." : "Record the dog’s bark or happy greeting."}</p></div></CardContent></Card>
      </div>
    </div>
  );
}
