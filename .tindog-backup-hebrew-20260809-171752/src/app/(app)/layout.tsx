import { redirect } from "next/navigation";
import { AppNav } from "@/components/app-nav";
import { MatchCelebration } from "@/components/match-celebration";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single<Profile>();
  if (!profile) redirect("/login");

  let pendingCount = 0;
  if (profile.role === "shelter_admin") {
    const { data: myDogs } = await supabase.from("dogs").select("id").eq("owner_id", user.id);
    const dogIds = (myDogs ?? []).map((d) => d.id);
    if (dogIds.length) {
      const { count } = await supabase.from("match_requests").select("id", { count: "exact", head: true }).in("dog_id", dogIds).eq("status", "pending");
      pendingCount = count ?? 0;
    }
  }

  let newMatchCount = 0;
  let celebration: null | { id: string; dogName: string; photoPath: string | null; barkAudioPath: string | null; shelterName: string } = null;
  if (profile.role === "adopter") {
    const { data: unseen } = await supabase
      .from("match_requests")
      .select("id, dogs(name,bark_audio_path,dog_photos(storage_path,sort_order),profiles(display_name,shelter_name))")
      .eq("requester_id", user.id)
      .eq("status", "approved")
      .is("match_seen_at", null)
      .order("updated_at", { ascending: false });
    newMatchCount = unseen?.length ?? 0;
    const first = unseen?.[0] as any;
    if (first?.dogs) {
      const photos = [...(first.dogs.dog_photos ?? [])].sort((a: any, b: any) => a.sort_order - b.sort_order);
      celebration = {
        id: first.id,
        dogName: first.dogs.name,
        photoPath: photos[0]?.storage_path ?? null,
        barkAudioPath: first.dogs.bark_audio_path ?? null,
        shelterName: first.dogs.profiles?.shelter_name || first.dogs.profiles?.display_name || "the shelter",
      };
    }
  }

  return (
    <div className="relative flex min-h-svh flex-col overflow-x-hidden">
      <div aria-hidden className="tindog-paw-bg" />
      <AppNav role={profile.role} pendingCount={pendingCount} newMatchCount={newMatchCount} shelterName={profile.shelter_name} />
      <main className="relative z-10 mx-auto w-full max-w-6xl flex-1 px-4 py-7 sm:px-6">{children}</main>
      {celebration && <MatchCelebration requestId={celebration.id} dogName={celebration.dogName} photoPath={celebration.photoPath} barkAudioPath={celebration.barkAudioPath} shelterName={celebration.shelterName} />}
    </div>
  );
}
