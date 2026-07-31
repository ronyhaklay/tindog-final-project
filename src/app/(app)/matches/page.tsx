import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRightIcon, MessageCircleIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { LISTING_TYPE_LABELS } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";
import type { Dog, MatchRequest, Profile } from "@/lib/types";

export const metadata: Metadata = { title: "Matches" };

type MatchRow = MatchRequest & {
  dogs: Dog & { profiles: Profile };
  requester: Profile;
};

const MATCH_SELECT =
  "*, dogs(*, profiles(*)), requester:profiles!match_requests_requester_id_fkey(*)";

export default async function MatchesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Matches where I liked someone else's dog...
  const { data: outgoing } = await supabase
    .from("match_requests")
    .select(MATCH_SELECT)
    .eq("requester_id", user!.id)
    .eq("status", "approved")
    .returns<MatchRow[]>();

  // ...and matches where someone liked one of my dogs.
  const { data: myDogs } = await supabase
    .from("dogs")
    .select("id")
    .eq("owner_id", user!.id);

  let incoming: MatchRow[] = [];
  const dogIds = (myDogs ?? []).map((d) => d.id);
  if (dogIds.length > 0) {
    const { data } = await supabase
      .from("match_requests")
      .select(MATCH_SELECT)
      .in("dog_id", dogIds)
      .eq("status", "approved")
      .returns<MatchRow[]>();
    incoming = data ?? [];
  }

  const matches = [...(outgoing ?? []), ...incoming].sort(
    (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  );

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <h1 className="text-2xl font-bold">Matches</h1>

      {matches.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <MessageCircleIcon className="size-10 text-muted-foreground" />
            <p className="font-medium">No matches yet</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              Keep swiping! When a request is approved, the conversation will
              appear here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-2">
          {matches.map((match) => {
            const iAmRequester = match.requester_id === user!.id;
            const otherName = iAmRequester
              ? match.dogs.profiles.display_name
              : match.requester.display_name;
            return (
              <Link key={match.id} href={`/matches/${match.id}`}>
                <Card className="transition-colors hover:bg-muted/50">
                  <CardContent className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold">
                        {otherName}
                        <span className="ml-2 font-normal text-muted-foreground">
                          about {match.dogs.name}
                        </span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Matched {new Date(match.updated_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">
                        {LISTING_TYPE_LABELS[match.dogs.listing_type]}
                      </Badge>
                      <ChevronRightIcon className="size-4 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
