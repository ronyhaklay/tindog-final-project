"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";
import { HeartIcon, RotateCcwIcon, SparklesIcon, XIcon } from "lucide-react";
import { getDeck, swipe } from "@/actions/swipes";
import { Button } from "@/components/ui/button";
import { mergeDeck, removeFromDeck, shouldRefill } from "@/lib/deck";
import type { DeckDog } from "@/lib/types";
import type { DeckFilters } from "@/lib/validation";
import { DeckFiltersBar } from "./deck-filters";
import { DogCard } from "./dog-card";
import { MatchOverlay } from "./match-overlay";

const SWIPE_THRESHOLD_PX = 90;

// The interactive deck: drag or use the buttons to like/pass.
// State lives client-side; every decision is persisted through the
// swipe() server action, and refills come from getDeck().
export function SwipeDeck({ initialDeck }: { initialDeck: DeckDog[] }) {
  const [deck, setDeck] = useState<DeckDog[]>(initialDeck);
  const [filters, setFilters] = useState<DeckFilters>({});
  const [flyout, setFlyout] = useState<"like" | "pass" | null>(null);
  const [drag, setDrag] = useState<{ dx: number; dy: number } | null>(null);
  const [loading, startLoading] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [matchData, setMatchData] = useState<{name: string, imageUrl: string} | null>(null);

  const swipedIds = useRef(new Set<string>());
  const dragStart = useRef<{ x: number; y: number } | null>(null);
  const animating = useRef(false);

  // Mirror of the deck for reads inside timeouts (avoids stale closures).
  const deckRef = useRef(deck);
  deckRef.current = deck;

  const topDog = deck[0];

  const refill = useCallback(
    (f: DeckFilters) => {
      startLoading(async () => {
        const result = await getDeck(f);
        if (result.ok) {
          setDeck((prev) =>
            mergeDeck(prev, result.data ?? [], swipedIds.current)
          );
          setError(null);
        } else {
          setError(result.error);
        }
      });
    },
    [startLoading]
  );

  function applyFilters(next: DeckFilters) {
    setFilters(next);
    setDeck([]);
    startLoading(async () => {
      const result = await getDeck(next);
      if (result.ok) {
        setDeck(
          (result.data ?? []).filter((d) => !swipedIds.current.has(d.id))
        );
        setError(null);
      } else {
        setError(result.error);
      }
    });
  }

  function decide(direction: "like" | "pass") {
    if (!topDog || animating.current) return;
    animating.current = true;
    setFlyout(direction);

    const dogId = topDog.id;
    swipedIds.current.add(dogId);

    // Persist in the background; the UI moves on immediately.
    swipe({ dogId, direction }).then((result) => {
      if (!result.ok) {
        setError(result.error);
      }
      else if (direction === "like") {
        setMatchData({
          name: (topDog as any).name || "כלב חמוד",
          imageUrl: (topDog as any).image || "https://images.unsplash.com/photo-1543466835-00a7907e9de1"
        });
      }
    });

    setTimeout(() => {
      setFlyout(null);
      setDrag(null);
      animating.current = false;
      const next = removeFromDeck(deckRef.current, dogId);
      setDeck(next);
      // Refill OUTSIDE the state updater: scheduling a transition inside
      // an updater is a side effect React does not allow.
      if (shouldRefill(next)) refill(filters);
    }, 260);
  }

  // --- pointer drag handling ---
  function onPointerDown(e: React.PointerEvent) {
    if (animating.current) return;
    dragStart.current = { x: e.clientX, y: e.clientY };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!dragStart.current || animating.current) return;
    setDrag({
      dx: e.clientX - dragStart.current.x,
      dy: e.clientY - dragStart.current.y,
    });
  }

  function onPointerUp() {
    if (!dragStart.current) return;
    const dx = drag?.dx ?? 0;
    dragStart.current = null;

    if (dx > SWIPE_THRESHOLD_PX) {
      decide("like");
    } else if (dx < -SWIPE_THRESHOLD_PX) {
      decide("pass");
    } else {
      setDrag(null);
    }
  }

  // Keyboard support: left = pass, right = like.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight") decide("like");
      if (e.key === "ArrowLeft") decide("pass");
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const dx = flyout === "like" ? 600 : flyout === "pass" ? -600 : drag?.dx ?? 0;
  const dy = flyout ? -40 : drag?.dy ?? 0;
  const rotation = dx / 18;
  const likeOpacity = Math.min(Math.max(dx / SWIPE_THRESHOLD_PX, 0), 1);
  const passOpacity = Math.min(Math.max(-dx / SWIPE_THRESHOLD_PX, 0), 1);

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-4">
      <DeckFiltersBar filters={filters} onChange={applyFilters} />

      {error && (
        <p role="alert" className="text-center text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="relative h-[650px] select-none sm:h-[700px]">
        {deck.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 rounded-[28px] border border-dashed bg-white/75 px-6 text-center shadow-sm">
            {loading ? (
              <p className="text-muted-foreground">Fetching dogs...</p>
            ) : (
              <>
                <div className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary"><SparklesIcon className="size-6" /></div>
                <p className="text-xl font-semibold">You&apos;re all caught up 🐾</p>
                <p className="max-w-xs text-sm text-muted-foreground">
                  You&apos;ve seen every dog matching these filters. Widen your search or check back soon for new faces.
                </p>
                <Button variant="outline" onClick={() => refill(filters)}>
                  <RotateCcwIcon data-icon="inline-start" />
                  Check again
                </Button>
              </>
            )}
          </div>
        ) : (
          deck
            .slice(0, 3)
            .map((dog, i) => {
              const isTop = i === 0;
              return (
                <div
                  key={dog.id}
                  className="absolute inset-0"
                  style={{
                    zIndex: 10 - i,
                    transform: isTop
                      ? `translate(${dx}px, ${dy}px) rotate(${rotation}deg)`
                      : `scale(${1 - i * 0.04}) translateY(${i * 10}px)`,
                    transition:
                      isTop && (flyout || !drag)
                        ? "transform 0.25s ease"
                        : undefined,
                    touchAction: "none",
                  }}
                  onPointerDown={isTop ? onPointerDown : undefined}
                  onPointerMove={isTop ? onPointerMove : undefined}
                  onPointerUp={isTop ? onPointerUp : undefined}
                >
                  {isTop && (
                    <>
                      <span
                        className="absolute top-6 left-4 z-20 -rotate-12 rounded-lg border-4 border-green-500 px-3 py-1 text-2xl font-extrabold text-green-500"
                        style={{ opacity: likeOpacity }}
                      >
                        LIKE
                      </span>
                      <span
                        className="absolute top-6 right-4 z-20 rotate-12 rounded-lg border-4 border-red-500 px-3 py-1 text-2xl font-extrabold text-red-500"
                        style={{ opacity: passOpacity }}
                      >
                        PASS
                      </span>
                    </>
                  )}
                  <DogCard dog={dog} />
                </div>
              );
            })
            .reverse()
        )}
        {matchData && (
  <MatchOverlay 
    dogName={matchData.name}
    dogImageUrl={matchData.imageUrl}
    onClose={() => setMatchData(null)} 
  />
)}
      </div>

      {topDog && (
        <div className="flex items-center justify-center gap-7 rounded-2xl bg-white/70 py-2 backdrop-blur">
          <Button
            variant="outline"
            size="icon-lg"
            aria-label="Pass"
            className="size-16 rounded-full border-red-200 bg-white text-red-500 shadow-lg shadow-red-100 hover:bg-red-50"
            onClick={() => decide("pass")}
          >
            <XIcon className="size-6" />
          </Button>
          <Button
            size="icon-lg"
            aria-label="Like"
            className="size-16 rounded-full shadow-lg shadow-rose-200"
            onClick={() => decide("like")}
          >
            <HeartIcon className="size-6" />
          </Button>
        </div>
      )}
    </div>
  );
}
