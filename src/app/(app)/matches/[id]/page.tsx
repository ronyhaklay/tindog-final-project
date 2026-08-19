import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ChatRoom } from "@/components/chat/chat-room";
import { MESSAGES_PAGE_SIZE } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";
import type {
  Dog,
  MatchRequest,
  Message,
  Profile,
} from "@/lib/types";

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

  if (!user) notFound();

  const { data: matchData, error: matchError } = await supabase.rpc(
    "get_approved_match_chat",
    {
      p_request_id: id,
    },
  );

  if (matchError || !matchData) {
    if (matchError) {
      console.error("get_approved_match_chat failed:", matchError);
    }
    notFound();
  }

  const match = matchData as MatchRow;

  const { data: messagesData, error: messagesError } =
    await supabase.rpc("get_approved_match_messages", {
      p_request_id: id,
      p_limit: MESSAGES_PAGE_SIZE,
    });

  if (messagesError) {
    console.error(
      "get_approved_match_messages failed:",
      messagesError,
    );
  }

  const messages: Message[] = Array.isArray(messagesData)
    ? (messagesData as Message[])
    : [];

  const iAmRequester = match.requester_id === user.id;

  const otherName = iAmRequester
    ? match.dogs.profiles.shelter_name ||
      match.dogs.profiles.display_name
    : match.requester.display_name;

  return (
    <ChatRoom
      requestId={match.id}
      currentUserId={user.id}
      otherName={otherName}
      dogName={match.dogs.name}
      initialMessages={messages}
    />
  );
}
