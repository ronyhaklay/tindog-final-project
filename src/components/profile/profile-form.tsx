"use client";

import { useActionState } from "react";
import { updateProfile } from "@/actions/auth";
import { FormError } from "@/components/auth/form-error";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Profile } from "@/lib/types";

export function ProfileForm({
  profile,
  email,
}: {
  profile: Profile;
  email: string;
}) {
  const [state, formAction, pending] = useActionState(updateProfile, null);

  return (
    <Card>
      <CardContent>
        <form action={formAction} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label>Email</Label>
            <Input value={email} disabled />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="displayName">Display name</Label>
            <Input
              id="displayName"
              name="displayName"
              defaultValue={profile.display_name}
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="city">City</Label>
            <Input
              id="city"
              name="city"
              defaultValue={profile.city ?? ""}
              placeholder="Tel Aviv"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="bio">About you</Label>
            <Textarea
              id="bio"
              name="bio"
              rows={4}
              defaultValue={profile.bio ?? ""}
              placeholder="Tell dog owners a little about yourself..."
            />
          </div>
          <FormError state={state} />
          {state?.ok && (
            <p className="text-sm text-green-600">Profile saved.</p>
          )}
          <Button type="submit" disabled={pending}>
            {pending ? "Saving..." : "Save profile"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
