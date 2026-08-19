"use client";

import { useEffect, useState, useTransition } from "react";
import { BookmarkIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { setFavorite } from "@/actions/favorites";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function FavoriteButton({
  dogId,
  initialFavorited,
  compact = false,
}: {
  dogId: string;
  initialFavorited: boolean;
  compact?: boolean;
}) {
  const [favorited, setFavorited] = useState(initialFavorited);
  const [pending, startTransition] = useTransition();
  const [he, setHe] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const root = document.documentElement;
    setHe(root.dir === "rtl" || root.lang?.toLowerCase().startsWith("he"));
  }, []);

  function toggle() {
    if (pending) return;
    const next = !favorited;
    setFavorited(next);

    startTransition(async () => {
      const result = await setFavorite({ dogId, favorited: next });

      if (!result.ok) {
        setFavorited(!next);
        return;
      }

      router.refresh();
    });
  }

  return (
    <Button
      data-no-swipe
      type="button"
      variant={favorited ? "default" : "secondary"}
      size={compact ? "icon" : "default"}
      disabled={pending}
      aria-pressed={favorited}
      aria-label={
        favorited
          ? he
            ? "הסרה מהשמורים"
            : "Remove from saved dogs"
          : he
            ? "שמירת הכלב"
            : "Save dog"
      }
      className={cn(
        compact && "rounded-full shadow-md",
        !favorited && "bg-white/95 text-foreground hover:bg-white",
      )}
      onPointerDown={(event) => event.stopPropagation()}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        toggle();
      }}
    >
      <BookmarkIcon className={cn("size-4", favorited && "fill-current")} />
      {!compact && (
        <span>
          {favorited
            ? he
              ? "נשמר"
              : "Saved"
            : he
              ? "שמירה"
              : "Save"}
        </span>
      )}
    </Button>
  );
}
