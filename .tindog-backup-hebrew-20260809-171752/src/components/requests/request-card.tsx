"use client";

import { useState, useTransition } from "react";
import {
  CheckIcon,
  DogIcon,
  HomeIcon,
  MapPinIcon,
  SparklesIcon,
  UsersIcon,
  XIcon,
} from "lucide-react";
import { decideRequest } from "@/actions/requests";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DOG_EXPERIENCE_LABELS,
  DOG_SIZE_LABELS,
  ENERGY_LEVEL_LABELS,
  HOUSEHOLD_TYPE_LABELS,
  LISTING_TYPE_LABELS,
  type ListingType,
} from "@/lib/constants";
import type { Profile } from "@/lib/types";

export function RequestCard({
  requestId,
  dogName,
  listingType,
  requester,
  createdAt,
}: {
  requestId: string;
  dogName: string;
  listingType: ListingType;
  requester: Profile;
  createdAt: string;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function decide(decision: "approved" | "declined") {
    startTransition(async () => {
      const result = await decideRequest({ requestId, decision });
      if (!result.ok) setError(result.error);
    });
  }

  const details = [
    requester.household_type && { icon: HomeIcon, text: HOUSEHOLD_TYPE_LABELS[requester.household_type] },
    requester.dog_experience && { icon: DogIcon, text: DOG_EXPERIENCE_LABELS[requester.dog_experience] },
    requester.activity_level && { icon: SparklesIcon, text: `${ENERGY_LEVEL_LABELS[requester.activity_level]} lifestyle` },
    requester.preferred_size && { icon: DogIcon, text: `Prefers ${DOG_SIZE_LABELS[requester.preferred_size].split(" (")[0].toLowerCase()} dogs` },
    requester.has_children && { icon: UsersIcon, text: "Children at home" },
    requester.has_other_pets && { icon: DogIcon, text: "Other pets at home" },
  ].filter(Boolean) as { icon: typeof HomeIcon; text: string }[];

  return (
    <Card className="overflow-hidden border-white/80 bg-white/90 shadow-sm">
      <CardContent className="flex flex-col gap-4 pt-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-lg font-bold">{requester.display_name}</p>
            {requester.city && <p className="mt-0.5 flex items-center gap-1 text-sm text-muted-foreground"><MapPinIcon className="size-3.5" />{requester.city}</p>}
          </div>
          <Badge variant="secondary">{LISTING_TYPE_LABELS[listingType]} · {dogName}</Badge>
        </div>

        {requester.bio && <div className="rounded-2xl bg-muted/60 p-4 text-sm leading-relaxed">“{requester.bio}”</div>}

        {details.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {details.map(({ icon: Icon, text }) => <Badge key={text} variant="outline"><Icon className="size-3" />{text}</Badge>)}
          </div>
        )}

        <p className="text-xs text-muted-foreground">Interested since {new Date(createdAt).toLocaleDateString()}</p>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}

        <div className="grid gap-2 sm:grid-cols-2">
          <Button disabled={pending} onClick={() => decide("approved")}><CheckIcon data-icon="inline-start" />Approve & open chat</Button>
          <Button variant="outline" disabled={pending} onClick={() => decide("declined")}><XIcon data-icon="inline-start" />Decline</Button>
        </div>
      </CardContent>
    </Card>
  );
}
