"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Character } from "@/lib/character/types";
import { getCharacterRepository } from "@/lib/character/storage";

export function useCharacter(id: string) {
  const [character, setCharacter] = useState<Character | null | undefined>(undefined);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let active = true;
    getCharacterRepository()
      .get(id)
      .then((c) => {
        if (active) setCharacter(c ?? null);
      });
    return () => {
      active = false;
    };
  }, [id]);

  const update = useCallback((patch: Partial<Character> | ((prev: Character) => Partial<Character>)) => {
    setCharacter((prev) => {
      if (!prev) return prev;
      const resolved = typeof patch === "function" ? patch(prev) : patch;
      const next = { ...prev, ...resolved };
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        getCharacterRepository().save(next);
      }, 400);
      return next;
    });
  }, []);

  return { character, update };
}
