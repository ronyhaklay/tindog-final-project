import Image from "next/image";
import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="relative flex min-h-svh flex-1 flex-col items-center justify-center overflow-hidden px-4 py-12">
      <div className="absolute -top-32 -left-20 size-80 rounded-full bg-rose-200/35 blur-3xl" />
      <div className="absolute -right-20 -bottom-32 size-80 rounded-full bg-amber-200/35 blur-3xl" />
      <Link href="/" className="relative z-10 mb-6 flex flex-col items-center gap-2">
        <Image src="/logo.png" alt="TinDog" width={76} height={76} className="rounded-3xl shadow-lg shadow-rose-200/40" />
        <span className="text-2xl font-extrabold tracking-tight">tin<span className="text-primary">dog</span></span>
        <span className="text-xs text-muted-foreground">Find your forever match</span>
      </Link>
      <div className="relative z-10 w-full max-w-md">{children}</div>
    </main>
  );
}
