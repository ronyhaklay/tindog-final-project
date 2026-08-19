import type { Metadata } from "next";
import { SavedDogsClient } from "@/components/favorites/saved-dogs-client";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Saved dogs" };

export default async function FavoritesPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return <SavedDogsClient dogs={[]} />;

  const { data, error } = await supabase.rpc("get_my_favorites");

  if (error) console.error("get_my_favorites failed:", error);

  return <SavedDogsClient dogs={(Array.isArray(data) ? data : []) as never[]} />;
}
