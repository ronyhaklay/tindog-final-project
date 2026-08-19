import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { DogForm } from "@/components/dogs/dog-form";
import { createClient } from "@/lib/supabase/server";
import type { DogWithPhotos } from "@/lib/types";

export const metadata: Metadata = { title: "Edit dog" };

export default async function EditDogPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user!.id).single();
  if (profile?.role !== "shelter_admin") redirect("/swipe");

  const { data: dog } = await supabase
    .from("dogs")
    .select("*, dog_photos(*)")
    .eq("id", id)
    .eq("owner_id", user!.id)
    .single<DogWithPhotos>();

  if (!dog) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-2xl">
      <p className="text-sm font-medium text-primary">Update listing</p>
      <h1 className="mb-5 text-3xl font-bold tracking-tight">Edit {dog.name}</h1>
      <DogForm dog={dog} />
    </div>
  );
}
