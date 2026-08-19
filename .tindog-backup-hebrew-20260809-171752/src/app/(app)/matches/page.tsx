import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2Icon, ChevronRightIcon, HeartIcon, HeartHandshakeIcon, MessageCircleIcon, PawPrintIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LISTING_TYPE_LABELS } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";
import type { Dog, MatchRequest, Profile } from "@/lib/types";

export const metadata: Metadata = { title: "Matches" };
type MatchRow = MatchRequest & { dogs: Dog & { profiles: Profile }; requester: Profile };
const MATCH_SELECT = "*, dogs(*, profiles(*)), requester:profiles!match_requests_requester_id_fkey(*)";

export default async function MatchesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: viewer } = await supabase.from("profiles").select("role").eq("id", user!.id).single();

  const { data: outgoing } = await supabase.from("match_requests").select(MATCH_SELECT).eq("requester_id", user!.id).eq("status", "approved").returns<MatchRow[]>();
  const { data: myDogs } = await supabase.from("dogs").select("id").eq("owner_id", user!.id);
  let incoming: MatchRow[] = [];
  const dogIds = (myDogs ?? []).map((d) => d.id);
  if (dogIds.length) {
    const { data } = await supabase.from("match_requests").select(MATCH_SELECT).in("dog_id", dogIds).eq("status", "approved").returns<MatchRow[]>();
    incoming = data ?? [];
  }
  const matches = [...(outgoing ?? []), ...incoming].sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
  const adopter = viewer?.role === "adopter";

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-5">
      <div className="flex items-start gap-3">
        <div className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary"><HeartIcon className="size-5" /></div>
        <div><h1 className="text-3xl font-black tracking-tight">{adopter ? "Your matches" : "Approved connections"}</h1><p className="mt-1 text-sm text-muted-foreground">{adopter ? "A shelter said yes. Now the meaningful part starts." : "Approved adopters can now chat with your shelter about next steps."}</p></div>
      </div>

      {adopter && (
        <Card className="overflow-hidden border-primary/15 bg-gradient-to-r from-rose-50 via-white to-amber-50">
          <CardContent className="pt-5">
            <div className="grid gap-3 text-center sm:grid-cols-4">
              {[{ icon: PawPrintIcon, label: "Discover" }, { icon: HeartHandshakeIcon, label: "Shelter review" }, { icon: MessageCircleIcon, label: "Chat" }, { icon: CheckCircle2Icon, label: "Meet & greet" }].map(({ icon: Icon, label }, i) => (
                <div key={label} className="relative flex flex-col items-center gap-2 rounded-2xl bg-white/70 p-3"><div className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-primary"><Icon className="size-4" /></div><p className="text-xs font-semibold">{i + 1}. {label}</p>{i < 3 && <span className="absolute -right-2 top-1/2 hidden text-primary/30 sm:block">→</span>}</div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {matches.length === 0 ? (
        <Card className="border-dashed bg-white/75"><CardContent className="flex flex-col items-center gap-3 py-16 text-center"><div className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary"><MessageCircleIcon className="size-6" /></div><p className="text-lg font-semibold">No conversations yet</p><p className="max-w-md text-sm text-muted-foreground">{adopter ? "When a shelter approves your request, TinDog will celebrate the match and open a private conversation here." : "Approve a thoughtful adoption request to open a private conversation."}</p>{adopter && <Link href="/swipe"><Button variant="outline">Keep discovering</Button></Link>}</CardContent></Card>
      ) : (
        <div className="grid gap-3">
          {matches.map((match) => {
            const iAmRequester = match.requester_id === user!.id;
            const otherName = iAmRequester ? (match.dogs.profiles.shelter_name || match.dogs.profiles.display_name) : match.requester.display_name;
            return (
              <Link key={match.id} href={`/matches/${match.id}`}>
                <Card className="group border-white/80 bg-white/92 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-rose-100/50">
                  <CardContent className="flex items-center justify-between gap-4 pt-5">
                    <div className="flex min-w-0 items-center gap-3"><div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-fuchsia-600 text-white shadow"><HeartIcon className="size-5 fill-current" /></div><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="truncate font-bold">{otherName}</p><Badge variant="secondary">Matched</Badge></div><p className="text-sm text-muted-foreground">About <strong className="text-foreground">{match.dogs.name}</strong></p><p className="mt-1 text-xs text-muted-foreground">Connected {new Date(match.updated_at).toLocaleDateString()}</p></div></div>
                    <div className="flex items-center gap-2"><Badge variant="secondary" className="hidden sm:inline-flex">{LISTING_TYPE_LABELS[match.dogs.listing_type]}</Badge><ChevronRightIcon className="size-4 text-muted-foreground transition-transform group-hover:translate-x-1" /></div>
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
