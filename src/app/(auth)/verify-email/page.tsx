import type { Metadata } from "next";
import Link from "next/link";
import { BadgeCheckIcon, CheckCircle2Icon, MailCheckIcon, ShieldCheckIcon } from "lucide-react";
import { getLocale } from "@/lib/i18n-server";

export const metadata: Metadata = { title: "Verify your email" };

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string | string[] }>;
}) {
  const he = (await getLocale()) === "he";
  const params = await searchParams;
  const rawEmail = Array.isArray(params.email) ? params.email[0] : params.email;
  const email = rawEmail?.trim() || null;

  return (
    <div className="overflow-hidden rounded-[30px] border border-emerald-100/90 bg-white/95 shadow-2xl shadow-emerald-100/50 backdrop-blur-xl">
      <div className="relative px-7 py-9 text-center md:px-10 md:py-11">
        <div className="pointer-events-none absolute -top-20 start-1/2 size-48 -translate-x-1/2 rounded-full bg-emerald-100/70 blur-3xl" />

        <div className="relative mx-auto mb-5 flex size-20 items-center justify-center rounded-full bg-emerald-50 ring-8 ring-emerald-50/60">
          <MailCheckIcon className="size-9 text-emerald-600" />
          <span className="absolute -end-1 -bottom-1 flex size-8 items-center justify-center rounded-full border-4 border-white bg-emerald-500 text-white">
            <CheckCircle2Icon className="size-5" />
          </span>
        </div>

        <div className="relative">
          <div className="mx-auto mb-3 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-sm font-bold text-emerald-700">
            <BadgeCheckIcon className="size-4" />
            {he ? "ההרשמה הושלמה בהצלחה" : "Registration completed"}
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight text-slate-950 md:text-4xl">
            {he ? "כמעט סיימנו — רק לאמת את האימייל" : "One last step — verify your email"}
          </h1>

          <p className="mx-auto mt-4 max-w-md text-base leading-7 text-slate-600">
            {he
              ? "שלחנו אלייך קישור אימות. לחצי עליו כדי לאשר את החשבון ולהמשיך ל‑TinDog."
              : "We sent you a verification link. Open it to confirm your account and continue to TinDog."}
          </p>

          {email ? (
            <div dir="ltr" className="mx-auto mt-5 max-w-md rounded-2xl border border-emerald-100 bg-emerald-50/60 px-4 py-3 text-sm font-semibold text-slate-800">
              {email}
            </div>
          ) : null}

          <div className="mx-auto mt-6 grid max-w-md gap-3 text-start">
            <div className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
              <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-white text-primary shadow-sm">1</span>
              <div>
                <p className="font-bold text-slate-900">{he ? "פתחי את תיבת האימייל" : "Open your inbox"}</p>
                <p className="mt-0.5 text-sm leading-6 text-slate-500">
                  {he ? "חפשי הודעת אימות מ‑TinDog / Supabase." : "Look for the TinDog / Supabase verification email."}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
              <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-white text-primary shadow-sm">2</span>
              <div>
                <p className="font-bold text-slate-900">{he ? "לחצי על קישור האימות" : "Tap the verification link"}</p>
                <p className="mt-0.5 text-sm leading-6 text-slate-500">
                  {he ? "לאחר האישור החשבון יופעל ותוכלי להיכנס לאפליקציה." : "After confirmation, your account will be activated and ready to use."}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-7 rounded-2xl border border-amber-100 bg-amber-50/70 px-4 py-3 text-sm leading-6 text-amber-900">
            {he
              ? "לא מצאת את ההודעה? בדקי גם בתיקיות ספאם / קידומי מכירות והמתיני דקה-שתיים."
              : "Can’t find it? Check Spam / Promotions and allow a minute or two for delivery."}
          </div>

          <Link
            href="/login"
            className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 text-base font-bold text-white shadow-lg shadow-primary/20 transition hover:opacity-90"
          >
            <ShieldCheckIcon className="size-5" />
            {he ? "כבר אימתתי — מעבר להתחברות" : "I verified — go to login"}
          </Link>

          <Link href="/" className="mt-3 inline-flex text-sm font-semibold text-slate-500 transition hover:text-slate-900">
            {he ? "חזרה למסך הראשי" : "Back to home"}
          </Link>
        </div>
      </div>
    </div>
  );
}
