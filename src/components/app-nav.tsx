"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  DogIcon,
  FlameIcon,
  InboxIcon,
  LogOutIcon,
  MessageCircleIcon,
  UserIcon,
} from "lucide-react";
import { logout } from "@/actions/auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const items = [
  { href: "/swipe", label: "Swipe", icon: FlameIcon },
  { href: "/dogs", label: "My Dogs", icon: DogIcon },
  { href: "/requests", label: "Requests", icon: InboxIcon },
  { href: "/matches", label: "Matches", icon: MessageCircleIcon },
  { href: "/profile", label: "Profile", icon: UserIcon },
];

export function AppNav({ pendingCount }: { pendingCount: number }) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-4xl items-center justify-between gap-2 px-4 py-2.5">
        <Link href="/swipe" className="flex shrink-0 items-center gap-2">
          <Image
            src="/logo.png"
            alt="TinDog"
            width={30}
            height={30}
            className="rounded-lg"
          />
          <span className="hidden font-bold sm:inline">
            tin<span className="text-primary">dog</span>
          </span>
        </Link>

        <nav className="flex items-center gap-0.5 sm:gap-1">
          {items.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium transition-colors sm:px-3",
                  active
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className="size-4" />
                <span className="hidden md:inline">{item.label}</span>
                {item.href === "/requests" && pendingCount > 0 && (
                  <Badge className="h-4 min-w-4 rounded-full px-1 text-[10px]">
                    {pendingCount}
                  </Badge>
                )}
              </Link>
            );
          })}
        </nav>

        <form action={logout}>
          <Button
            type="submit"
            variant="ghost"
            size="icon"
            aria-label="Log out"
          >
            <LogOutIcon />
          </Button>
        </form>
      </div>
    </header>
  );
}
