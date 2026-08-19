import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { DogForm } from "@/components/dogs/dog-form";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Add a dog" };

export default async function NewDogPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("role,shelter_name").eq("id", user!.id).single();
  if (profile?.role !== "shelter_admin") redirect("/swipe");
  return <div className="mx-auto max-w-3xl"><div className="mb-5"><p className="text-sm font-medium text-primary">{profile.shelter_name || "Shelter listing"}</p><h1 className="text-3xl font-black tracking-tight">Help the right person fall in love</h1><p className="mt-1 text-sm text-muted-foreground">Add photos, a short video and even a bark so adopters can meet the real personality behind the profile.</p></div><DogForm /></div>;
}
