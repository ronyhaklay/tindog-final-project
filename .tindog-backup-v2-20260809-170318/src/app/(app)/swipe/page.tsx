import type { Metadata } from "next";
import { SparklesIcon } from "lucide-react";
import { getDeck } from "@/actions/swipes";
import { SwipeDeck } from "@/components/swipe/swipe-deck";

export const metadata: Metadata = { title: "Discover" };

export default async function SwipePage() {
  const result = await getDeck({});
  const initialDeck = result.ok ? (result.data ?? []) : [];

  return (
    <div className="flex flex-col gap-6">
      <div className="mx-auto flex w-full max-w-xl items-start gap-3">
        <div className="mt-1 flex size-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary"><SparklesIcon className="size-5" /></div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Meet your next best friend</h1>
          <p className="mt-1 text-sm text-muted-foreground">Swipe right when you&apos;re interested. Save a dog when you want to think about it first.</p>
        </div>
      </div>
      <SwipeDeck initialDeck={initialDeck} />
    </div>
  );
}
