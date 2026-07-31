import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// Next.js 16 "proxy" (formerly middleware): refreshes the Supabase
// session and guards protected routes on every request.
export default async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  // Run on every route except static assets and images.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|logo.png|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
