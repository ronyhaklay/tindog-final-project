"use client";

import { useActionState } from "react";
import { createDog, updateDog } from "@/actions/dogs";
import { FormError } from "@/components/auth/form-error";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import {
  DOG_SIZE_LABELS,
  DOG_SIZES,
  ENERGY_LEVEL_LABELS,
  ENERGY_LEVELS,
  LISTING_TYPE_LABELS,
  LISTING_TYPES,
} from "@/lib/constants";
import type { DogWithPhotos } from "@/lib/types";
import { PhotoUploader } from "./photo-uploader";

// One form handles both create and edit; `dog` present = edit mode.
export function DogForm({ dog }: { dog?: DogWithPhotos }) {
  const action = dog ? updateDog : createDog;
  const [state, formAction, pending] = useActionState(action, null);

  return (
    <Card>
      <CardContent>
        <form action={formAction} className="flex flex-col gap-4">
          {dog && <input type="hidden" name="dogId" value={dog.id} />}

          <div className="flex flex-col gap-1.5">
            <Label>Photos</Label>
            <PhotoUploader
              initialPaths={(dog?.dog_photos ?? [])
                .slice()
                .sort((a, b) => a.sort_order - b.sort_order)
                .map((p) => p.storage_path)}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                name="name"
                defaultValue={dog?.name ?? ""}
                placeholder="Rexi"
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="breed">Breed</Label>
              <Input
                id="breed"
                name="breed"
                defaultValue={dog?.breed ?? ""}
                placeholder="Mixed"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ageYears">Age (years)</Label>
              <Input
                id="ageYears"
                name="ageYears"
                type="number"
                step="0.5"
                min="0"
                max="25"
                defaultValue={dog?.age_years ?? ""}
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="size">Size</Label>
              <NativeSelect id="size" name="size" defaultValue={dog?.size ?? "medium"}>
                {DOG_SIZES.map((s) => (
                  <option key={s} value={s}>
                    {DOG_SIZE_LABELS[s]}
                  </option>
                ))}
              </NativeSelect>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="energyLevel">Energy level</Label>
              <NativeSelect
                id="energyLevel"
                name="energyLevel"
                defaultValue={dog?.energy_level ?? "medium"}
              >
                {ENERGY_LEVELS.map((e) => (
                  <option key={e} value={e}>
                    {ENERGY_LEVEL_LABELS[e]}
                  </option>
                ))}
              </NativeSelect>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="listingType">Looking for</Label>
              <NativeSelect
                id="listingType"
                name="listingType"
                defaultValue={dog?.listing_type ?? "playdate"}
              >
                {LISTING_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {LISTING_TYPE_LABELS[t]}
                  </option>
                ))}
              </NativeSelect>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                name="city"
                defaultValue={dog?.city ?? ""}
                placeholder="Tel Aviv"
                required
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="temperament">Temperament</Label>
            <Input
              id="temperament"
              name="temperament"
              defaultValue={dog?.temperament ?? ""}
              placeholder="Playful, loves people, great with kids"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="specialNeeds">Special needs</Label>
            <Input
              id="specialNeeds"
              name="specialNeeds"
              defaultValue={dog?.special_needs ?? ""}
              placeholder="Medication, allergies, fears... (optional)"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="description">Story</Label>
            <Textarea
              id="description"
              name="description"
              rows={4}
              defaultValue={dog?.description ?? ""}
              placeholder="Tell potential matches about this dog's personality and history..."
            />
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="isActive"
              defaultChecked={dog?.is_active ?? true}
              className="size-4 accent-[var(--primary)]"
            />
            Visible in the swipe deck
          </label>

          <FormError state={state} />
          <Button type="submit" disabled={pending}>
            {pending
              ? "Saving..."
              : dog
                ? "Save changes"
                : "Create dog profile"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
