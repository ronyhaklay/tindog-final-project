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
import { useLanguage } from "@/components/language-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  type ListingType,
} from "@/lib/constants";
import type { Profile } from "@/lib/types";
import { dogExperienceLabel, dogSizeLabel, energyLevelLabel, householdTypeLabel, listingTypeLabel, localeTag } from "@/lib/i18n";

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
  const { locale, isHebrew } = useLanguage();

  function decide(decision: "approved" | "declined") {
    startTransition(async () => {
      const result = await decideRequest({ requestId, decision });
      if (!result.ok) setError(result.error);
    });
  }

  const details = [
    requester.household_type && { icon: HomeIcon, text: householdTypeLabel(locale, requester.household_type) },
    requester.dog_experience && { icon: DogIcon, text: dogExperienceLabel(locale, requester.dog_experience) },
    requester.activity_level && { icon: SparklesIcon, text: isHebrew ? `אורח חיים ${energyLevelLabel(locale, requester.activity_level)}` : `${energyLevelLabel(locale, requester.activity_level)} lifestyle` },
    requester.preferred_size && { icon: DogIcon, text: isHebrew ? `מעדיף/ה כלבים בגודל ${dogSizeLabel(locale, requester.preferred_size).split(" (")[0]}` : `Prefers ${dogSizeLabel(locale, requester.preferred_size).split(" (")[0].toLowerCase()} dogs` },
    requester.has_children && { icon: UsersIcon, text: isHebrew ? "ילדים בבית" : "Children at home" },
    requester.has_other_pets && { icon: DogIcon, text: isHebrew ? "חיות נוספות בבית" : "Other pets at home" },
  ].filter(Boolean) as { icon: typeof HomeIcon; text: string }[];

  return (
    <Card className="overflow-hidden border-white/80 bg-white/90 shadow-sm">
      <CardContent className="flex flex-col gap-4 pt-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-lg font-bold">{requester.display_name}</p>
            {requester.city && <p className="mt-0.5 flex items-center gap-1 text-sm text-muted-foreground"><MapPinIcon className="size-3.5" />{requester.city}</p>}
          </div>
          <Badge variant="secondary">{listingTypeLabel(locale, listingType)} · {dogName}</Badge>
        </div>

        {requester.bio && <div className="rounded-2xl bg-muted/60 p-4 text-sm leading-relaxed">“{requester.bio}”</div>}

        {details.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {details.map(({ icon: Icon, text }) => <Badge key={text} variant="outline"><Icon className="size-3" />{text}</Badge>)}
          </div>
        )}

        <p className="text-xs text-muted-foreground">{isHebrew ? "מתעניין/ת מאז" : "Interested since"} {new Date(createdAt).toLocaleDateString(localeTag(locale))}</p>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}

        <div className="grid gap-2 sm:grid-cols-2">
          <Button disabled={pending} onClick={() => decide("approved")}><CheckIcon data-icon="inline-start" />{isHebrew ? "אישור ופתיחת צ׳אט" : "Approve & open chat"}</Button>
          <Button variant="outline" disabled={pending} onClick={() => decide("declined")}><XIcon data-icon="inline-start" />{isHebrew ? "דחייה" : "Decline"}</Button>
        </div>
      </CardContent>
    </Card>
  );
}
