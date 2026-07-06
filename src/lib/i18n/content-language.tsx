"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type ContentLanguage = "en" | "tr";

const STORAGE_KEY = "dnd-character-creator:content-language";

const ContentLanguageContext = createContext<{
  language: ContentLanguage;
  setLanguage: (l: ContentLanguage) => void;
} | null>(null);

/**
 * Global (not per-character) preference for which language SRD spell/feature/trait
 * descriptions render in. Defaults to English since only a subset of content has a
 * Turkish translation so far — callers fall back to English automatically when a
 * translation is missing, so this only needs to track what the user asked for.
 */
export function ContentLanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<ContentLanguage>("en");

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "en" || stored === "tr") {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate from localStorage after mount
      setLanguageState(stored);
    }
  }, []);

  function setLanguage(l: ContentLanguage) {
    setLanguageState(l);
    window.localStorage.setItem(STORAGE_KEY, l);
  }

  return (
    <ContentLanguageContext.Provider value={{ language, setLanguage }}>{children}</ContentLanguageContext.Provider>
  );
}

export function useContentLanguage() {
  const ctx = useContext(ContentLanguageContext);
  if (!ctx) throw new Error("useContentLanguage must be used within ContentLanguageProvider");
  return ctx;
}
