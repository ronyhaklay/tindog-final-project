import Image from "next/image";
import Link from "next/link";
import {
  HeartHandshakeIcon,
  PawPrintIcon,
  SearchIcon,
  ShieldCheckIcon,
  SparklesIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

const features = [
  {
    icon: SearchIcon,
    title: "Discover with context",
    text: "Browse dogs by city, size, energy level and compatibility — not just a photo and a name.",
  },
  {
    icon: HeartHandshakeIcon,
    title: "Thoughtful requests",
    text: "A right swipe sends an adoption request with your profile, lifestyle and home details.",
  },
  {
    icon: ShieldCheckIcon,
    title: "Chat after approval",
    text: "Dog owners review each request first. Once approved, a private conversation opens.",
  },
];

export default async function LandingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <main className="flex min-h-svh flex-col overflow-hidden">
      <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
        <Link href="/" className="flex items-center gap-2.5">
          <Image src="/logo.png" alt="TinDog logo" width={42} height={42} className="rounded-2xl shadow-sm" />
          <span className="text-xl font-extrabold tracking-tight">tin<span className="text-primary">dog</span></span>
        </Link>
        <nav className="flex items-center gap-2">
          {user ? (
            <Link href="/swipe"><Button>Open app</Button></Link>
          ) : (
            <>
              <Link href="/login"><Button variant="ghost">Log in</Button></Link>
              <Link href="/signup"><Button>Sign up</Button></Link>
            </>
          )}
        </nav>
      </header>

      <section className="relative mx-auto grid w-full max-w-6xl flex-1 items-center gap-10 px-5 py-12 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:py-20">
        <div className="relative z-10">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-white/75 px-3 py-1.5 text-sm font-medium text-primary shadow-sm backdrop-blur">
            <SparklesIcon className="size-4" /> Find your forever match
          </div>
          <h1 className="max-w-3xl text-5xl font-black leading-[0.98] tracking-[-0.045em] sm:text-6xl lg:text-7xl">
            Swipe less randomly. <span className="text-primary">Adopt more meaningfully.</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground sm:text-xl">
            TinDog helps people discover adoptable dogs whose personality, energy and needs actually fit their life — then connects them with the person caring for the dog.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href={user ? "/swipe" : "/signup"}><Button size="lg" className="h-12 px-6"><PawPrintIcon data-icon="inline-start" />Meet adoptable dogs</Button></Link>
            {!user && <Link href="/login"><Button size="lg" variant="outline" className="h-12 bg-white/70 px-6">I already have an account</Button></Link>}
          </div>
          <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
            <span>✓ Rich dog profiles</span><span>✓ Saved shortlist</span><span>✓ Owner-approved chats</span>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-md lg:max-w-none">
          <div className="absolute -top-10 -left-10 size-52 rounded-full bg-primary/15 blur-3xl" />
          <div className="absolute -right-10 -bottom-10 size-52 rounded-full bg-amber-200/30 blur-3xl" />
          <Card className="relative rotate-2 overflow-hidden border-white/80 bg-white/90 shadow-2xl shadow-rose-200/40">
            <div className="relative aspect-[4/5] bg-gradient-to-br from-rose-100 to-amber-100">
              <div className="absolute inset-0 flex items-center justify-center">
                <Image src="/logo.png" alt="TinDog" width={170} height={170} className="rounded-[36px] opacity-90 shadow-xl" />
              </div>
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/85 to-transparent p-6 pt-24 text-white">
                <div className="mb-2 inline-flex rounded-full bg-white/20 px-3 py-1 text-xs font-semibold backdrop-blur">ADOPTION</div>
                <h2 className="text-3xl font-bold">Meet your match 🐾</h2>
                <p className="mt-1 text-sm text-white/85">Personality first. Forever home next.</p>
              </div>
            </div>
          </Card>
        </div>
      </section>

      <section className="relative z-10 mx-auto grid w-full max-w-6xl gap-4 px-5 pb-20 sm:px-8 md:grid-cols-3">
        {features.map((feature) => (
          <Card key={feature.title} className="border-white/80 bg-white/80 shadow-sm backdrop-blur">
            <CardContent className="flex flex-col items-start gap-3 pt-5">
              <div className="rounded-2xl bg-primary/10 p-2.5 text-primary"><feature.icon className="size-5" /></div>
              <h2 className="text-lg font-semibold">{feature.title}</h2>
              <p className="text-sm leading-6 text-muted-foreground">{feature.text}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <footer className="border-t border-white/70 bg-white/60 px-6 py-5 text-center text-xs text-muted-foreground backdrop-blur">
        TinDog — helping good dogs meet the right humans.
      </footer>
    </main>
  );
}
