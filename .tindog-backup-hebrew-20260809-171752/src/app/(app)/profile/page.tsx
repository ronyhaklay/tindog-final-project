import type { Metadata } from "next";
import { Building2Icon, UserIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { ProfileForm } from "@/components/profile/profile-form";
import type { Profile } from "@/lib/types";

export const metadata: Metadata = { title: "My profile" };

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user!.id).single<Profile>();
  const isShelter = profile?.role === "shelter_admin";

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-5 flex items-start gap-3">
        <div className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">{isShelter ? <Building2Icon className="size-5" /> : <UserIcon className="size-5" />}</div>
        <div><h1 className="text-3xl font-black tracking-tight">{isShelter ? "Shelter profile" : "Your adoption profile"}</h1><p className="mt-1 text-sm text-muted-foreground">{isShelter ? "Your organization identity appears on every dog profile and request flow." : "A thoughtful profile helps shelters understand what life with you could look like."}</p></div>
      </div>
      <ProfileForm profile={profile!} email={user!.email ?? ""} />
    </div>
  );
}
