import type { Metadata } from "next";
import Link from "next/link";
import {
  CheckCircle2Icon,
  ChevronRightIcon,
  HeartIcon,
  HeartHandshakeIcon,
  MessageCircleIcon,
  PawPrintIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { listingTypeLabel, localeTag } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n-server";
import { createClient } from "@/lib/supabase/server";
import type { Dog, MatchRequest, Profile } from "@/lib/types";

export const metadata: Metadata = { title: "Matches" };

type MatchRow = MatchRequest & {
  dogs: Dog & { profiles: Profile };
  requester: Profile;
};

export default async function MatchesPage() {
  const locale = await getLocale();
  const he = locale === "he";
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: viewer } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const { data: matchesData, error: matchesError } = await supabase.rpc(
    "get_my_approved_matches",
  );

  if (matchesError) {
    console.error("get_my_approved_matches failed:", matchesError);
  }

  const matches: MatchRow[] = Array.isArray(matchesData)
    ? (matchesData as MatchRow[])
    : [];

  const adopter = viewer?.role === "adopter";

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-5">
      <div className="flex items-start gap-3">
        <div className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <HeartIcon className="size-5" />
        </div>

        <div>
          <h1 className="text-3xl font-black tracking-tight">
            {adopter
              ? he
                ? "ההתאמות שלך"
                : "Your matches"
              : he
                ? "חיבורים שאושרו"
                : "Approved connections"}
          </h1>

          <p className="mt-1 text-sm text-muted-foreground">
            {adopter
              ? he
                ? "העמותה אמרה כן. עכשיו מתחיל החלק המרגש באמת."
                : "A shelter said yes. Now the meaningful part starts."
              : he
                ? "מאמצים שאושרו יכולים עכשיו לדבר איתכם על הצעדים הבאים."
                : "Approved adopters can now chat with your shelter about next steps."}
          </p>
        </div>
      </div>

      {adopter && (
        <Card className="overflow-hidden border-primary/15 bg-gradient-to-r from-rose-50 via-white to-amber-50">
          <CardContent className="pt-5">
            <div className="grid gap-3 text-center sm:grid-cols-4">
              {[
                {
                  icon: PawPrintIcon,
                  label: he ? "מגלים" : "Discover",
                },
                {
                  icon: HeartHandshakeIcon,
                  label: he ? "בדיקת העמותה" : "Shelter review",
                },
                {
                  icon: MessageCircleIcon,
                  label: he ? "צ׳אט" : "Chat",
                },
                {
                  icon: CheckCircle2Icon,
                  label: he ? "מפגש היכרות" : "Meet & greet",
                },
              ].map(({ icon: Icon, label }, i) => (
                <div
                  key={label}
                  className="relative flex flex-col items-center gap-2 rounded-2xl bg-white/70 p-3"
                >
                  <div className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Icon className="size-4" />
                  </div>
                  <p className="text-xs font-semibold">
                    {i + 1}. {label}
                  </p>
                  {i < 3 && (
                    <span className="absolute -right-2 top-1/2 hidden text-primary/30 sm:block">
                      →
                    </span>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {matches.length === 0 ? (
        <Card className="border-dashed bg-white/75">
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <div className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
              <MessageCircleIcon className="size-6" />
            </div>

            <p className="text-lg font-semibold">
              {he ? "עדיין אין שיחות" : "No conversations yet"}
            </p>

            <p className="max-w-md text-sm text-muted-foreground">
              {adopter
                ? he
                  ? "אחרי שהעמותה מאשרת בקשת אימוץ, השיחה הפרטית מופיעה כאן אוטומטית."
                  : "After the shelter approves your request, the private chat appears here automatically."
                : he
                  ? "אשרו בקשת אימוץ מתאימה כדי לפתוח שיחה פרטית."
                  : "Approve a thoughtful adoption request to open a private conversation."}
            </p>

            {matchesError && (
              <p className="text-xs text-destructive">
                {he
                  ? "אירעה שגיאה בקריאת ההתאמות. נסו לרענן את הדף."
                  : "There was a problem loading matches. Please refresh."}
              </p>
            )}

            {adopter && (
              <Link href="/swipe">
                <Button variant="outline">
                  {he ? "להמשיך לגלות" : "Keep discovering"}
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {matches.map((match) => {
            const iAmRequester = match.requester_id === user.id;

            const otherName = iAmRequester
              ? match.dogs.profiles.shelter_name ||
                match.dogs.profiles.display_name
              : match.requester.display_name;

            return (
              <Link key={match.id} href={`/matches/${match.id}`}>
                <Card className="group border-white/80 bg-white/92 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-rose-100/50">
                  <CardContent className="flex items-center justify-between gap-4 pt-5">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-fuchsia-600 text-white shadow">
                        <HeartIcon className="size-5 fill-current" />
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate font-bold">
                            {otherName}
                          </p>
                          <Badge variant="secondary">
                            {he ? "התאמה" : "Matched"}
                          </Badge>
                        </div>

                        <p className="text-sm text-muted-foreground">
                          {he ? "לגבי" : "About"}{" "}
                          <strong className="text-foreground">
                            {match.dogs.name}
                          </strong>
                        </p>

                        <p className="mt-1 text-xs text-muted-foreground">
                          {he ? "מחוברים מאז" : "Connected"}{" "}
                          {new Date(match.updated_at).toLocaleDateString(
                            localeTag(locale),
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge
                        variant="secondary"
                        className="hidden sm:inline-flex"
                      >
                        {listingTypeLabel(
                          locale,
                          match.dogs.listing_type,
                        )}
                      </Badge>
                      <ChevronRightIcon className="size-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
