"use client";

import { useSearchParams } from "next/navigation";

import { useActionState, useState } from "react";
import { Building2Icon, HeartHandshakeIcon, PawPrintIcon, ShieldCheckIcon } from "lucide-react";
import { signup } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormError } from "./form-error";
import { useLanguage } from "@/components/language-provider";
import type { UserRole } from "@/lib/constants";

export function SignupForm({ initialRole }: { initialRole?: UserRole }) {
  const searchParams = useSearchParams();
  const requestedMode =
    searchParams.get("mode") === "lister"
      ? "lister"
      : searchParams.get("mode") === "adopter"
        ? "adopter"
        : null;
  const [state, formAction, pending] = useActionState(signup, null);
  const [role, setRole] = useState<UserRole>(initialRole ?? "adopter");
  const { isHebrew } = useLanguage();
  const roleIsLocked = Boolean(initialRole);
  const isShelter = role === "shelter_admin";

  const title = roleIsLocked
    ? isShelter
      ? (isHebrew ? "פתיחת חשבון עמותה" : "Create a shelter account")
      : (isHebrew ? "פתיחת חשבון מאמץ" : "Create an adopter account")
    : (isHebrew ? "מצטרפים לקהילת TinDog" : "Join the TinDog community");

  const subtitle = roleIsLocked
    ? isShelter
      ? (isHebrew
          ? "נהלו את פרופילי הכלבים של העמותה, קבלו בקשות אימוץ ובחרו את הבית המתאים."
          : "Manage your shelter's dog profiles, review adoption requests and choose the right homes.")
      : (isHebrew
          ? "צרו פרופיל, הגדירו מה מתאים לכם והתחילו להכיר כלבים שמחפשים בית."
          : "Create your profile, set your preferences and start meeting dogs looking for a home.")
    : (isHebrew
        ? "מאמצים מגלים כלבים. עמותות מנהלות פרופילים ובוחרות את הבית המתאים."
        : "Adopters discover. Shelters manage listings and choose the right homes.");

  return (
    <Card className="rounded-[28px] border-white/80 bg-white/95 shadow-2xl shadow-rose-100/60 backdrop-blur-xl">
      <CardHeader className="px-7 pt-7 pb-5 md:px-8 md:pt-8">
        <div className="mb-3 flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          {isShelter ? <Building2Icon className="size-6" /> : <HeartHandshakeIcon className="size-5" />}
        </div>
        <CardTitle className="text-3xl md:text-[32px]">{title}</CardTitle>
        <p className="max-w-lg text-base leading-7 text-muted-foreground">{subtitle}</p>
      </CardHeader>
      <CardContent className="px-7 pb-7 md:px-8 md:pb-8">
        <form action={formAction} className="flex flex-col gap-5">
            {requestedMode && (
              <input
                data-locked-account-mode
                type="hidden"
                name="accountMode"
                value={requestedMode}
              />
            )}
          <input type="hidden" name="role" value={role} />

          {!roleIsLocked && (
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setRole("adopter")}
                className={`rounded-2xl border p-3 text-start transition ${role === "adopter" ? "border-primary bg-primary/10 ring-2 ring-primary/10" : "bg-white hover:bg-muted/50"}`}
              >
                <PawPrintIcon className="mb-2 size-5 text-primary" />
                <p className="font-semibold">{isHebrew ? "אני רוצה לאמץ" : "I want to adopt"}</p>
                <p className="mt-1 text-xs text-muted-foreground">{isHebrew ? "מחליקים, שומרים, מתאימים ומדברים." : "Swipe, save, match and chat."}</p>
              </button>
              <button
                type="button"
                onClick={() => setRole("shelter_admin")}
                className={`rounded-2xl border p-3 text-start transition ${role === "shelter_admin" ? "border-primary bg-primary/10 ring-2 ring-primary/10" : "bg-white hover:bg-muted/50"}`}
              >
                <Building2Icon className="mb-2 size-5 text-primary" />
                <p className="font-semibold">{isHebrew ? "אני מעמותה" : "I'm a shelter"}</p>
                <p className="mt-1 text-xs text-muted-foreground">{isHebrew ? "מפרסמים כלבים ובודקים מאמצים פוטנציאליים." : "Publish dogs and review adopters."}</p>
              </button>
            </div>
          )}

          {roleIsLocked && (
            <div className="flex items-center gap-4 rounded-2xl border border-primary/15 bg-primary/5 p-4 text-base">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white text-primary shadow-sm">
                {isShelter ? <Building2Icon className="size-4" /> : <PawPrintIcon className="size-4" />}
              </div>
              <div>
                <p className="font-semibold">
                  {isShelter
                    ? (isHebrew ? "חשבון מנהל/ת עמותה" : "Shelter manager account")
                    : (isHebrew ? "חשבון מאמץ/ת" : "Adopter account")}
                </p>
                <p className="text-xs text-muted-foreground">
                  {isHebrew ? "סוג החשבון כבר נבחר מהמסך הראשי." : "Your account type was selected on the home screen."}
                </p>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <Label className="text-base font-semibold" htmlFor="displayName">{isHebrew ? "השם שלך" : "Your name"}</Label>
            <Input className="h-12 rounded-xl px-4 text-base" id="displayName" name="displayName" autoComplete="name" placeholder="Maya Levi" required />
          </div>

          {isShelter && (
            <div className="flex flex-col gap-2 rounded-2xl border border-amber-200 bg-amber-50/70 p-4">
              <Label className="text-base font-semibold" htmlFor="shelterName">{isHebrew ? "שם העמותה / ארגון ההצלה" : "Shelter / rescue name"}</Label>
              <Input className="h-12 rounded-xl px-4 text-base" id="shelterName" name="shelterName" placeholder={isHebrew ? "לדוגמה: חברים לחיים" : "Happy Tails Rescue"} required />
              <p className="flex items-center gap-1.5 text-xs text-amber-900">
                <ShieldCheckIcon className="size-3.5" />
                {isHebrew ? "השם הזה יופיע בכל פרופיל כלב שתפרסמו." : "This name appears on every dog profile you publish."}
              </p>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <Label className="text-base font-semibold" htmlFor="email">{isHebrew ? "אימייל" : "Email"}</Label>
            <Input className="h-12 rounded-xl px-4 text-base" id="email" name="email" type="email" autoComplete="email" placeholder="you@example.com" required />
          </div>
          <div className="flex flex-col gap-2">
            <Label className="text-base font-semibold" htmlFor="password">{isHebrew ? "סיסמה" : "Password"}</Label>
            <Input className="h-12 rounded-xl px-4 text-base" id="password" name="password" type="password" autoComplete="new-password" placeholder={isHebrew ? "לפחות 8 תווים" : "At least 8 characters"} required />
          </div>
          <FormError state={state} />
          <Button type="submit" size="lg" className="h-13 rounded-xl text-base font-bold" disabled={pending}>
            <PawPrintIcon data-icon="inline-start" />
            {pending
              ? (isHebrew ? "יוצרים חשבון..." : "Creating account...")
              : isShelter
                ? (isHebrew ? "יצירת חשבון עמותה" : "Create shelter account")
                : (isHebrew ? "להתחיל למצוא את המאץ׳ שלי" : "Start finding my match")}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
