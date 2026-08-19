"use client";

import { useActionState } from "react";
import { HeartHandshakeIcon, HomeIcon, PawPrintIcon } from "lucide-react";
import { signup } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { ACCOUNT_MODE_LABELS, ACCOUNT_MODES } from "@/lib/constants";
import { FormError } from "./form-error";

export function SignupForm() {
  const [state, formAction, pending] = useActionState(signup, null);

  return (
    <Card className="border-white/70 bg-white/90 shadow-xl shadow-rose-100/50 backdrop-blur">
      <CardHeader>
        <div className="mb-2 flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <HeartHandshakeIcon className="size-5" />
        </div>
        <CardTitle className="text-xl">Create your TinDog account</CardTitle>
        <p className="text-sm text-muted-foreground">
          Tell us what brings you here so we can personalize your experience.
        </p>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="displayName">Your name</Label>
            <Input id="displayName" name="displayName" autoComplete="name" placeholder="Maya Levi" required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="accountMode">I&apos;m here to...</Label>
            <NativeSelect id="accountMode" name="accountMode" defaultValue="adopter">
              {ACCOUNT_MODES.map((mode) => (
                <option key={mode} value={mode}>{ACCOUNT_MODE_LABELS[mode]}</option>
              ))}
            </NativeSelect>
            <div className="flex gap-3 rounded-xl bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
              <HomeIcon className="mt-0.5 size-4 shrink-0" />
              <span>You can change this later and still use every part of the app.</span>
            </div>
          </div>
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
            {pending ? "Creating account..." : "Find my match"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
