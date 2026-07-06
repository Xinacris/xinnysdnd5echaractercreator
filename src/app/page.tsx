"use client";

import Link from "next/link";
import { PlusCircle, Swords } from "lucide-react";
import { useCharacters } from "@/hooks/use-characters";
import { CharacterCard } from "@/components/character/character-card";
import { ImportCharacterButton } from "@/components/character/import-character-button";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export default function HomePage() {
  const { characters, loading, refresh, remove, duplicate } = useCharacters();

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Karakterlerim</h1>
          <p className="text-sm text-muted-foreground">
            Karakterlerin bu tarayıcıda saklanır. Yedeklemek için dışa aktarabilirsin.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ImportCharacterButton onImported={refresh} />
          <Button asChild>
            <Link href="/karakter/yeni">
              <PlusCircle className="h-4 w-4" />
              Yeni Karakter
            </Link>
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>
      ) : characters.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-border py-24 text-center">
          <Swords className="h-10 w-10 text-muted-foreground" />
          <div>
            <p className="font-medium">Henüz karakter yok</p>
            <p className="text-sm text-muted-foreground">Maceraya başlamak için ilk karakterini oluştur.</p>
          </div>
          <Button asChild>
            <Link href="/karakter/yeni">
              <PlusCircle className="h-4 w-4" />
              Yeni Karakter Oluştur
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {characters.map((c) => (
            <CharacterCard key={c.id} character={c} onDelete={remove} onDuplicate={duplicate} />
          ))}
        </div>
      )}
    </div>
  );
}
