"use client";

import { useActionState } from "react";
import { login } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormError } from "./form-error";
import { useLanguage } from "@/components/language-provider";

export function LoginForm() {
  const [state, formAction, pending] = useActionState(login, null);
  const { isHebrew } = useLanguage();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{isHebrew ? "ברוכים השבים" : "Welcome back"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">{isHebrew ? "אימייל" : "Email"}</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password">{isHebrew ? "סיסמה" : "Password"}</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </div>
          <FormError state={state} />
          <Button type="submit" disabled={pending}>
            {pending ? (isHebrew ? "מתחברים..." : "Logging in...") : (isHebrew ? "התחברות" : "Log in")}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
