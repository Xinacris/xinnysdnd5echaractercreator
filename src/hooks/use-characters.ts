"use client";

import { useCallback, useEffect, useState } from "react";
import type { Character } from "@/lib/character/types";
import { getCharacterRepository } from "@/lib/character/storage";

export function useCharacters() {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const list = await getCharacterRepository().list();
    setCharacters(list);
    setLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial load from localStorage on mount
    refresh();
  }, [refresh]);

  const remove = useCallback(
    async (id: string) => {
      await getCharacterRepository().remove(id);
      await refresh();
    },
    [refresh]
  );

  const duplicate = useCallback(
    async (character: Character) => {
      const copy: Character = {
        ...character,
        id: crypto.randomUUID(),
        name: `${character.name} (Kopya)`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await getCharacterRepository().save(copy);
      await refresh();
      return copy;
    },
    [refresh]
  );

  return { characters, loading, refresh, remove, duplicate };
}
