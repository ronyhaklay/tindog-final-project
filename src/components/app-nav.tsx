"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookmarkIcon, Building2Icon, DogIcon, InboxIcon, LogOutIcon, MessageCircleIcon, SparklesIcon, UserIcon } from "lucide-react";
import { logout } from "@/actions/auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/language-switcher";
import { useLanguage } from "@/components/language-provider";
import type { UserRole } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function AppNav({ role, pendingCount, newMatchCount, shelterName }: { role: UserRole; pendingCount: number; newMatchCount: number; shelterName?: string | null }) {
  const pathname = usePathname();
  const { isHebrew } = useLanguage();
  const adopterItems = [
    { href: "/swipe", label: isHebrew ? "לגלות" : "Discover", icon: SparklesIcon },
    { href: "/favorites", label: isHebrew ? "שמורים" : "Saved", icon: BookmarkIcon },
    { href: "/matches", label: isHebrew ? "התאמות" : "Matches", icon: MessageCircleIcon },
    { href: "/profile", label: isHebrew ? "פרופיל" : "Profile", icon: UserIcon },
  ];
  const shelterItems = [
    { href: "/shelter", label: isHebrew ? "עמותה" : "Shelter", icon: Building2Icon },
    { href: "/dogs", label: isHebrew ? "כלבים" : "Dogs", icon: DogIcon },
    { href: "/requests", label: isHebrew ? "בקשות" : "Requests", icon: InboxIcon },
    { href: "/matches", label: isHebrew ? "צ׳אטים" : "Chats", icon: MessageCircleIcon },
    { href: "/profile", label: isHebrew ? "פרופיל" : "Profile", icon: UserIcon },
  ];
  const items = role === "shelter_admin" ? shelterItems : adopterItems;

  return (
    <header className="sticky top-0 z-40 border-b border-white/70 bg-white/82 shadow-sm shadow-rose-100/30 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-2 px-4 py-2.5">
        <Link href={role === "shelter_admin" ? "/shelter" : "/swipe"} className="flex shrink-0 items-center gap-2 rounded-xl px-2 transition-opacity hover:opacity-80" href="/">
          <Image src="/logo.png" alt="TinDog" width={34} height={34} className="rounded-xl shadow-sm" />
          <div className="hidden sm:block">
            <div className="text-lg font-extrabold leading-none tracking-tight">tin<span className="text-primary">dog</span></div>
            {role === "shelter_admin" && shelterName && <div className="mt-0.5 max-w-32 truncate text-[10px] font-medium text-muted-foreground">{shelterName}</div>}
          </div>
        </Link>

        <nav className="flex min-w-0 flex-1 items-center justify-center gap-0.5 overflow-x-auto px-1 sm:gap-1">
          {items.map((item) => {
            const active = pathname.startsWith(item.href);
            const count = item.href === "/requests" ? pendingCount : item.href === "/matches" ? newMatchCount : 0;
            return (
              <Link key={item.href} href={item.href} title={item.label} className={cn("relative flex shrink-0 items-center gap-1.5 rounded-xl px-2.5 py-2 text-sm font-medium transition-all sm:px-3", active ? "bg-primary/10 text-primary shadow-sm" : "text-muted-foreground hover:bg-muted/70 hover:text-foreground")}>
                <item.icon className="size-4" /><span className="hidden lg:inline">{item.label}</span>
                {count > 0 && <Badge className="h-4 min-w-4 rounded-full px-1 text-[10px]">{count}</Badge>}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-1">
          <LanguageSwitcher compact />
          <form action={logout}><Button type="submit" variant="ghost" size="icon" aria-label={isHebrew ? "התנתקות" : "Log out"} title={isHebrew ? "התנתקות" : "Log out"} className="rounded-xl"><LogOutIcon /></Button></form>
        </div>
      </div>
    </header>
  );
}
