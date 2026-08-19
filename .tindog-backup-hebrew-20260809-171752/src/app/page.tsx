import Image from "next/image";
import Link from "next/link";
import { Building2Icon, HeartHandshakeIcon, PawPrintIcon, VideoIcon, SearchIcon, ShieldCheckIcon, SparklesIcon, Volume2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

const features = [
  { icon: SearchIcon, title: "Lifestyle matching", text: "See a fit score based on energy, home, kids, pets and dog size — not just a cute photo." },
  { icon: VideoIcon, title: "Meet the real dog", text: "Profiles can include photos, a short video and even a tiny bark recording." },
  { icon: HeartHandshakeIcon, title: "Shelter-approved matches", text: "Shelters review interested adopters. Approval unlocks a private chat and a full-screen match moment." },
];

export default async function LandingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return (
    <main className="relative flex min-h-svh flex-col overflow-hidden">
      <div aria-hidden className="tindog-paw-bg" />
      <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
        <Link href="/" className="flex items-center gap-2.5"><Image src="/logo.png" alt="TinDog logo" width={42} height={42} className="rounded-2xl shadow-sm" /><span className="text-xl font-extrabold tracking-tight">tin<span className="text-primary">dog</span></span></Link>
        <nav className="flex items-center gap-2">{user ? <Link href="/swipe"><Button>Open app</Button></Link> : <><Link href="/login"><Button variant="ghost">Log in</Button></Link><Link href="/signup"><Button>Sign up</Button></Link></>}</nav>
      </header>

      <section className="relative z-10 mx-auto grid w-full max-w-6xl flex-1 items-center gap-10 px-5 py-12 sm:px-8 lg:grid-cols-[1.05fr_.95fr] lg:py-20">
        <div>
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-white/80 px-3 py-1.5 text-sm font-semibold text-primary shadow-sm backdrop-blur"><SparklesIcon className="size-4" />Swipe. Falling in love. Adopt. 🐾</div>
          <h1 className="max-w-3xl text-5xl font-black leading-[.98] tracking-[-.055em] sm:text-6xl lg:text-7xl">Welcome to TinDog!<span className="text-primary">The app that will find you a spot in heaven and your new best friend.</span></h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground sm:text-xl">It is based on a smart algorithm and professional oversight by the country's dog rescue organization operators, ensuring you can rely on the dogs' health and the platform's reliability. For any questions or issues, please contact us via email at: tindog@lovedogs.com</p>
          <div className="mt-8 flex flex-wrap gap-3"><Link href={user ? "/swipe" : "/signup"}><Button size="lg" className="h-12 px-6"><PawPrintIcon data-icon="inline-start" />Meet adoptable dogs</Button></Link><Link href={user ? "/profile" : "/signup"}><Button size="lg" variant="outline" className="h-12 bg-white/75 px-6"><Building2Icon data-icon="inline-start" />I&apos;m a shelter</Button></Link></div>
          <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground"><span>✓ Shelter-managed listings</span><span>✓ Video + bark profiles</span><span>✓ Private approved chats</span></div>
        </div>

        <div className="relative mx-auto w-full max-w-md lg:max-w-none">
          <div className="absolute -top-10 -left-10 size-52 rounded-full bg-primary/15 blur-3xl" /><div className="absolute -right-10 -bottom-10 size-52 rounded-full bg-amber-200/35 blur-3xl" />
          <Card className="relative rotate-2 overflow-hidden border-white/80 bg-white/90 shadow-2xl shadow-rose-200/40">
            <div className="relative aspect-[4/5] bg-gradient-to-br from-rose-100 via-white to-amber-100">
              <div className="absolute inset-0 flex items-center justify-center"><Image src="/logo.png" alt="TinDog" width={170} height={170} className="rounded-[36px] opacity-90 shadow-xl" /></div>
              <div className="absolute left-5 top-5 flex gap-2"><span className="rounded-full bg-white/80 px-3 py-1 text-xs font-bold text-primary shadow"><VideoIcon className="mr-1 inline size-3" />VIDEO</span><span className="rounded-full bg-white/80 px-3 py-1 text-xs font-bold text-primary shadow"><Volume2Icon className="mr-1 inline size-3" />BARK</span></div>
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/85 to-transparent p-6 pt-24 text-white"><div className="mb-2 inline-flex rounded-full bg-white/20 px-3 py-1 text-xs font-semibold backdrop-blur">94% LIFESTYLE FIT</div><h2 className="text-3xl font-bold">Meet your match 🐾</h2><p className="mt-1 text-sm text-white/85">Personality first. Forever home next.</p></div>
            </div>
          </Card>
        </div>
      </section>

      <section className="relative z-10 mx-auto grid w-full max-w-6xl gap-4 px-5 pb-10 sm:px-8 md:grid-cols-3">{features.map((feature) => <Card key={feature.title} className="border-white/80 bg-white/82 shadow-sm backdrop-blur"><CardContent className="flex flex-col items-start gap-3 pt-5"><div className="rounded-2xl bg-primary/10 p-2.5 text-primary"><feature.icon className="size-5" /></div><h2 className="text-lg font-semibold">{feature.title}</h2><p className="text-sm leading-6 text-muted-foreground">{feature.text}</p></CardContent></Card>)}</section>
      <section className="relative z-10 mx-auto mb-20 flex w-[calc(100%-2.5rem)] max-w-6xl flex-wrap items-center justify-between gap-4 rounded-[28px] bg-slate-950 px-6 py-6 text-white sm:px-8"><div><p className="flex items-center gap-2 font-bold"><ShieldCheckIcon className="size-5 text-emerald-400" />Built around responsible adoption</p><p className="mt-1 text-sm text-white/65">Only shelter manager accounts can publish or edit dog listings.</p></div><div className="text-4xl">🐶 🐾 🦴</div></section>
      <footer className="relative z-10 border-t border-white/70 bg-white/60 px-6 py-5 text-center text-xs text-muted-foreground backdrop-blur">TinDog — helping good dogs meet the right humans.</footer>
    </main>
  );
}
