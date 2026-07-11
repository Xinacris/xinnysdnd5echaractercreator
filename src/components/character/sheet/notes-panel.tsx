"use client";

import type { Character, CharacterNotes } from "@/lib/character/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useContentLanguage } from "@/lib/i18n/content-language";

const FIELDS: { key: keyof CharacterNotes; label: [string, string] }[] = [
  { key: "personalityTraits", label: ["Personality Traits", "Kişilik Özellikleri"] },
  { key: "ideals", label: ["Ideals", "İdealler"] },
  { key: "bonds", label: ["Bonds", "Bağlar"] },
  { key: "flaws", label: ["Flaws", "Kusurlar"] },
  { key: "alliesAndOrganizations", label: ["Allies and Organizations", "Müttefikler ve Organizasyonlar"] },
  { key: "additionalFeatures", label: ["Additional Features", "Ek Özellikler"] },
  { key: "backstory", label: ["Backstory", "Geçmiş Hikaye"] },
];

export function NotesPanel({
  character,
  onUpdate,
}: {
  character: Character;
  onUpdate: (patch: Partial<Character>) => void;
}) {
  const { t } = useContentLanguage();

  function setNote(key: keyof CharacterNotes, value: string) {
    onUpdate({ notes: { ...character.notes, [key]: value } });
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {FIELDS.map(({ key, label }) => (
        <Card key={key} className={key === "backstory" ? "md:col-span-2" : undefined}>
          <CardHeader>
            <CardTitle className="text-base">
              <Label>{t(label[0], label[1])}</Label>
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
