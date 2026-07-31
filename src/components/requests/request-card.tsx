"use client";

import { useState, useTransition } from "react";
import { CheckIcon, MapPinIcon, XIcon } from "lucide-react";
import { decideRequest } from "@/actions/requests";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LISTING_TYPE_LABELS, type ListingType } from "@/lib/constants";

export function RequestCard({
  requestId,
  dogName,
  listingType,
  requesterName,
  requesterCity,
  requesterBio,
  createdAt,
}: {
  requestId: string;
  dogName: string;
  listingType: ListingType;
  requesterName: string;
  requesterCity: string | null;
  requesterBio: string | null;
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

  return (
    <Card>
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-semibold">{requesterName}</p>
            {requesterCity && (
              <p className="flex items-center gap-1 text-sm text-muted-foreground">
                <MapPinIcon className="size-3.5" />
                {requesterCity}
              </p>
            )}
          </div>
          <Badge variant="secondary">
            {LISTING_TYPE_LABELS[listingType]} · {dogName}
          </Badge>
        </div>

        {requesterBio && (
          <p className="text-sm text-muted-foreground">{requesterBio}</p>
        )}

        <p className="text-xs text-muted-foreground">
          Requested on {new Date(createdAt).toLocaleDateString()}
        </p>

        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}

        <div className="flex gap-2">
          <Button
            className="flex-1"
            disabled={pending}
            onClick={() => decide("approved")}
          >
            <CheckIcon data-icon="inline-start" />
            Approve & chat
          </Button>
          <Button
            variant="outline"
            className="flex-1"
            disabled={pending}
            onClick={() => decide("declined")}
          >
            <XIcon data-icon="inline-start" />
            Decline
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
