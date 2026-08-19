"use client";

import { HeartIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

type MatchOverlayProps = {
  dogName: string;
  dogImageUrl: string;
  onClose: () => void;
};

export function MatchOverlay({
  dogName,
  dogImageUrl,
  onClose,
}: MatchOverlayProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
      <div className="relative w-full max-w-sm rounded-[32px] bg-white p-6 text-center shadow-2xl">
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full"
          aria-label="Close"
        >
          <XIcon className="size-5" />
        </Button>

        <div className="mx-auto mb-5 flex size-16 items-center justify-center rounded-full bg-rose-100 text-rose-500">
          <HeartIcon className="size-8 fill-current" />
        </div>

        <h2 className="text-3xl font-bold">It&apos;s a match! 🐾</h2>

        <p className="mt-2 text-muted-foreground">
          You&apos;re interested in {dogName}.
        </p>

        {dogImageUrl && (
          <img
            src={dogImageUrl}
            alt={dogName}
            className="mx-auto mt-6 size-40 rounded-full object-cover shadow-lg"
          />
        )}

        <Button className="mt-6 w-full rounded-full" onClick={onClose}>
          Keep discovering
        </Button>
      </div>
    </div>
  );
}