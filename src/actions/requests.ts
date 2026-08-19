"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/lib/types";
import { firstError, matchSeenSchema, requestDecisionSchema } from "@/lib/validation";

export async function decideRequest(input: {
  requestId: string;
  decision: "approved" | "declined";
}): Promise<ActionResult> {
  const parsed = requestDecisionSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: firstError(parsed.error) };
  }

  const supabase = await createClient();

  const { data, error } = await supabase.rpc("decide_match_request", {
    p_request_id: parsed.data.requestId,
    p_decision: parsed.data.decision,
  });

  if (error || !data) {
    console.error("decide_match_request failed:", error);
    return {
      ok: false,
      error:
        parsed.data.decision === "approved"
          ? "לא הצלחנו לפתוח את הצ׳אט. נסו שוב."
          : "לא הצלחנו לעדכן את הבקשה.",
    };
  }

  revalidatePath("/requests");
  revalidatePath("/matches");
  revalidatePath(`/matches/${parsed.data.requestId}`);
  revalidatePath("/");

  return { ok: true };
}

export async function markMatchSeen(
  requestId: string,
): Promise<ActionResult> {
  const parsed = matchSeenSchema.safeParse({ requestId });
  if (!parsed.success) {
    return { ok: false, error: firstError(parsed.error) };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("mark_match_seen", {
    p_request_id: parsed.data.requestId,
  });

  if (error) {
    return {
      ok: false,
      error: "Could not dismiss the match celebration.",
    };
  }

  revalidatePath("/matches");
  return { ok: true };
}
