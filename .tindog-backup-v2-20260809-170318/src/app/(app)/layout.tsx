import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppNav } from "@/components/app-nav";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Count pending requests on my dogs for the nav badge.
  const { data: myDogs } = await supabase
    .from("dogs")
    .select("id")
    .eq("owner_id", user.id);

  let pendingCount = 0;
  const dogIds = (myDogs ?? []).map((d) => d.id);
  if (dogIds.length > 0) {
    const { count } = await supabase
      .from("match_requests")
      .select("id", { count: "exact", head: true })
      .in("dog_id", dogIds)
      .eq("status", "pending");
    pendingCount = count ?? 0;
  }

  return (
    <div className="flex min-h-svh flex-col">
      <AppNav pendingCount={pendingCount} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-7 sm:px-6">
        {children}
      </main>
    </div>
  );
}
