import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SparklesIcon } from "lucide-react";
import { getDeck } from "@/actions/swipes";
import { SwipeDeck } from "@/components/swipe/swipe-deck";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Discover" };

export default async function SwipePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user!.id).single();
  if (profile?.role === "shelter_admin") redirect("/shelter");

  const result = await getDeck({});
  const initialDeck = result.ok ? (result.data ?? []) : [];
  return (
    <div className="flex flex-col gap-6">
      <div className="mx-auto flex w-full max-w-xl items-start gap-3">
        <div className="mt-1 flex size-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary"><SparklesIcon className="size-5" /></div>
        <div><h1 className="text-2xl font-black tracking-tight sm:text-3xl">Meet your next best friend</h1><p className="mt-1 text-sm text-muted-foreground">Swipe right when your heart says yes. TinDog adds a lifestyle-fit score so the match makes sense beyond the photo.</p></div>
      </div>
      <SwipeDeck initialDeck={initialDeck} />
    </div>
  );
}
