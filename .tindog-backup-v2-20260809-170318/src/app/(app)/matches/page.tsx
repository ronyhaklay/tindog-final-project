import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRightIcon, HeartIcon, MessageCircleIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LISTING_TYPE_LABELS } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";
import type { Dog, MatchRequest, Profile } from "@/lib/types";

export const metadata: Metadata = { title: "Chats" };

type MatchRow = MatchRequest & { dogs: Dog & { profiles: Profile }; requester: Profile };
const MATCH_SELECT = "*, dogs(*, profiles(*)), requester:profiles!match_requests_requester_id_fkey(*)";

export default async function MatchesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: outgoing } = await supabase.from("match_requests").select(MATCH_SELECT).eq("requester_id", user!.id).eq("status", "approved").returns<MatchRow[]>();
  const { data: myDogs } = await supabase.from("dogs").select("id").eq("owner_id", user!.id);
  let incoming: MatchRow[] = [];
  const dogIds = (myDogs ?? []).map((d) => d.id);
  if (dogIds.length > 0) {
    const { data } = await supabase.from("match_requests").select(MATCH_SELECT).in("dog_id", dogIds).eq("status", "approved").returns<MatchRow[]>();
    incoming = data ?? [];
  }

  const matches = [...(outgoing ?? []), ...incoming].sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5">
      <div className="flex items-start gap-3">
        <div className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary"><HeartIcon className="size-5" /></div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Connections & chats</h1>
          <p className="mt-1 text-sm text-muted-foreground">Approved requests live here. This is where the real adoption conversation begins.</p>
        </div>
      </div>

      {matches.length === 0 ? (
        <Card className="border-dashed bg-white/75">
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <div className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary"><MessageCircleIcon className="size-6" /></div>
            <p className="text-lg font-semibold">No conversations yet</p>
            <p className="max-w-md text-sm text-muted-foreground">When a dog owner approves a request, a private chat appears here so you can arrange the next step.</p>
            <Link href="/swipe"><Button variant="outline">Keep discovering</Button></Link>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {matches.map((match) => {
            const iAmRequester = match.requester_id === user!.id;
            const otherName = iAmRequester ? match.dogs.profiles.display_name : match.requester.display_name;
            return (
              <Link key={match.id} href={`/matches/${match.id}`}>
                <Card className="border-white/80 bg-white/90 transition-all hover:-translate-y-0.5 hover:shadow-md">
                  <CardContent className="flex items-center justify-between gap-4 pt-5">
                    <div className="flex items-center gap-3">
                      <div className="flex size-11 items-center justify-center rounded-full bg-primary/10 text-primary"><HeartIcon className="size-5" /></div>
                      <div>
                        <p className="font-semibold">{otherName}</p>
                        <p className="text-sm text-muted-foreground">Conversation about <strong className="text-foreground">{match.dogs.name}</strong></p>
                        <p className="mt-1 text-xs text-muted-foreground">Connected {new Date(match.updated_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2"><Badge variant="secondary">{LISTING_TYPE_LABELS[match.dogs.listing_type]}</Badge><ChevronRightIcon className="size-4 text-muted-foreground" /></div>
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
