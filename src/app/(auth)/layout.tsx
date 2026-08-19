import Image from "next/image";
import Link from "next/link";
import { LanguageSwitcher } from "@/components/language-switcher";
import { getLocale } from "@/lib/i18n-server";
import { TinDogBackground } from "@/components/tindog-background";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const he = locale === "he";
  return (
    <main className="relative flex min-h-svh flex-1 flex-col items-center justify-start overflow-hidden px-5 md: pt-16 pb-10 md:pt-20 md:pb-12">
      <TinDogBackground />
      <div className="absolute end-4 top-4 z-20"><LanguageSwitcher compact /></div>
      <div className="absolute -top-32 -left-20 size-80 rounded-full bg-rose-200/35 blur-3xl" />
      <div className="absolute -right-20 -bottom-32 size-80 rounded-full bg-amber-200/35 blur-3xl" />
      <Link href="/" className="relative z-10 mb-7 flex flex-col items-center gap-2.5">
        <Image src="/logo.png" alt="TinDog" width={92} height={92} className="rounded-3xl shadow-lg shadow-rose-200/40" />
        <span className="text-3xl font-extrabold tracking-tight">tin<span className="text-primary">dog</span></span>
        <span className="text-sm text-muted-foreground">{he ? "מוצאים את ההתאמה לכל החיים" : "Find your forever match"}</span>
      </Link>
      <div className="relative z-10 w-full max-w-xl">{children}</div>
    </main>
  );
}
