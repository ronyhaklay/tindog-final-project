import type { Metadata } from "next";
import { Geist, Geist_Mono, Varela_Round } from "next/font/google";
import { LanguageProvider } from "@/components/language-provider";
import { getLocale } from "@/lib/i18n-server";
import "./globals.css";
import { BackgroundMusic } from "@/components/background-music";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

const varelaRound = Varela_Round({
  weight: "400",
  subsets: ["hebrew", "latin"],
  variable: "--font-varela-round",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "TinDog — Find your dog's next best friend", template: "%s | TinDog" },
  description: "Swipe, match and adopt from shelter-managed dog profiles near you.",
  icons: { icon: "/logo.png" },
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const locale = await getLocale();
  return (
    <html lang={locale} dir={locale === "he" ? "rtl" : "ltr"} className={`${geistSans.variable} ${geistMono.variable} ${varelaRound.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <BackgroundMusic />
        <LanguageProvider initialLocale={locale}>{children}</LanguageProvider>
      </body>
    </html>
  );
}
