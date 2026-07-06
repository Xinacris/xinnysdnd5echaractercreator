"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { createBlankCharacter } from "@/lib/character/factory";
import type { Character } from "@/lib/character/types";

interface WizardContextValue {
  draft: Character;
  setDraft: React.Dispatch<React.SetStateAction<Character>>;
  update: (patch: Partial<Character>) => void;
}

const WizardContext = createContext<WizardContextValue | null>(null);

export function WizardProvider({ children }: { children: ReactNode }) {
  const [draft, setDraft] = useState<Character>(() => createBlankCharacter("2014"));

  const value = useMemo<WizardContextValue>(
    () => ({
      draft,
      setDraft,
      update: (patch) => setDraft((prev) => ({ ...prev, ...patch })),
    }),
    [draft]
  );

  return <WizardContext.Provider value={value}>{children}</WizardContext.Provider>;
}

export function useWizard() {
  const ctx = useContext(WizardContext);
  if (!ctx) throw new Error("useWizard must be used within WizardProvider");
  return ctx;
}
