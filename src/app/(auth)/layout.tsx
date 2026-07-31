import Image from "next/image";
import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-12">
      <Link href="/" className="mb-6 flex flex-col items-center gap-2">
        <Image
          src="/logo.png"
          alt="TinDog"
          width={72}
          height={72}
          className="rounded-2xl"
        />
        <span className="text-xl font-bold">
          tin<span className="text-primary">dog</span>
        </span>
      </Link>
      <div className="w-full max-w-sm">{children}</div>
    </main>
  );
}
