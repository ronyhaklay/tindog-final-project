import type { Metadata } from "next";
import Link from "next/link";
import { SignupForm } from "@/components/auth/signup-form";
import { getLocale } from "@/lib/i18n-server";

export const metadata: Metadata = { title: "Sign up" };

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string | string[] }>;
}) {
  const he = (await getLocale()) === "he";
  const params = await searchParams;
  const rawRole = Array.isArray(params.role) ? params.role[0] : params.role;
  const initialRole = rawRole === "adopter" || rawRole === "shelter_admin" ? rawRole : undefined;

  return (
    <div className="flex flex-col gap-5">
      <SignupForm initialRole={initialRole} />
      <p className="text-center text-base text-muted-foreground">
        {he ? "כבר יש לך חשבון? " : "Already have an account? "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          {he ? "התחברות" : "Log in"}
        </Link>
      </p>
    </div>
  );
}
