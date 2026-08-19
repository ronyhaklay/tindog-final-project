import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "@/components/auth/login-form";
import { getLocale } from "@/lib/i18n-server";

export const metadata: Metadata = { title: "Log in" };

export default async function LoginPage() {
  const he = (await getLocale()) === "he";
  return (
    <div className="flex flex-col gap-4">
      <LoginForm />
      <p className="text-center text-sm text-muted-foreground">
        {he ? "חדשים ב-TinDog? " : "New to TinDog? "}
        <Link href="/signup" className="font-medium text-primary hover:underline">
          {he ? "יצירת חשבון" : "Create an account"}
        </Link>
      </p>
    </div>
  );
}
