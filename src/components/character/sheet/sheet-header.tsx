"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Copy, Download, MoreVertical, Trash2 } from "lucide-react";
import type { Character } from "@/lib/character/types";
import { totalCharacterLevel } from "@/lib/character/calculations";
import { slugToTitle } from "@/lib/slug";
import { exportCharacterToJson, getCharacterRepository } from "@/lib/character/storage";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function SheetHeader({
  character,
  onUpdate,
  onLevelUp,
}: {
  character: Character;
  onUpdate: (patch: Partial<Character>) => void;
  onLevelUp: () => void;
}) {
  const router = useRouter();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const classSummary = character.classes.map((c) => `${slugToTitle(c.classIndex)} ${c.level}`).join(" / ");

  async function handleDelete() {
    await getCharacterRepository().remove(character.id);
    toast.success("Karakter silindi.");
    router.push("/");
  }

  async function handleDuplicate() {
    const copy: Character = {
      ...character,
      id: crypto.randomUUID(),
      name: `${character.name} (Kopya)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await getCharacterRepository().save(copy);
    toast.success("Karakter kopyalandı.");
    router.push(`/karakter/${copy.id}`);
  }

  function handleExport() {
    const json = exportCharacterToJson(character);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${character.name || "karakter"}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex flex-col gap-3 border-b border-border pb-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <Input
          value={character.name}
          onChange={(e) => onUpdate({ name: e.target.value })}
          className="max-w-md border-none px-0 text-2xl font-semibold shadow-none focus-visible:ring-0"
          placeholder="Karakter Adı"
        />
        <div className="flex items-center gap-2">
          <Button onClick={onLevelUp}>Seviye Atla</Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleDuplicate}>
                <Copy className="h-4 w-4" /> Kopyala
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExport}>
                <Download className="h-4 w-4" /> Dışa Aktar (JSON)
              </DropdownMenuItem>
              <DropdownMenuItem variant="destructive" onClick={() => setConfirmDelete(true)}>
                <Trash2 className="h-4 w-4" /> Sil
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5">
        <Badge variant="secondary">{character.edition === "2024" ? "D&D 5.5e" : "D&D 5e"}</Badge>
        <Badge variant="secondary">
          {slugToTitle(character.subraceIndex ?? character.raceIndex ?? "")}
        </Badge>
        <Badge variant="secondary">
          Seviye {totalCharacterLevel(character)} · {classSummary}
        </Badge>
        {(character.customBackgroundName || character.backgroundIndex) && (
          <Badge variant="secondary">
            {character.customBackgroundName ?? slugToTitle(character.backgroundIndex ?? "")}
          </Badge>
        )}
      </div>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Karakteri sil</AlertDialogTitle>
            <AlertDialogDescription>
              &quot;{character.name}&quot; kalıcı olarak silinecek. Bu işlem geri alınamaz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Vazgeç</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Sil</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
