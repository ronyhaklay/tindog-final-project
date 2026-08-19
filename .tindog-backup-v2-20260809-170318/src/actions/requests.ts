"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/lib/types";
import { firstError, requestDecisionSchema } from "@/lib/validation";

// Approve or decline a pending request on one of my dogs.
// RLS only lets the dog's owner update the row, so a forged
// requestId from another user simply matches zero rows.
export async function decideRequest(input: {
  requestId: string;
  decision: "approved" | "declined";
}): Promise<ActionResult> {
  const parsed = requestDecisionSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: firstError(parsed.error) };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("match_requests")
    .update({ status: parsed.data.decision })
    .eq("id", parsed.data.requestId)
    .eq("status", "pending")
    .select("id");

  if (error || !data || data.length === 0) {
    return { ok: false, error: "Could not update this request." };
  }

  revalidatePath("/requests");
  revalidatePath("/matches");
  return { ok: true };
}
