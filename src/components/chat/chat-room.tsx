"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { ArrowLeftIcon, SendIcon } from "lucide-react";
import { sendMessage } from "@/actions/messages";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import type { Message } from "@/lib/types";
import { cn } from "@/lib/utils";

// Realtime chat: initial messages come from the server component;
// new messages arrive over a Supabase Realtime subscription on
// postgres INSERTs for this request_id.
export function ChatRoom({
  requestId,
  currentUserId,
  otherName,
  dogName,
  initialMessages,
}: {
  requestId: string;
  currentUserId: string;
  otherName: string;
  dogName: string;
  initialMessages: Message[];
}) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, startSending] = useTransition();
  const bottomRef = useRef<HTMLDivElement>(null);

  function appendUnique(message: Message) {
    setMessages((prev) =>
      prev.some((m) => m.id === message.id) ? prev : [...prev, message]
    );
  }

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`chat-${requestId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `request_id=eq.${requestId}`,
        },
        (payload) => appendUnique(payload.new as Message)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [requestId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const content = draft.trim();
    if (!content || sending) return;

    startSending(async () => {
      const result = await sendMessage({ requestId, content });
      if (result.ok && result.data) {
        appendUnique(result.data);
        setDraft("");
        setError(null);
      } else if (!result.ok) {
        setError(result.error);
      }
    });
  }

  return (
    <div className="mx-auto flex h-[calc(100svh-8.5rem)] max-w-2xl flex-col">
      <div className="flex items-center gap-3 border-b pb-3">
        <Link href="/matches" aria-label="Back to matches">
          <Button variant="ghost" size="icon">
            <ArrowLeftIcon />
          </Button>
        </Link>
        <div>
          <p className="font-semibold">{otherName}</p>
          <p className="text-xs text-muted-foreground">about {dogName}</p>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2 overflow-y-auto py-4">
        {messages.length === 0 && (
          <p className="my-auto text-center text-sm text-muted-foreground">
            Say hi to {otherName} and plan your first meetup with {dogName}!
          </p>
        )}
        {messages.map((message) => {
          const mine = message.sender_id === currentUserId;
          return (
            <div
              key={message.id}
              className={cn(
                "max-w-[75%] rounded-2xl px-3.5 py-2 text-sm",
                mine
                  ? "self-end rounded-br-sm bg-primary text-primary-foreground"
                  : "self-start rounded-bl-sm bg-muted"
              )}
            >
              <p className="whitespace-pre-wrap break-words">{message.content}</p>
              <p
                className={cn(
                  "mt-0.5 text-[10px]",
                  mine ? "text-primary-foreground/70" : "text-muted-foreground"
                )}
              >
                {new Date(message.created_at).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {error && (
        <p role="alert" className="pb-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <form onSubmit={handleSend} className="flex gap-2 border-t pt-3">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={`Message ${otherName}...`}
          maxLength={2000}
          aria-label="Message"
        />
        <Button
          type="submit"
          size="icon"
          aria-label="Send"
          disabled={sending || draft.trim().length === 0}
        >
          <SendIcon />
        </Button>
      </form>
    </div>
  );
}
