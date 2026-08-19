import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { DogIcon, EyeIcon, PencilIcon, VideoIcon, PlusIcon, SparklesIcon, Volume2Icon } from "lucide-react";
import { deleteDog } from "@/actions/dogs";
import { DeleteDogButton } from "@/components/dogs/delete-dog-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LISTING_TYPE_LABELS } from "@/lib/constants";
import { formatAge } from "@/lib/deck";
import { publicPhotoUrl } from "@/lib/photos";
import { createClient } from "@/lib/supabase/server";
import type { DogWithPhotos } from "@/lib/types";

export const metadata: Metadata = { title: "My listings" };

export default async function MyDogsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("role,shelter_name").eq("id", user!.id).single();
  if (profile?.role !== "shelter_admin") redirect("/swipe");

  const { data: dogs } = await supabase
    .from("dogs")
    .select("*, dog_photos(*)")
    .eq("owner_id", user!.id)
    .order("created_at", { ascending: false })
    .returns<DogWithPhotos[]>();

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-primary">{profile.shelter_name || "Shelter dashboard"}</p>
          <h1 className="text-3xl font-bold tracking-tight">My dog listings</h1>
          <p className="mt-1 text-sm text-muted-foreground">Keep profiles current so the right people know exactly who they are meeting.</p>
        </div>
        <Link href="/dogs/new"><Button size="lg"><PlusIcon data-icon="inline-start" />Add a dog</Button></Link>
      </div>

      {!dogs || dogs.length === 0 ? (
        <Card className="border-dashed bg-white/75">
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <div className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary"><DogIcon className="size-7" /></div>
            <p className="text-lg font-semibold">No listings yet</p>
            <p className="max-w-md text-sm text-muted-foreground">Create a warm, detailed profile for a dog that needs a forever or foster home.</p>
            <Link href="/dogs/new"><Button><SparklesIcon data-icon="inline-start" />Create the first listing</Button></Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {dogs.map((dog) => {
            const cover = dog.dog_photos.slice().sort((a, b) => a.sort_order - b.sort_order)[0];
            return (
              <Card key={dog.id} className="group overflow-hidden border-white/80 bg-white/90 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg">
                <div className="relative h-56 bg-muted">
                  {cover ? <Image src={publicPhotoUrl(cover.storage_path)} alt={dog.name} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover transition-transform duration-300 group-hover:scale-[1.02]" /> : <div className="flex h-full items-center justify-center"><DogIcon className="size-12 text-muted-foreground" /></div>}
                  <div className="absolute top-3 left-3 flex flex-wrap gap-1.5"><Badge>{LISTING_TYPE_LABELS[dog.listing_type]}</Badge>{!dog.is_active && <Badge variant="secondary">Hidden</Badge>}{dog.video_path && <Badge className="bg-black/55 text-white"><VideoIcon className="size-3" />Video</Badge>}{dog.bark_audio_path && <Badge className="bg-black/55 text-white"><Volume2Icon className="size-3" />Bark</Badge>}</div>
                </div>
                <CardContent className="pt-4">
                  <div className="mb-4">
                    <p className="text-xl font-bold">{dog.name}</p>
                    <p className="text-sm text-muted-foreground">{dog.breed || "Mixed breed"} · {formatAge(Number(dog.age_years))} · {dog.city}</p>
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/dogs/${dog.id}`} className="flex-1"><Button variant="outline" className="w-full"><EyeIcon data-icon="inline-start" />View</Button></Link>
                    <Link href={`/dogs/${dog.id}/edit`}><Button variant="outline" size="icon" aria-label="Edit"><PencilIcon /></Button></Link>
                    <DeleteDogButton dogId={dog.id} dogName={dog.name} deleteAction={deleteDog} />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
