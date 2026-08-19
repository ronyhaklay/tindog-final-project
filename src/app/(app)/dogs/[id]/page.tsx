import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { HingeDogProfile } from "@/components/dogs/hinge-dog-profile";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Dog profile" };

export default async function DogProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("get_dog_profile", {
    p_dog_id: id,
  });

  if (error || !data || typeof data !== "object") {
    if (error) console.error("get_dog_profile failed:", error);
    notFound();
  }

  return <HingeDogProfile dog={data as never} />;
}
