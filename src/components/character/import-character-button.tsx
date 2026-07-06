"use client";

import { useRef } from "react";
import { Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { getCharacterRepository, importCharacterFromJson } from "@/lib/character/storage";

export function ImportCharacterButton({ onImported }: { onImported: () => void }) {
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const text = await file.text();
      const character = importCharacterFromJson(text);
      await getCharacterRepository().save(character);
      onImported();
      toast.success(`"${character.name}" içe aktarıldı`);
    } catch {
      toast.error("Karakter dosyası okunamadı. Geçerli bir JSON dosyası seçin.");
    }
  }

  return (
    <>
      <input ref={inputRef} type="file" accept="application/json" className="hidden" onChange={handleFile} />
      <Button variant="outline" onClick={() => inputRef.current?.click()}>
        <Upload className="h-4 w-4" />
        İçe Aktar
      </Button>
    </>
  );
}
