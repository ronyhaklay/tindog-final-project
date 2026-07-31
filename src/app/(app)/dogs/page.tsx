import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { DogIcon, PencilIcon, PlusIcon } from "lucide-react";
import { deleteDog } from "@/actions/dogs";
import { DeleteDogButton } from "@/components/dogs/delete-dog-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LISTING_TYPE_LABELS } from "@/lib/constants";
import { publicPhotoUrl } from "@/lib/photos";
import { createClient } from "@/lib/supabase/server";
import type { DogWithPhotos } from "@/lib/types";

export const metadata: Metadata = { title: "My Dogs" };

export default async function MyDogsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: dogs } = await supabase
    .from("dogs")
    .select("*, dog_photos(*)")
    .eq("owner_id", user!.id)
    .order("created_at", { ascending: false })
    .returns<DogWithPhotos[]>();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">My dogs</h1>
        <Link href="/dogs/new">
          <Button>
            <PlusIcon data-icon="inline-start" />
            Add a dog
          </Button>
        </Link>
      </div>

      {!dogs || dogs.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <DogIcon className="size-10 text-muted-foreground" />
            <p className="font-medium">No dogs yet</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              Add your dog to find playdate friends, or publish a dog that
              needs a foster or forever home.
            </p>
            <Link href="/dogs/new">
              <Button>Add your first dog</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {dogs.map((dog) => {
            const cover = dog.dog_photos
              .slice()
              .sort((a, b) => a.sort_order - b.sort_order)[0];
            return (
              <Card key={dog.id} className="overflow-hidden">
                <div className="relative h-44 bg-muted">
                  {cover ? (
                    <Image
                      src={publicPhotoUrl(cover.storage_path)}
                      alt={dog.name}
                      fill
                      sizes="(max-width: 640px) 100vw, 50vw"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <DogIcon className="size-10 text-muted-foreground" />
                    </div>
                  )}
                  <div className="absolute top-2 left-2 flex gap-1.5">
                    <Badge>{LISTING_TYPE_LABELS[dog.listing_type]}</Badge>
                    {!dog.is_active && <Badge variant="secondary">Hidden</Badge>}
                  </div>
                </div>
                <CardContent className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{dog.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {dog.breed || "Mixed"} · {dog.age_years} years · {dog.city}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Link href={`/dogs/${dog.id}/edit`}>
                      <Button variant="outline" size="icon" aria-label="Edit">
                        <PencilIcon />
                      </Button>
                    </Link>
                    <DeleteDogButton
                      dogId={dog.id}
                      dogName={dog.name}
                      deleteAction={deleteDog}
                    />
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
