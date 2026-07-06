"use client";

import type { Character, CharacterNotes } from "@/lib/character/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

const FIELDS: { key: keyof CharacterNotes; label: string }[] = [
  { key: "personalityTraits", label: "Kişilik Özellikleri" },
  { key: "ideals", label: "İdealler" },
  { key: "bonds", label: "Bağlar" },
  { key: "flaws", label: "Kusurlar" },
  { key: "alliesAndOrganizations", label: "Müttefikler ve Organizasyonlar" },
  { key: "additionalFeatures", label: "Ek Özellikler" },
  { key: "backstory", label: "Geçmiş Hikaye" },
];

export function NotesPanel({
  character,
  onUpdate,
}: {
  character: Character;
  onUpdate: (patch: Partial<Character>) => void;
}) {
  function setNote(key: keyof CharacterNotes, value: string) {
    onUpdate({ notes: { ...character.notes, [key]: value } });
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {FIELDS.map(({ key, label }) => (
        <Card key={key} className={key === "backstory" ? "md:col-span-2" : undefined}>
          <CardHeader>
            <CardTitle className="text-base">
              <Label>{label}</Label>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={character.notes[key]}
              onChange={(e) => setNote(key, e.target.value)}
              rows={key === "backstory" ? 8 : 4}
            />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
