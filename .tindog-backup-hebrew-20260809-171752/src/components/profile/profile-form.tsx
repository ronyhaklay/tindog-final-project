"use client";

import { useActionState } from "react";
import { Building2Icon, HeartIcon, HomeIcon, ShieldCheckIcon, SparklesIcon } from "lucide-react";
import { updateProfile } from "@/actions/auth";
import { FormError } from "@/components/auth/form-error";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import {
  DOG_EXPERIENCE_LABELS,
  DOG_EXPERIENCE_LEVELS,
  DOG_SIZE_LABELS,
  DOG_SIZES,
  ENERGY_LEVEL_LABELS,
  ENERGY_LEVELS,
  HOUSEHOLD_TYPE_LABELS,
  HOUSEHOLD_TYPES,
} from "@/lib/constants";
import type { Profile } from "@/lib/types";

export function ProfileForm({ profile, email }: { profile: Profile; email: string }) {
  const [state, formAction, pending] = useActionState(updateProfile, null);
  const isShelter = profile.role === "shelter_admin";

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <Card className="overflow-hidden border-white/70 bg-white/90 shadow-sm">
        <CardHeader className="border-b bg-gradient-to-r from-rose-50 to-orange-50/60">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-2xl bg-white text-primary shadow-sm">{isShelter ? <Building2Icon className="size-5" /> : <HeartIcon className="size-5" />}</div>
              <div>
                <CardTitle className="text-lg">{isShelter ? "Shelter profile" : "About you"}</CardTitle>
                <p className="text-sm text-muted-foreground">{isShelter ? "This identity appears on your dog listings." : "Shelters use this context to understand your home and lifestyle."}</p>
              </div>
            </div>
            <Badge variant="secondary">{isShelter ? "Shelter manager" : "Adopter"}</Badge>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 pt-5 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5 sm:col-span-2"><Label>Email</Label><Input value={email} disabled /></div>
          <div className="flex flex-col gap-1.5"><Label htmlFor="displayName">Display name</Label><Input id="displayName" name="displayName" defaultValue={profile.display_name} required /></div>
          <div className="flex flex-col gap-1.5"><Label htmlFor="city">City</Label><Input id="city" name="city" defaultValue={profile.city ?? ""} placeholder="Tel Aviv" /></div>
          <div className="flex flex-col gap-1.5 sm:col-span-2"><Label htmlFor="bio">About</Label><Textarea id="bio" name="bio" rows={4} defaultValue={profile.bio ?? ""} placeholder={isShelter ? "Who are you and what kind of rescue work do you do?" : "What would make you a great home for a dog?"} /></div>
        </CardContent>
      </Card>

      {isShelter ? (
        <Card className="border-white/70 bg-white/90 shadow-sm">
          <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><Building2Icon className="size-5 text-primary" />Your organization</CardTitle></CardHeader>
          <CardContent className="grid gap-4">
            <div className="flex flex-col gap-1.5"><Label htmlFor="shelterName">Shelter / rescue name</Label><Input id="shelterName" name="shelterName" defaultValue={profile.shelter_name ?? ""} required /></div>
            <div className="flex flex-col gap-1.5"><Label htmlFor="shelterWebsite">Website / Instagram</Label><Input id="shelterWebsite" name="shelterWebsite" defaultValue={profile.shelter_website ?? ""} placeholder="https://..." /></div>
            <div className="flex flex-col gap-1.5"><Label htmlFor="shelterAbout">About the shelter</Label><Textarea id="shelterAbout" name="shelterAbout" rows={5} defaultValue={profile.shelter_about ?? ""} placeholder="Tell adopters about your mission, adoption process and area of activity." /></div>
            <div className="flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-950"><ShieldCheckIcon className="size-4" />{profile.shelter_verified ? "Verified TinDog shelter" : "Shelter account — verification badge can be enabled by the platform."}</div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-white/70 bg-white/90 shadow-sm">
          <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><HomeIcon className="size-5 text-primary" />Your future dog&apos;s lifestyle</CardTitle></CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5"><Label htmlFor="householdType">Home</Label><NativeSelect id="householdType" name="householdType" defaultValue={profile.household_type ?? ""}><option value="">Not specified</option>{HOUSEHOLD_TYPES.map((v) => <option key={v} value={v}>{HOUSEHOLD_TYPE_LABELS[v]}</option>)}</NativeSelect></div>
            <div className="flex flex-col gap-1.5"><Label htmlFor="activityLevel">Activity level</Label><NativeSelect id="activityLevel" name="activityLevel" defaultValue={profile.activity_level ?? ""}><option value="">Not specified</option>{ENERGY_LEVELS.map((v) => <option key={v} value={v}>{ENERGY_LEVEL_LABELS[v]}</option>)}</NativeSelect></div>
            <div className="flex flex-col gap-1.5"><Label htmlFor="preferredSize">Preferred size</Label><NativeSelect id="preferredSize" name="preferredSize" defaultValue={profile.preferred_size ?? ""}><option value="">Open to any size</option>{DOG_SIZES.map((v) => <option key={v} value={v}>{DOG_SIZE_LABELS[v]}</option>)}</NativeSelect></div>
            <div className="flex flex-col gap-1.5"><Label htmlFor="dogExperience">Dog experience</Label><NativeSelect id="dogExperience" name="dogExperience" defaultValue={profile.dog_experience ?? ""}><option value="">Not specified</option>{DOG_EXPERIENCE_LEVELS.map((v) => <option key={v} value={v}>{DOG_EXPERIENCE_LABELS[v]}</option>)}</NativeSelect></div>
            <label className="flex items-center gap-3 rounded-xl border bg-white p-3 text-sm"><input type="checkbox" name="hasChildren" defaultChecked={profile.has_children} className="size-4 accent-[var(--primary)]" />Children at home</label>
            <label className="flex items-center gap-3 rounded-xl border bg-white p-3 text-sm"><input type="checkbox" name="hasOtherPets" defaultChecked={profile.has_other_pets} className="size-4 accent-[var(--primary)]" />Other pets at home</label>
            <div className="sm:col-span-2 rounded-2xl bg-primary/5 p-4 text-sm text-muted-foreground"><SparklesIcon className="mr-2 inline size-4 text-primary" />TinDog uses these preferences to show a lifestyle-fit score on dog cards.</div>
          </CardContent>
        </Card>
      )}

      <FormError state={state} />
      <Button type="submit" size="lg" disabled={pending}>{pending ? "Saving..." : "Save profile"}</Button>
    </form>
  );
}
