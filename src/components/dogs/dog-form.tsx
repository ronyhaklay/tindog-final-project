"use client";

import { useActionState } from "react";
import { HeartIcon, PawPrintIcon, ShieldCheckIcon, SparklesIcon } from "lucide-react";
import { useLanguage } from "@/components/language-provider";
import { createDog, updateDog } from "@/actions/dogs";
import { FormError } from "@/components/auth/form-error";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import {
  DOG_SIZES,
  ENERGY_LEVELS,
  LISTING_TYPES,
} from "@/lib/constants";
import type { DogWithPhotos } from "@/lib/types";
import { dogSizeLabel, energyLevelLabel, listingTypeLabel } from "@/lib/i18n";
import { PhotoUploader } from "./photo-uploader";
import { MediaUploader } from "./media-uploader";


export function DogForm({ dog }: { dog?: DogWithPhotos }) {
  const action = dog ? updateDog : createDog;
  const [state, formAction, pending] = useActionState(action, null);
  const { locale, isHebrew } = useLanguage();
  const traits = [
    { name: "goodWithKids", label: isHebrew ? "מתאים לילדים" : "Good with kids", key: "good_with_kids" as const },
    { name: "goodWithDogs", label: isHebrew ? "מתאים לכלבים" : "Good with dogs", key: "good_with_dogs" as const },
    { name: "goodWithCats", label: isHebrew ? "מתאים לחתולים" : "Good with cats", key: "good_with_cats" as const },
    { name: "houseTrained", label: isHebrew ? "מחונך לצרכים" : "House trained", key: "house_trained" as const },
    { name: "vaccinated", label: isHebrew ? "מחוסן" : "Vaccinated", key: "vaccinated" as const },
    { name: "neutered", label: isHebrew ? "מעוקר / מסורס" : "Spayed / neutered", key: "neutered" as const },
  ];

  return (
    <Card className="overflow-hidden border-white/70 bg-white/90 shadow-lg shadow-rose-100/30">
      <CardHeader className="border-b bg-gradient-to-r from-rose-50 via-white to-amber-50">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
            <PawPrintIcon className="size-5" />
          </div>
          <div>
            <CardTitle className="text-xl">{dog ? isHebrew ? `ספרו לנו עוד על ${dog.name}` : `Tell us more about ${dog.name}` : isHebrew ? "יצירת פרופיל לכלב" : "Create a dog profile"}</CardTitle>
            <p className="text-sm text-muted-foreground">{isHebrew ? "פרופיל עשיר ומדויק עוזר לקבל בקשות אימוץ מתאימות יותר." : "Great profiles get better, more thoughtful adoption requests."}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-5">
        <form action={formAction} className="flex flex-col gap-6">
          {dog && <input type="hidden" name="dogId" value={dog.id} />}

          <div className="flex flex-col gap-2">
            <Label>{isHebrew ? "תמונות" : "Photos"}</Label>
            <PhotoUploader
              initialPaths={(dog?.dog_photos ?? []).slice().sort((a, b) => a.sort_order - b.sort_order).map((p) => p.storage_path)}
            />
            <p className="text-xs text-muted-foreground">{isHebrew ? "טיפ: כדאי לבחור כתמונה ראשונה צילום מואר בגובה העיניים." : "Tip: use a bright, eye-level portrait as the first photo."}</p>
          </div>

          <section className="rounded-2xl border bg-gradient-to-br from-rose-50/70 to-amber-50/70 p-4">
            <div className="mb-3 flex items-center gap-2 font-semibold"><SparklesIcon className="size-4 text-primary" />{isHebrew ? "תנו לפרופיל חיים" : "Make this profile come alive"}</div>
            <MediaUploader initialVideoPath={dog?.video_path} initialBarkAudioPath={dog?.bark_audio_path} />
          </section>

          <section className="grid gap-4 rounded-2xl border bg-background/70 p-4 sm:grid-cols-2">
            <div className="sm:col-span-2 flex items-center gap-2 font-semibold"><HeartIcon className="size-4 text-primary" />{isHebrew ? "הפרטים הבסיסיים" : "The basics"}</div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="name">{isHebrew ? "שם" : "Name"}</Label>
              <Input id="name" name="name" defaultValue={dog?.name ?? ""} placeholder="Luna" required />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="breed">{isHebrew ? "גזע" : "Breed"}</Label>
              <Input id="breed" name="breed" defaultValue={dog?.breed ?? ""} placeholder="Mixed" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ageYears">{isHebrew ? "גיל (בשנים)" : "Age (years)"}</Label>
              <Input id="ageYears" name="ageYears" type="number" step="0.5" min="0" max="25" defaultValue={dog?.age_years ?? ""} required />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="gender">{isHebrew ? "מין" : "Gender"}</Label>
              <NativeSelect id="gender" name="gender" defaultValue={dog?.gender ?? ""}>
                <option value="">{isHebrew ? "לא צוין" : "Not specified"}</option>
                <option value="female">{isHebrew ? "נקבה" : "Female"}</option>
                <option value="male">{isHebrew ? "זכר" : "Male"}</option>
              </NativeSelect>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="size">{isHebrew ? "גודל" : "Size"}</Label>
              <NativeSelect id="size" name="size" defaultValue={dog?.size ?? "medium"}>
                {DOG_SIZES.map((s) => <option key={s} value={s}>{dogSizeLabel(locale, s)}</option>)}
              </NativeSelect>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="energyLevel">{isHebrew ? "רמת אנרגיה" : "Energy level"}</Label>
              <NativeSelect id="energyLevel" name="energyLevel" defaultValue={dog?.energy_level ?? "medium"}>
                {ENERGY_LEVELS.map((e) => <option key={e} value={e}>{energyLevelLabel(locale, e)}</option>)}
              </NativeSelect>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="listingType">{isHebrew ? "מחפש/ת" : "Looking for"}</Label>
              <NativeSelect id="listingType" name="listingType" defaultValue={dog?.listing_type ?? "adoption"}>
                {LISTING_TYPES.map((t) => <option key={t} value={t}>{listingTypeLabel(locale, t)}</option>)}
              </NativeSelect>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="city">{isHebrew ? "עיר" : "City"}</Label>
              <Input id="city" name="city" defaultValue={dog?.city ?? ""} placeholder="Tel Aviv" required />
            </div>
          </section>

          <section className="rounded-2xl border bg-background/70 p-4">
            <div className="mb-3 flex items-center gap-2 font-semibold"><ShieldCheckIcon className="size-4 text-primary" />{isHebrew ? "התאמה וטיפול" : "Compatibility & care"}</div>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {traits.map((trait) => (
                <label key={trait.name} className="flex items-center gap-3 rounded-xl border bg-white px-3 py-3 text-sm shadow-xs">
                  <input type="checkbox" name={trait.name} defaultChecked={dog?.[trait.key] ?? false} className="size-4 accent-[var(--primary)]" />
                  {trait.label}
                </label>
              ))}
            </div>
          </section>

          <section className="grid gap-4 rounded-2xl border bg-background/70 p-4">
            <div className="flex items-center gap-2 font-semibold"><SparklesIcon className="size-4 text-primary" />{isHebrew ? "אישיות וסיפור" : "Personality & story"}</div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="temperament">{isHebrew ? "אישיות בכמה מילים" : "Personality in a few words"}</Label>
              <Input id="temperament" name="temperament" defaultValue={dog?.temperament ?? ""} placeholder={isHebrew ? "עדין, שובב, מתלטף, קצת ביישן בהתחלה" : "Gentle, playful, cuddly, a little shy at first"} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="specialNeeds">{isHebrew ? "צרכים מיוחדים" : "Special needs"}</Label>
              <Input id="specialNeeds" name="specialNeeds" defaultValue={dog?.special_needs ?? ""} placeholder={isHebrew ? "תרופות, אלרגיות, פחדים... (אופציונלי)" : "Medication, allergies, fears... (optional)"} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="description">{isHebrew ? "הסיפור שלהם" : "Their story"}</Label>
              <Textarea id="description" name="description" rows={6} defaultValue={dog?.description ?? ""} placeholder={isHebrew ? "מה הופך את הכלב הזה למיוחד? איזה בית יעשה לו הכי טוב?" : "What makes this dog special? What kind of home would make them happiest?"} />
            </div>
          </section>

          <label className="flex items-center gap-3 rounded-xl border bg-white p-3 text-sm">
            <input type="checkbox" name="isActive" defaultChecked={dog?.is_active ?? true} className="size-4 accent-[var(--primary)]" />
            {isHebrew ? "מוצג לאנשים שמחפשים כלבים" : "Visible to people discovering dogs"}
          </label>

          <FormError state={state} />
          <Button type="submit" size="lg" disabled={pending}>
            <PawPrintIcon data-icon="inline-start" />
            {pending ? (isHebrew ? "שומר..." : "Saving...") : dog ? (isHebrew ? "שמירת שינויים" : "Save changes") : (isHebrew ? "פרסום פרופיל הכלב" : "Publish dog profile")}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
