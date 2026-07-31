import type { Metadata } from "next";
import { getDeck } from "@/actions/swipes";
import { SwipeDeck } from "@/components/swipe/swipe-deck";

export const metadata: Metadata = { title: "Swipe" };

export default async function SwipePage() {
  const result = await getDeck({});
  const initialDeck = result.ok ? (result.data ?? []) : [];

  return <SwipeDeck initialDeck={initialDeck} />;
}
