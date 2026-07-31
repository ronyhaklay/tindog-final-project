"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  firstError,
  loginSchema,
  profileSchema,
  signupSchema,
} from "@/lib/validation";
import type { ActionResult } from "@/lib/types";

export async function signup(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const parsed = signupSchema.safeParse({
    displayName: formData.get("displayName"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { ok: false, error: firstError(parsed.error) };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { display_name: parsed.data.displayName },
    },
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  // If email confirmation is enabled in Supabase, there is no session yet.
  if (!data.session) {
    return {
      ok: false,
      error: "Check your email to confirm your account, then log in.",
    };
  }

  redirect("/swipe");
}

export async function login(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { ok: false, error: firstError(parsed.error) };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return { ok: false, error: "Invalid email or password." };
  }

  redirect("/swipe");
}

export async function logout(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function updateProfile(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const parsed = profileSchema.safeParse({
    displayName: formData.get("displayName"),
    city: formData.get("city"),
    bio: formData.get("bio"),
  });
  if (!parsed.success) {
    return { ok: false, error: firstError(parsed.error) };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "Not authenticated." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      display_name: parsed.data.displayName,
      city: parsed.data.city || null,
      bio: parsed.data.bio || null,
    })
    .eq("id", user.id);

  if (error) {
    return { ok: false, error: "Could not save profile. Please try again." };
  }

  revalidatePath("/profile");
  return { ok: true };
}
