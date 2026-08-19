"use client";

import { useActionState, useState } from "react";
import { Building2Icon, HeartHandshakeIcon, PawPrintIcon, ShieldCheckIcon } from "lucide-react";
import { signup } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormError } from "./form-error";
import type { UserRole } from "@/lib/constants";

export function SignupForm() {
  const [state, formAction, pending] = useActionState(signup, null);
  const [role, setRole] = useState<UserRole>("adopter");

  return (
    <Card className="border-white/70 bg-white/92 shadow-2xl shadow-rose-100/60 backdrop-blur-xl">
      <CardHeader>
        <div className="mb-2 flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <HeartHandshakeIcon className="size-5" />
        </div>
        <CardTitle className="text-2xl">Join the TinDog community</CardTitle>
        <p className="text-sm text-muted-foreground">Adopters discover. Shelters manage listings and choose the right homes.</p>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="flex flex-col gap-4">
          <input type="hidden" name="role" value={role} />
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setRole("adopter")}
              className={`rounded-2xl border p-3 text-left transition ${role === "adopter" ? "border-primary bg-primary/10 ring-2 ring-primary/10" : "bg-white hover:bg-muted/50"}`}
            >
              <PawPrintIcon className="mb-2 size-5 text-primary" />
              <p className="font-semibold">I want to adopt</p>
              <p className="mt-1 text-xs text-muted-foreground">Swipe, save, match and chat.</p>
            </button>
            <button
              type="button"
              onClick={() => setRole("shelter_admin")}
              className={`rounded-2xl border p-3 text-left transition ${role === "shelter_admin" ? "border-primary bg-primary/10 ring-2 ring-primary/10" : "bg-white hover:bg-muted/50"}`}
            >
              <Building2Icon className="mb-2 size-5 text-primary" />
              <p className="font-semibold">Shelter manager</p>
              <p className="mt-1 text-xs text-muted-foreground">Publish dogs and review adopters.</p>
            </button>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="displayName">Your name</Label>
            <Input id="displayName" name="displayName" autoComplete="name" placeholder="Maya Levi" required />
          </div>
          {role === "shelter_admin" && (
            <div className="flex flex-col gap-1.5 rounded-2xl border border-amber-200 bg-amber-50/70 p-3">
              <Label htmlFor="shelterName">Shelter / rescue name</Label>
              <Input id="shelterName" name="shelterName" placeholder="Happy Tails Rescue" required />
              <p className="flex items-center gap-1.5 text-xs text-amber-900"><ShieldCheckIcon className="size-3.5" />This name appears on every dog profile you publish.</p>
            </div>
          )}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" autoComplete="email" placeholder="you@example.com" required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" autoComplete="new-password" placeholder="At least 8 characters" required />
          </div>
          <FormError state={state} />
          <Button type="submit" size="lg" disabled={pending}>
            <PawPrintIcon data-icon="inline-start" />
            {pending ? "Creating account..." : role === "shelter_admin" ? "Create shelter account" : "Find my match"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
