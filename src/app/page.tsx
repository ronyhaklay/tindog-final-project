import Image from "next/image";
import Link from "next/link";
import { HeartIcon, HomeIcon, PawPrintIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

const features = [
  {
    icon: HomeIcon,
    title: "Adoption & Foster",
    text: "Browse dogs looking for a permanent home or a temporary foster family, each with a full personality profile.",
  },
  {
    icon: PawPrintIcon,
    title: "Playdates",
    text: "Match your dog with compatible friends nearby based on size, energy level, and temperament.",
  },
  {
    icon: HeartIcon,
    title: "Swipe & Chat",
    text: "Swipe right to send a request. When the owner approves, a private chat opens to plan the next step.",
  },
];

export default async function LandingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="flex flex-1 flex-col">
      <header className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2">
          <Image src="/logo.png" alt="TinDog logo" width={36} height={36} className="rounded-lg" />
          <span className="text-lg font-bold">
            tin<span className="text-primary">dog</span>
          </span>
        </div>
        <nav className="flex items-center gap-2">
          {user ? (
            <Link href="/swipe">
              <Button>Open app</Button>
            </Link>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost">Log in</Button>
              </Link>
              <Link href="/signup">
                <Button>Sign up</Button>
              </Link>
            </>
          )}
        </nav>
      </header>

      <section className="mx-auto flex w-full max-w-4xl flex-col items-center px-6 py-16 text-center">
        <Image
          src="/logo.png"
          alt="TinDog"
          width={140}
          height={140}
          priority
          className="mb-6 rounded-3xl"
        />
        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
          Every dog deserves a<span className="text-primary"> match</span>
        </h1>
        <p className="mt-4 max-w-xl text-lg text-muted-foreground">
          Swipe through dogs looking for a forever home, a foster family, or
          just a friend for the park. Get to know their personality before you
          meet.
        </p>
        <div className="mt-8 flex gap-3">
          <Link href="/signup">
            <Button size="lg" className="px-6">
              Start swiping
            </Button>
          </Link>
          <Link href="/login">
            <Button size="lg" variant="outline" className="px-6">
              I have an account
            </Button>
          </Link>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-4xl gap-4 px-6 pb-20 sm:grid-cols-3">
        {features.map((f) => (
          <Card key={f.title}>
            <CardContent className="flex flex-col items-start gap-3">
              <div className="rounded-lg bg-accent p-2 text-primary">
                <f.icon className="size-5" />
              </div>
              <h2 className="font-semibold">{f.title}</h2>
              <p className="text-sm text-muted-foreground">{f.text}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <footer className="mt-auto border-t px-6 py-4 text-center text-xs text-muted-foreground">
        TinDog — Internet Technologies final project, RUNI CS 2026
      </footer>
    </main>
  );
}
