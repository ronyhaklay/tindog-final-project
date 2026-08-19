import type { Metadata } from "next";
import { HeartHandshakeIcon, InboxIcon } from "lucide-react";
import { redirect } from "next/navigation";
import { RequestCard } from "@/components/requests/request-card";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import type { Dog, MatchRequest, Profile } from "@/lib/types";

export const metadata: Metadata = { title: "Adoption requests" };

type IncomingRequest = MatchRequest & { dogs: Dog; requester: Profile };

export default async function RequestsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user!.id).single();
  if (profile?.role !== "shelter_admin") redirect("/matches");
  const { data: myDogs } = await supabase.from("dogs").select("id").eq("owner_id", user!.id);
  const dogIds = (myDogs ?? []).map((d) => d.id);

  let requests: IncomingRequest[] = [];
  if (dogIds.length > 0) {
    const { data } = await supabase
      .from("match_requests")
      .select("*, dogs(*), requester:profiles!match_requests_requester_id_fkey(*)")
      .in("dog_id", dogIds)
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .returns<IncomingRequest[]>();
    requests = data ?? [];
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5">
      <div className="flex items-start gap-3">
        <div className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary"><HeartHandshakeIcon className="size-5" /></div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Adoption requests</h1>
          <p className="mt-1 text-sm text-muted-foreground">Review the person behind each right swipe before deciding whether to open a conversation.</p>
        </div>
      </div>

      {requests.length === 0 ? (
        <Card className="border-dashed bg-white/75">
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <div className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary"><InboxIcon className="size-6" /></div>
            <p className="text-lg font-semibold">No pending requests</p>
            <p className="max-w-md text-sm text-muted-foreground">When someone is interested in one of your dogs, their profile and request will appear here.</p>
          </CardContent>
        </Card>
      ) : requests.map((request) => (
        <RequestCard key={request.id} requestId={request.id} dogName={request.dogs.name} listingType={request.dogs.listing_type} requester={request.requester} createdAt={request.created_at} />
      ))}
    </div>
  );
}
