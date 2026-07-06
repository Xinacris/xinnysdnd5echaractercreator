import type { Character } from "./types";

const STORAGE_KEY = "dnd-character-creator:characters:v1";

/**
 * Storage contract for characters. `LocalStorageCharacterRepository` is the only
 * implementation today; when a backend exists, add an `ApiCharacterRepository`
 * implementing the same interface and swap it in `getCharacterRepository()` below
 * — no UI code needs to change.
 */
export interface CharacterRepository {
  list(): Promise<Character[]>;
  get(id: string): Promise<Character | undefined>;
  save(character: Character): Promise<void>;
  remove(id: string): Promise<void>;
}

function readAll(): Character[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAll(characters: Character[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(characters));
}

export class LocalStorageCharacterRepository implements CharacterRepository {
  async list(): Promise<Character[]> {
    return readAll().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  async get(id: string): Promise<Character | undefined> {
    return readAll().find((c) => c.id === id);
  }

  async save(character: Character): Promise<void> {
    const all = readAll();
    const idx = all.findIndex((c) => c.id === character.id);
    const updated = { ...character, updatedAt: new Date().toISOString() };
    if (idx >= 0) all[idx] = updated;
    else all.push(updated);
    writeAll(all);
  }

  async remove(id: string): Promise<void> {
    writeAll(readAll().filter((c) => c.id !== id));
  }
}

let repository: CharacterRepository | null = null;

export function getCharacterRepository(): CharacterRepository {
  if (!repository) repository = new LocalStorageCharacterRepository();
  return repository;
}

export function exportCharacterToJson(character: Character): string {
  return JSON.stringify(character, null, 2);
}

export function importCharacterFromJson(json: string): Character {
  const parsed = JSON.parse(json);
  if (!parsed || typeof parsed !== "object" || !parsed.id || !parsed.name) {
    throw new Error("Geçersiz karakter dosyası");
  }
  return parsed as Character;
}
