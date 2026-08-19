"use server";

import { createClient } from "@/lib/supabase/server";
import type { ActionResult, Message } from "@/lib/types";
import { firstError, messageSchema } from "@/lib/validation";

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

  if (!user) {
    return { ok: false, error: "Not authenticated." };
  }

  const { data, error } = await supabase.rpc(
    "send_approved_match_message",
    {
      p_request_id: parsed.data.requestId,
      p_content: parsed.data.content,
    },
  );

  if (error || !data) {
    console.error("send_approved_match_message failed:", error);
    return { ok: false, error: "לא הצלחנו לשלוח את ההודעה." };
  }

  return { ok: true, data: data as Message };
}
