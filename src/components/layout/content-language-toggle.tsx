"use client";

import { useContentLanguage } from "@/lib/i18n/content-language";
import { Button } from "@/components/ui/button";

/** Switches the language the whole site (UI chrome and SRD content) renders in. */
export function ContentLanguageToggle() {
  const { language, setLanguage } = useContentLanguage();

  return (
    <div className="flex items-center gap-0.5 rounded-md border border-border p-0.5">
      <Button
        size="sm"
        variant={language === "en" ? "default" : "ghost"}
        className="h-6 px-2 text-xs"
        onClick={() => setLanguage("en")}
      >
        EN
      </Button>
      <Button
        size="sm"
        variant={language === "tr" ? "default" : "ghost"}
        className="h-6 px-2 text-xs"
        onClick={() => setLanguage("tr")}
      >
        TR
      </Button>
    </div>
  );
}
