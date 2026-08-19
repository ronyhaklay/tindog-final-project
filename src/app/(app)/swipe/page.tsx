import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SparklesIcon } from "lucide-react";
import { getDeck } from "@/actions/swipes";
import { SwipeDeck } from "@/components/swipe/swipe-deck";
import { getLocale } from "@/lib/i18n-server";

export const metadata: Metadata = { title: "Discover" };

export default async function SwipePage() {
  const he = (await getLocale()) === "he";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role === "shelter_admin") {
    redirect("/shelter");
  }

  const { data: profileComplete, error: profileCompleteError } =
    await supabase.rpc("profile_is_complete", {
      p_user_id: user.id,
    });

  if (profileCompleteError || !profileComplete) {
    redirect("/profile?required=1");
  }

  const result = await getDeck({});
  const initialDeck = result.ok ? (result.data ?? []) : [];
  return (
    <div className="flex flex-col gap-6">
      <div className="mx-auto flex w-full max-w-xl items-start gap-3">
        <div className="mt-1 flex size-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary"><SparklesIcon className="size-5" /></div>
        <div><h1 className="text-2xl font-black tracking-tight sm:text-3xl">{he ? "הכירו את החבר הבא הכי טוב שלכם" : "Meet your next best friend"}</h1><p className="mt-1 text-sm text-muted-foreground">{he ? "מחליקים ימינה כשהלב אומר כן. TinDog מוסיפה ציון התאמה לאורח החיים, כדי שהחיבור יתאים גם מעבר לתמונה." : "Swipe right when your heart says yes. TinDog adds a lifestyle-fit score so the match makes sense beyond the photo."}</p></div>
      </div>
      <SwipeDeck initialDeck={initialDeck} />
    </div>
  );
}
