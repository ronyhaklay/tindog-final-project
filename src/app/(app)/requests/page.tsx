import type { Metadata } from "next";
import { InboxIcon } from "lucide-react";
import { RequestCard } from "@/components/requests/request-card";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import type { Dog, MatchRequest, Profile } from "@/lib/types";

export const metadata: Metadata = { title: "Requests" };

type IncomingRequest = MatchRequest & {
  dogs: Dog;
  requester: Profile;
};

export default async function RequestsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: myDogs } = await supabase
    .from("dogs")
    .select("id")
    .eq("owner_id", user!.id);

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
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <h1 className="text-2xl font-bold">Incoming requests</h1>
      <p className="-mt-2 text-sm text-muted-foreground">
        People who liked your dogs. Approve a request to open a chat.
      </p>

      {requests.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <InboxIcon className="size-10 text-muted-foreground" />
            <p className="font-medium">No pending requests</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              When someone swipes right on one of your dogs, their request
              will show up here.
            </p>
          </CardContent>
        </Card>
      ) : (
        requests.map((request) => (
          <RequestCard
            key={request.id}
            requestId={request.id}
            dogName={request.dogs.name}
            listingType={request.dogs.listing_type}
            requesterName={request.requester.display_name}
            requesterCity={request.requester.city}
            requesterBio={request.requester.bio}
            createdAt={request.created_at}
          />
        ))
      )}
    </div>
  );
}
