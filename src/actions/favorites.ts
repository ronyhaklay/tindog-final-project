"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/lib/types";

export async function setFavorite(input: {
  dogId: string;
  favorited: boolean;
}): Promise<ActionResult> {
  if (!input?.dogId) return { ok: false, error: "Missing dog." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { ok: false, error: "Not authenticated." };

  const { error } = await supabase.rpc("set_my_favorite", {
    p_dog_id: input.dogId,
    p_favorited: Boolean(input.favorited),
  });

  if (error) {
    console.error("set_my_favorite failed:", error);
    return { ok: false, error: error.message };
  }

  revalidatePath("/favorites");
  revalidatePath("/swipe");
  revalidatePath(`/dogs/${input.dogId}`);

  return { ok: true };
}
