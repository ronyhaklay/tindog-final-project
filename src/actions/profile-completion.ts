"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/lib/types";

function value(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

export async function updateRequiredProfile(
  _previousState: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const displayName = value(formData, "displayName");
  const city = value(formData, "city");
  const bio = value(formData, "bio");
  const accountMode = value(formData, "accountMode");
  const householdType = value(formData, "householdType");
  const activityLevel = value(formData, "activityLevel");
  const preferredSize = value(formData, "preferredSize");
  const dogExperience = value(formData, "dogExperience");
  const shelterName = value(formData, "shelterName");
  const hasChildren = value(formData, "hasChildren");
  const hasOtherPets = value(formData, "hasOtherPets");

  if (displayName.length < 2) return { ok: false, error: "שם מלא הוא שדה חובה." };
  if (city.length < 2) return { ok: false, error: "עיר מגורים היא שדה חובה." };
  if (bio.length < 10) return { ok: false, error: "ספרו על עצמכם בכמה מילים — לפחות 10 תווים." };
  if (!["adopter", "lister", "both"].includes(accountMode)) return { ok: false, error: "יש לבחור מטרת שימוש." };
  if (!["apartment", "house"].includes(householdType)) return { ok: false, error: "יש לבחור סוג מגורים." };
  if (!["low", "medium", "high"].includes(activityLevel)) return { ok: false, error: "יש לבחור רמת פעילות." };
  if (!["small", "medium", "large"].includes(preferredSize)) return { ok: false, error: "יש לבחור גודל כלב מועדף." };
  if (!["first_time", "some", "experienced"].includes(dogExperience)) return { ok: false, error: "יש לבחור רמת ניסיון עם כלבים." };
  if (!["yes", "no"].includes(hasChildren)) return { ok: false, error: "יש לענות האם יש ילדים בבית." };
  if (!["yes", "no"].includes(hasOtherPets)) return { ok: false, error: "יש לענות האם יש חיות נוספות בבית." };
  if (["lister", "both"].includes(accountMode) && shelterName.length < 2) return { ok: false, error: "שם העמותה הוא שדה חובה." };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "יש להתחבר מחדש." };

  const { error } = await supabase.rpc("complete_my_profile", {
    p_display_name: displayName,
    p_city: city,
    p_bio: bio,
    p_account_mode: accountMode,
    p_household_type: householdType,
    p_has_children: hasChildren === "yes",
    p_has_other_pets: hasOtherPets === "yes",
    p_activity_level: activityLevel,
    p_preferred_size: preferredSize,
    p_dog_experience: dogExperience,
    p_shelter_name: shelterName || null,
  });

  if (error) {
    console.error("complete_my_profile failed:", error);
    return { ok: false, error: "לא הצלחנו לשמור את הפרופיל. ודאו שכל השדות מלאים." };
  }

  revalidatePath("/profile");
  revalidatePath("/swipe");
  revalidatePath("/matches");
  revalidatePath("/favorites");
  revalidatePath("/requests");
  return { ok: true };
}
