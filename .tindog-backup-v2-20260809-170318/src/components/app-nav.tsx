"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookmarkIcon,
  DogIcon,
  InboxIcon,
  LogOutIcon,
  MessageCircleIcon,
  SparklesIcon,
  UserIcon,
} from "lucide-react";
import { logout } from "@/actions/auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const items = [
  { href: "/swipe", label: "Discover", icon: SparklesIcon },
  { href: "/favorites", label: "Saved", icon: BookmarkIcon },
  { href: "/dogs", label: "My listings", icon: DogIcon },
  { href: "/requests", label: "Requests", icon: InboxIcon },
  { href: "/matches", label: "Chats", icon: MessageCircleIcon },
  { href: "/profile", label: "Profile", icon: UserIcon },
];

export function AppNav({ pendingCount }: { pendingCount: number }) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-white/70 bg-white/80 shadow-sm shadow-rose-100/30 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-2 px-4 py-2.5">
        <Link href="/swipe" className="flex shrink-0 items-center gap-2 rounded-xl pr-2 transition-opacity hover:opacity-80">
          <Image src="/logo.png" alt="TinDog" width={34} height={34} className="rounded-xl shadow-sm" />
          <span className="hidden text-lg font-extrabold tracking-tight sm:inline">
            tin<span className="text-primary">dog</span>
          </span>
        </Link>

        <nav className="flex min-w-0 flex-1 items-center justify-center gap-0.5 overflow-x-auto px-1 sm:gap-1">
          {items.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                title={item.label}
                className={cn(
                  "relative flex shrink-0 items-center gap-1.5 rounded-xl px-2.5 py-2 text-sm font-medium transition-all sm:px-3",
                  active
                    ? "bg-primary/10 text-primary shadow-sm"
                    : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                )}
              >
                <item.icon className="size-4" />
                <span className="hidden lg:inline">{item.label}</span>
                {item.href === "/requests" && pendingCount > 0 && (
                  <Badge className="h-4 min-w-4 rounded-full px-1 text-[10px]">{pendingCount}</Badge>
                )}
              </Link>
            );
          })}
        </nav>

        <form action={logout}>
          <Button type="submit" variant="ghost" size="icon" aria-label="Log out" className="rounded-xl">
            <LogOutIcon />
          </Button>
        </form>
      </div>
    </header>
  );
}
