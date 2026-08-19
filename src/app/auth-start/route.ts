import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  await supabase.auth.signOut();

  const intent = request.nextUrl.searchParams.get("intent");

  const target =
    intent === "lister"
      ? "/signup?mode=lister"
      : intent === "adopter"
        ? "/signup?mode=adopter"
        : "/login";

  return NextResponse.redirect(new URL(target, request.url));
}
