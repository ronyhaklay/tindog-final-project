"use server";

import { createClient } from "@/lib/supabase/server";
import type { ActionResult, Message } from "@/lib/types";
import { firstError, messageSchema } from "@/lib/validation";

// Inserts a chat message. RLS only allows participants of an
// APPROVED match request to write, and only as themselves.
export async function sendMessage(input: {
  requestId: string;
  content: string;
}): Promise<ActionResult<Message>> {
  const parsed = messageSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: firstError(parsed.error) };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not authenticated." };

  const { data, error } = await supabase
    .from("messages")
    .insert({
      request_id: parsed.data.requestId,
      sender_id: user.id,
      content: parsed.data.content,
    })
    .select("*")
    .single<Message>();

  if (error || !data) {
    return { ok: false, error: "Could not send the message." };
  }

  return { ok: true, data };
}
