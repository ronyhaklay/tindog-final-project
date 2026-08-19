"use client";

import { useState, useTransition } from "react";
import { BookmarkIcon } from "lucide-react";
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

  function toggle() {
    const next = !favorited;
    setFavorited(next);
    startTransition(async () => {
      const result = await setFavorite({ dogId, favorited: next });
      if (!result.ok) setFavorited(!next);
    });
  }

  return (
    <Button
      type="button"
      variant={favorited ? "default" : "secondary"}
      size={compact ? "icon" : "default"}
      disabled={pending}
      aria-label={favorited ? "Remove from saved dogs" : "Save dog"}
      className={cn(
        compact && "rounded-full shadow-md",
        !favorited && "bg-white/90 text-foreground hover:bg-white"
      )}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => {
        e.stopPropagation();
        toggle();
      }}
    >
      <BookmarkIcon className={cn("size-4", favorited && "fill-current")} />
      {!compact && (favorited ? "Saved" : "Save")}
    </Button>
  );
}
