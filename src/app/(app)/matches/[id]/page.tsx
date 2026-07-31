import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ChatRoom } from "@/components/chat/chat-room";
import { MESSAGES_PAGE_SIZE } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";
import type { Dog, MatchRequest, Message, Profile } from "@/lib/types";

export const metadata: Metadata = { title: "Chat" };

type MatchRow = MatchRequest & {
  dogs: Dog & { profiles: Profile };
  requester: Profile;
};

export default async function ChatPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // RLS already restricts this to the two participants; a non-participant
  // simply gets no row and lands on the 404 page.
  const { data: match } = await supabase
    .from("match_requests")
    .select(
      "*, dogs(*, profiles(*)), requester:profiles!match_requests_requester_id_fkey(*)"
    )
    .eq("id", id)
    .eq("status", "approved")
    .single<MatchRow>();

  if (!match) {
    notFound();
  }

  // Latest page of messages (ascending for display).
  const { data: messages } = await supabase
    .from("messages")
    .select("*")
    .eq("request_id", id)
    .order("created_at", { ascending: false })
    .limit(MESSAGES_PAGE_SIZE)
    .returns<Message[]>();

  const iAmRequester = match.requester_id === user!.id;
  const otherName = iAmRequester
    ? match.dogs.profiles.display_name
    : match.requester.display_name;

  return (
    <ChatRoom
      requestId={match.id}
      currentUserId={user!.id}
      otherName={otherName}
      dogName={match.dogs.name}
      initialMessages={(messages ?? []).slice().reverse()}
    />
  );
}
