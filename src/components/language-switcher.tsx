"use client";

import { LanguagesIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/components/language-provider";

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { isHebrew, toggleLocale } = useLanguage();
  return (
    <Button
      type="button"
      variant="outline"
      size={compact ? "sm" : "default"}
      onClick={toggleLocale}
      className="rounded-xl bg-white/80 shadow-sm backdrop-blur"
      aria-label={isHebrew ? "Switch to English" : "עבור לעברית"}
      title={isHebrew ? "Switch to English" : "עבור לעברית"}
    >
      <LanguagesIcon className="size-4" />
      <span>{isHebrew ? "EN" : "עברית"}</span>
    </Button>
  );
}
