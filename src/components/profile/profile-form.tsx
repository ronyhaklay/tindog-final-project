"use client";

import { useActionState, useEffect, useState } from "react";
import { CheckCircle2Icon, HeartIcon, HomeIcon, ShieldCheckIcon, SparklesIcon } from "lucide-react";
import { updateRequiredProfile } from "@/actions/profile-completion";
import { FormError } from "@/components/auth/form-error";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import type { Profile } from "@/lib/types";

type ExtendedProfile = Profile & {
  shelter_name?: string | null;
  has_children_answered?: boolean;
  has_other_pets_answered?: boolean;
  profile_completed_at?: string | null;
};

export function ProfileForm({ profile, email }: { profile: ExtendedProfile; email: string }) {
  const [state, formAction, pending] = useActionState(updateRequiredProfile, null);
  const [he, setHe] = useState(false);
  const [mode, setMode] = useState(profile.account_mode ?? "adopter");

  useEffect(() => {
    const root = document.documentElement;
    setHe(root.dir === "rtl" || root.lang?.toLowerCase().startsWith("he"));
  }, []);

  const childrenDefault = profile.has_children_answered ? (profile.has_children ? "yes" : "no") : "";
  const petsDefault = profile.has_other_pets_answered ? (profile.has_other_pets ? "yes" : "no") : "";
  const lister = mode === "lister" || mode === "both";

  return (
    <form action={formAction} className="flex flex-col gap-5" dir={he ? "rtl" : "ltr"}>
      {!profile.profile_completed_at && (
        <div className="rounded-2xl border border-primary/20 bg-rose-50/90 p-4">
          <div className="flex gap-3">
            <ShieldCheckIcon className="mt-0.5 size-5 shrink-0 text-primary" />
            <div>
              <p className="font-black">{he ? "השלמת הפרופיל חובה לפני הצגת התאמות" : "Complete your profile before matching"}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {he
                  ? "אחוז ההתאמה מבוסס על אורח החיים וההעדפות שלך, ולכן לא נציג אחוז התאמה לפני שכל השאלות נענו."
                  : "Match percentages depend on your lifestyle and preferences, so Discover stays locked until every question is answered."}
              </p>
            </div>
          </div>
        </div>
      )}

      <Card className="overflow-hidden border-white/70 bg-white/90 shadow-sm">
        <CardHeader className="border-b bg-gradient-to-r from-rose-50 to-orange-50/60">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-2xl bg-white text-primary shadow-sm"><HeartIcon className="size-5" /></div>
            <div>
              <CardTitle className="text-lg">{he ? "עליך" : "About you"}</CardTitle>
              <p className="text-sm text-muted-foreground">{he ? "כל השדות המסומנים בכוכבית הם חובה." : "Every field marked with * is required."}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 pt-5 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5 sm:col-span-2"><Label>{he ? "אימייל" : "Email"}</Label><Input value={email} disabled /></div>
          <div className="flex flex-col gap-1.5"><Label htmlFor="displayName">{he ? "שם מלא *" : "Display name *"}</Label><Input id="displayName" name="displayName" defaultValue={profile.display_name} minLength={2} required /></div>
          <div className="flex flex-col gap-1.5"><Label htmlFor="city">{he ? "עיר מגורים *" : "City *"}</Label><Input id="city" name="city" defaultValue={profile.city ?? ""} placeholder={he ? "תל אביב" : "Tel Aviv"} minLength={2} required /></div>
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label htmlFor="accountMode">{he ? "מה מביא אותך ל-TinDog? *" : "Main goal *"}</Label>
            <NativeSelect id="accountMode" name="accountMode" value={mode} onChange={(e) => setMode(e.target.value)} required>
              <option value="adopter">{he ? "אני רוצה לאמץ" : "I want to adopt"}</option>
              <option value="lister">{he ? "אני מעמותה" : "I represent a shelter"}</option>
              <option value="both">{he ? "שניהם" : "Both"}</option>
            </NativeSelect>
          </div>
          {lister && (
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <Label htmlFor="shelterName">{he ? "שם העמותה *" : "Shelter name *"}</Label>
              <Input id="shelterName" name="shelterName" defaultValue={profile.shelter_name ?? ""} minLength={2} required />
            </div>
          )}
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label htmlFor="bio">{he ? "ספרו על עצמכם *" : "About you *"}</Label>
            <Textarea id="bio" name="bio" rows={4} defaultValue={profile.bio ?? ""} placeholder={he ? "ספרו על השגרה, הבית ומה חשוב לכם בכלב..." : "Tell us about your routine, home and what matters to you in a dog..."} minLength={10} required />
          </div>
        </CardContent>
      </Card>

      <Card className="border-white/70 bg-white/90 shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-2xl bg-amber-50 text-amber-700"><HomeIcon className="size-5" /></div>
            <div>
              <CardTitle className="text-lg">{he ? "אורח החיים והעדפות" : "Lifestyle & preferences"}</CardTitle>
              <p className="text-sm text-muted-foreground">{he ? "הפרטים האלה משמשים לחישוב ההתאמה. כולם חובה." : "These answers are used for matching. All are required."}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5"><Label htmlFor="householdType">{he ? "סוג מגורים *" : "Home *"}</Label><NativeSelect id="householdType" name="householdType" defaultValue={profile.household_type ?? ""} required><option value="" disabled>{he ? "בחרו" : "Select"}</option><option value="apartment">{he ? "דירה" : "Apartment"}</option><option value="house">{he ? "בית" : "House"}</option></NativeSelect></div>
          <div className="flex flex-col gap-1.5"><Label htmlFor="dogExperience">{he ? "ניסיון עם כלבים *" : "Dog experience *"}</Label><NativeSelect id="dogExperience" name="dogExperience" defaultValue={profile.dog_experience ?? ""} required><option value="" disabled>{he ? "בחרו" : "Select"}</option><option value="first_time">{he ? "מאמץ/ת בפעם הראשונה" : "First-time adopter"}</option><option value="some">{he ? "יש לי קצת ניסיון" : "Some experience"}</option><option value="experienced">{he ? "מנוסה עם כלבים" : "Experienced"}</option></NativeSelect></div>
          <div className="flex flex-col gap-1.5"><Label htmlFor="activityLevel">{he ? "רמת פעילות *" : "Activity level *"}</Label><NativeSelect id="activityLevel" name="activityLevel" defaultValue={profile.activity_level ?? ""} required><option value="" disabled>{he ? "בחרו" : "Select"}</option><option value="low">{he ? "רגועה" : "Calm"}</option><option value="medium">{he ? "בינונית" : "Balanced"}</option><option value="high">{he ? "פעילה מאוד" : "Very active"}</option></NativeSelect></div>
          <div className="flex flex-col gap-1.5"><Label htmlFor="preferredSize">{he ? "גודל כלב מועדף *" : "Preferred dog size *"}</Label><NativeSelect id="preferredSize" name="preferredSize" defaultValue={profile.preferred_size ?? ""} required><option value="" disabled>{he ? "בחרו" : "Select"}</option><option value="small">{he ? "קטן" : "Small"}</option><option value="medium">{he ? "בינוני" : "Medium"}</option><option value="large">{he ? "גדול" : "Large"}</option></NativeSelect></div>
          <div className="flex flex-col gap-1.5"><Label htmlFor="hasChildren">{he ? "האם יש ילדים בבית? *" : "Children at home? *"}</Label><NativeSelect id="hasChildren" name="hasChildren" defaultValue={childrenDefault} required><option value="" disabled>{he ? "בחרו כן או לא" : "Select yes or no"}</option><option value="yes">{he ? "כן" : "Yes"}</option><option value="no">{he ? "לא" : "No"}</option></NativeSelect></div>
          <div className="flex flex-col gap-1.5"><Label htmlFor="hasOtherPets">{he ? "האם יש חיות נוספות בבית? *" : "Other pets at home? *"}</Label><NativeSelect id="hasOtherPets" name="hasOtherPets" defaultValue={petsDefault} required><option value="" disabled>{he ? "בחרו כן או לא" : "Select yes or no"}</option><option value="yes">{he ? "כן" : "Yes"}</option><option value="no">{he ? "לא" : "No"}</option></NativeSelect></div>
        </CardContent>
      </Card>

      <FormError state={state} />
      {state?.ok && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800">
          <CheckCircle2Icon className="size-4" />
          {he ? "הפרופיל הושלם. אפשר לעבור עכשיו למסך הכלבים." : "Profile complete. You can now open Discover."}
        </div>
      )}
      <Button type="submit" size="lg" disabled={pending} className="self-end px-8"><SparklesIcon data-icon="inline-start" />{pending ? (he ? "שומר..." : "Saving...") : (he ? "שמירת הפרופיל והמשך" : "Save profile & continue")}</Button>
    </form>
  );
}
