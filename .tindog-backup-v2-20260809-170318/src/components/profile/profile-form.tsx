"use client";

import { useActionState } from "react";
import { HeartIcon, HomeIcon, SparklesIcon } from "lucide-react";
import { updateProfile } from "@/actions/auth";
import { FormError } from "@/components/auth/form-error";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import {
  ACCOUNT_MODE_LABELS,
  ACCOUNT_MODES,
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

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <Card className="overflow-hidden border-white/70 bg-white/90 shadow-sm">
        <CardHeader className="border-b bg-gradient-to-r from-rose-50 to-orange-50/60">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-2xl bg-white text-primary shadow-sm"><HeartIcon className="size-5" /></div>
            <div>
              <CardTitle className="text-lg">About you</CardTitle>
              <p className="text-sm text-muted-foreground">The basics shelters and dog owners will see.</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 pt-5 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label>Email</Label>
            <Input value={email} disabled />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="displayName">Display name</Label>
            <Input id="displayName" name="displayName" defaultValue={profile.display_name} required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="city">City</Label>
            <Input id="city" name="city" defaultValue={profile.city ?? ""} placeholder="Tel Aviv" />
          </div>
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label htmlFor="accountMode">Main goal</Label>
            <NativeSelect id="accountMode" name="accountMode" defaultValue={profile.account_mode ?? "adopter"}>
              {ACCOUNT_MODES.map((mode) => <option key={mode} value={mode}>{ACCOUNT_MODE_LABELS[mode]}</option>)}
            </NativeSelect>
          </div>
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label htmlFor="bio">About you</Label>
            <Textarea id="bio" name="bio" rows={4} defaultValue={profile.bio ?? ""} placeholder="Tell us about your routine, home and what kind of companion you hope to meet..." />
          </div>
        </CardContent>
      </Card>

      <Card className="border-white/70 bg-white/90 shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-2xl bg-amber-50 text-amber-700"><HomeIcon className="size-5" /></div>
            <div>
              <CardTitle className="text-lg">Your lifestyle</CardTitle>
              <p className="text-sm text-muted-foreground">Helps owners understand whether their dog fits your home.</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="householdType">Home</Label>
            <NativeSelect id="householdType" name="householdType" defaultValue={profile.household_type ?? ""}>
              <option value="">Prefer not to say</option>
              {HOUSEHOLD_TYPES.map((value) => <option key={value} value={value}>{HOUSEHOLD_TYPE_LABELS[value]}</option>)}
            </NativeSelect>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="dogExperience">Dog experience</Label>
            <NativeSelect id="dogExperience" name="dogExperience" defaultValue={profile.dog_experience ?? ""}>
              <option value="">Select experience</option>
              {DOG_EXPERIENCE_LEVELS.map((value) => <option key={value} value={value}>{DOG_EXPERIENCE_LABELS[value]}</option>)}
            </NativeSelect>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="activityLevel">Your activity level</Label>
            <NativeSelect id="activityLevel" name="activityLevel" defaultValue={profile.activity_level ?? ""}>
              <option value="">No preference</option>
              {ENERGY_LEVELS.map((value) => <option key={value} value={value}>{ENERGY_LEVEL_LABELS[value]}</option>)}
            </NativeSelect>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="preferredSize">Preferred dog size</Label>
            <NativeSelect id="preferredSize" name="preferredSize" defaultValue={profile.preferred_size ?? ""}>
              <option value="">Any size</option>
              {DOG_SIZES.map((value) => <option key={value} value={value}>{DOG_SIZE_LABELS[value]}</option>)}
            </NativeSelect>
          </div>
          <label className="flex items-center gap-3 rounded-xl border p-3 text-sm">
            <input type="checkbox" name="hasChildren" defaultChecked={profile.has_children} className="size-4 accent-[var(--primary)]" />
            Children live at home
          </label>
          <label className="flex items-center gap-3 rounded-xl border p-3 text-sm">
            <input type="checkbox" name="hasOtherPets" defaultChecked={profile.has_other_pets} className="size-4 accent-[var(--primary)]" />
            Other pets live at home
          </label>
        </CardContent>
      </Card>

      <FormError state={state} />
      {state?.ok && <p className="text-sm font-medium text-green-700">Profile saved.</p>}
      <Button type="submit" size="lg" disabled={pending} className="self-end px-8">
        <SparklesIcon data-icon="inline-start" />
        {pending ? "Saving..." : "Save my profile"}
      </Button>
    </form>
  );
}
